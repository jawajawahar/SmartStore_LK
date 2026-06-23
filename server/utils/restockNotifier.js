const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const PurchaseOrder = require("../models/PurchaseOrder");
const { generatePOPdf } = require("./poGenerator");

// Create nodemailer transport helper
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port == 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return null;
};

const normalizePhoneNumber = (phone) => {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9+]/g, ""); // Remove non-digits except +
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "+94" + cleaned.substring(1);
  }
  if (!cleaned.startsWith("+")) {
    return "+" + cleaned;
  }
  return cleaned;
};

// Send message via Twilio REST API using native fetch
const sendTwilioMessage = async ({ to, body, isWhatsApp, contentSid, contentVariables }) => {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const fromPhone = isWhatsApp ? (process.env.TWILIO_WHATSAPP_NUMBER || "").trim() : (process.env.TWILIO_PHONE_NUMBER || "").trim();

  if (!accountSid || !authToken || !fromPhone) {
    throw new Error("Missing Twilio credentials in environment configuration.");
  }

  const normalizedTo = normalizePhoneNumber(to);
  const normalizedFrom = normalizePhoneNumber(fromPhone);

  const formattedTo = isWhatsApp ? `whatsapp:${normalizedTo}` : normalizedTo;
  const formattedFrom = isWhatsApp ? `whatsapp:${normalizedFrom}` : normalizedFrom;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams();
  params.append("To", formattedTo);
  params.append("From", formattedFrom);
  
  if (isWhatsApp && contentSid) {
    params.append("ContentSid", contentSid);
    if (contentVariables) {
      params.append("ContentVariables", JSON.stringify(contentVariables));
    }
  } else {
    params.append("Body", body);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Twilio REST API error status ${response.status}`);
  }
  return data;
};

/**
 * Checks if a product's stock is low and triggers the preferred notification(s) to the supplier.
 * Refrains from sending if an email was sent for this product in the last 24 hours (unless force=true).
 * 
 * @param {Object} productDoc - The updated product mongoose document
 * @param {Object} options - Config options (e.g. { force: false })
 */
const checkAndNotifyRestock = async (productDoc, options = { force: false }) => {
  try {
    const force = options && options.force;

    // 1. Ensure product is fully populated with supplier details
    let product;
    if (productDoc && productDoc.supplier && typeof productDoc.supplier === "object" && productDoc.supplier.name) {
      product = productDoc;
    } else {
      product = await Product.findById(productDoc._id).populate("supplier");
    }

    if (!product) return;

    // 2. Validate stock levels (skip check if forced manual reorder)
    if (!force && product.stock > product.minStockLevel) {
      return; // Stock is healthy, do nothing
    }

    const supplier = product.supplier;
    if (!supplier) {
      console.log(`[Restock Warning] Product "${product.name}" is low (${product.stock} left), but no supplier is linked.`);
      return;
    }

    const preference = supplier.notificationPreference || "email";
    if (preference === "none") {
      console.log(`[Restock Alert] Automated notifications are disabled (set to "none") for supplier "${supplier.name}".`);
      return;
    }

    // 3. Apply 24-hour rate limit (skip if forced manual reorder)
    if (!force) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (product.lastRestockAlertSent && product.lastRestockAlertSent > oneDayAgo) {
        console.log(`[Restock Rate Limit] Restock notification for "${product.name}" was already sent recently (on ${product.lastRestockAlertSent.toLocaleString()}). Skipping to prevent spam.`);
        return;
      }
    }

    const company = supplier.company || supplier.name;
    const alertBodyText = `Hi ${company}, we need a restock of ${product.name} (SKU: ${product.sku || "N/A"}). Current stock: ${product.stock} ${product.unit || "pcs"} (Safety Threshold: ${product.minStockLevel || 5} ${product.unit || "pcs"}). Please arrange for a batch delivery. Thank you! - SmartStore LK`;

    let notificationsDispatched = [];

    // --- A. EMAIL CHANNEL ---
    if (preference === "email" || preference === "all") {
      if (!supplier.email) {
        console.log(`[Restock Warning] Email alert requested, but supplier "${supplier.name}" has no email address configured.`);
      } else {
        const reorderQty = product.productType === "weighted" ? 10 : Math.max(20, (product.minStockLevel || 5) * 3);
        const unitPrice = product.buyingPrice || 0;
        const totalCost = reorderQty * unitPrice;
        const token = crypto.randomBytes(32).toString("hex");

        // 1. Create Purchase Order document in MongoDB
        const po = new PurchaseOrder({
          product: product._id,
          productName: product.name,
          sku: product.sku || "",
          quantity: reorderQty,
          buyingPrice: unitPrice,
          totalPrice: totalCost,
          supplier: supplier._id,
          status: "pending",
          token,
        });
        await po.save();

        // 2. Compile PDF Purchase Order
        const poFilename = `po-${po._id}.pdf`;
        const poLocalPath = path.join(__dirname, "../uploads/purchase_orders", poFilename);
        await generatePOPdf(po, product, supplier, poLocalPath);

        // Update PDF path in PO document
        po.pdfPath = `/uploads/purchase_orders/${poFilename}`;
        await po.save();

        const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
        const confirmUrl = `${baseUrl}/api/purchase-orders/confirm/${token}`;

        const emailSubject = `[PURCHASE ORDER] Reorder Request #PO-${po._id.toString().slice(-6).toUpperCase()}: ${product.name} (SmartStore LK)`;
        const emailHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; background-color: #ffffff;">
            <!-- Brand Logo Header -->
            <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <div style="display: inline-block; vertical-align: middle;">
                <span style="display: inline-block; width: 36px; height: 36px; line-height: 36px; border-radius: 10px; background-color: #4f46e5; text-align: center; font-size: 18px; font-weight: 950; color: #ffffff;">S</span>
                <span style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin-left: 8px; vertical-align: middle;">SmartStore <span style="font-size: 11px; font-weight: bold; color: #4f46e5; background-color: #eef2ff; padding: 2px 6px; border-radius: 4px; vertical-align: middle;">LK</span></span>
              </div>
            </div>
            
            <h2 style="color: #4f46e5; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 15px;">Purchase Order Reorder Loop</h2>
            <p>Dear <strong>${company}</strong>,</p>
            <p>We require a restock shipment for the following item. A formal Purchase Order has been compiled and attached as a PDF to this email.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #64748b; width: 120px;">Product:</td>
                  <td style="padding-bottom: 10px; font-size: 14px; font-weight: 600; color: #0f172a;">${product.name}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #64748b;">SKU Code:</td>
                  <td style="padding-bottom: 10px; font-size: 13px; font-family: monospace; color: #334155;">${product.sku || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #64748b;">Quantity:</td>
                  <td style="padding-bottom: 10px; font-size: 14px; font-weight: 600; color: #0f172a;">${reorderQty} ${product.unit}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b;">Estimated Cost:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #10b981;">Rs. ${totalCost.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <p style="margin-bottom: 25px;">Please confirm the dispatch shipment details. Click the button below once the restock has been shipped from your facility:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);" target="_blank">Confirm & Ship Restock</a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">If the button above does not work, copy and paste this URL into your browser:<br/>
            <a href="${confirmUrl}" style="color: #4f46e5; word-break: break-all;">${confirmUrl}</a></p>
            
            <div style="margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
              SmartStore LK Platform &bull; Automated Reorder Services &bull; Colombo, Sri Lanka
            </div>
          </div>
        `;

        const transporter = getTransporter();
        const fromAddress = process.env.SMTP_FROM || "no-reply@smartstore.lk";

        if (transporter) {
          console.log(`[Restock System] Dispatching PO email for "${product.name}" with PDF attachment to "${supplier.email}"...`);
          await transporter.sendMail({
            from: `"SmartStore LK Alerts" <${fromAddress}>`,
            to: supplier.email,
            subject: emailSubject,
            html: emailHtml,
            attachments: [
              {
                filename: `Purchase_Order_${po._id.toString().slice(-6).toUpperCase()}.pdf`,
                path: poLocalPath,
              }
            ]
          });
          console.log(`[Restock System] PO email with PDF attachment sent successfully to ${supplier.email}.`);
        } else {
          console.log("\n==================================================");
          console.log("[MOCK RESTOCK PO EMAIL DISPATCHED] (SMTP not configured)");
          console.log(`From: "SmartStore LK Alerts" <${fromAddress}>`);
          console.log(`To: ${supplier.name} <${supplier.email}>`);
          console.log(`Subject: ${emailSubject}`);
          console.log(`PO Link: ${confirmUrl}`);
          console.log(`PDF Path: ${poLocalPath}`);
          console.log("==================================================\n");
        }
        notificationsDispatched.push("email");
      }
    }

    // --- B. SMS (NORMAL MESSAGE) CHANNEL ---
    if (preference === "sms" || preference === "all") {
      if (!supplier.phone) {
        console.log(`[Restock Warning] SMS alert requested, but supplier "${supplier.name}" has no phone number configured.`);
      } else {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

        if (twilioSid && twilioToken && twilioFrom) {
          console.log(`[Restock System] Dispatching restock SMS for "${product.name}" to "${supplier.phone}"...`);
          await sendTwilioMessage({
            to: supplier.phone,
            body: alertBodyText,
            isWhatsApp: false,
          });
          console.log(`[Restock System] Restock SMS sent successfully via Twilio to ${supplier.phone}.`);
        } else {
          console.log("\n==================================================");
          console.log("[MOCK RESTOCK SMS DISPATCHED] (Twilio SMS not configured in .env)");
          console.log(`From: "SmartStore LK Alerts" <${twilioFrom || "MockTwilioSMS"}>`);
          console.log(`To: ${supplier.name} <${supplier.phone}>`);
          console.log(`Message Body: ${alertBodyText}`);
          console.log("==================================================\n");
        }
        notificationsDispatched.push("sms");
      }
    }

    // --- C. WHATSAPP CHANNEL ---
    if (preference === "whatsapp" || preference === "all") {
      if (!supplier.phone) {
        console.log(`[Restock Warning] WhatsApp alert requested, but supplier "${supplier.name}" has no phone number configured.`);
      } else {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioWaFrom = process.env.TWILIO_WHATSAPP_NUMBER;

        if (twilioSid && twilioToken && twilioWaFrom) {
          console.log(`[Restock System] Dispatching restock WhatsApp message for "${product.name}" to "${supplier.phone}"...`);
          await sendTwilioMessage({
            to: supplier.phone,
            body: alertBodyText,
            isWhatsApp: true,
            // Twilio Sandbox approved template: "Thank you for your order. Your delivery is scheduled for {{1}} at {{2}}."
            contentSid: "HX350d429d32e64a552466cafecbe95f3c",
            contentVariables: {
              "1": product.name,
              "2": `(Low stock: ${product.stock})`
            }
          });
          console.log(`[Restock System] Restock WhatsApp sent successfully via Twilio to ${supplier.phone}.`);
        } else {
          console.log("\n==================================================");
          console.log("[MOCK RESTOCK WHATSAPP DISPATCHED] (Twilio WhatsApp not configured in .env)");
          console.log(`From: "SmartStore LK Alerts" <whatsapp:${twilioWaFrom || "MockTwilioWhatsApp"}>`);
          console.log(`To: ${supplier.name} <whatsapp:${supplier.phone}>`);
          console.log(`Message Body: ${alertBodyText}`);
          console.log("==================================================\n");
        }
        notificationsDispatched.push("whatsapp");
      }
    }

    // 4. Update product alert timestamp in DB
    if (notificationsDispatched.length > 0) {
      await Product.findByIdAndUpdate(product._id, {
        lastRestockAlertSent: new Date(),
      });
    }

    return {
      success: true,
      channels: notificationsDispatched,
    };

  } catch (error) {
    console.error(`[Restock Alert Error] Failed to send restock notification for product ${productDoc.name}:`, error);
    throw error;
  }
};

module.exports = {
  checkAndNotifyRestock,
};
