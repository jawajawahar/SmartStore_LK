const nodemailer = require("nodemailer");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");

// Create nodemailer transport helper
const getTransporter = () => {
  // Check if SMTP environment variables are defined
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port == 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }
  
  return null; // Fallback to mock / console logger
};

/**
 * Checks if a product's stock is low and triggers a restock email to the supplier.
 * Refrains from sending if an email was sent for this product in the last 24 hours.
 * 
 * @param {Object} productDoc - The updated product mongoose document
 */
const checkAndNotifyRestock = async (productDoc) => {
  try {
    // 1. Ensure product is fully populated with supplier details
    let product = productDoc;
    if (!product.supplier || !product.supplier.email) {
      product = await Product.findById(productDoc._id).populate("supplier");
    }

    // 2. Validate thresholds and supplier information
    if (!product) return;
    if (product.stock > product.minStockLevel) {
      return; // Stock is healthy, do nothing
    }

    const supplier = product.supplier;
    if (!supplier) {
      console.log(`[Restock Warning] Product "${product.name}" is low (${product.stock} left), but no supplier is linked.`);
      return;
    }

    if (!supplier.email) {
      console.log(`[Restock Warning] Product "${product.name}" is low (${product.stock} left), but supplier "${supplier.name}" has no email address configured.`);
      return;
    }

    // 3. Apply 24-hour rate limit per product
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (product.lastRestockAlertSent && product.lastRestockAlertSent > oneDayAgo) {
      console.log(`[Restock Rate Limit] Restock notification for "${product.name}" was already sent recently (on ${product.lastRestockAlertSent.toLocaleString()}). Skipping to prevent spam.`);
      return;
    }

    // 4. Draft the restock details
    const emailSubject = `[RESTOCK REORDER] Inventory Low Alert: ${product.name} (SmartStore LK)`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #eef2ff; padding-bottom: 10px;">Restock Purchase Order</h2>
        <p>Dear <strong>${supplier.company || supplier.name}</strong>,</p>
        <p>This is an automated notification from <strong>SmartStore LK</strong>.</p>
        <p>Our stock for the following product has fallen below the safety threshold. Please prepare and dispatch a restock batch immediately:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f9fafb;">
            <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px;">Product Details</th>
            <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px;">Safety Threshold</th>
            <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px;">Current Stock</th>
          </tr>
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 13px;">
              <strong>${product.name}</strong><br/>
              <span style="color: #6b7280; font-size: 11px;">SKU: ${product.sku || "N/A"}</span>
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 13px; color: #6b7280;">
              ${product.minStockLevel} ${product.unit}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 13px; font-weight: bold; color: #ef4444;">
              ${product.stock} ${product.unit}
            </td>
          </tr>
        </table>

        <p>Kindly confirm receipt of this restock request and advise us on the estimated delivery date and billing invoice details.</p>
        
        <div style="margin-top: 30px; border-top: 1px dashed #e5e7eb; padding-top: 20px; font-size: 11px; color: #9ca3af; text-align: center;">
          SmartStore LK POS Platform &bull; Colombo, Sri Lanka
        </div>
      </div>
    `;

    // 5. Send notification
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || "no-reply@smartstore.lk";

    if (transporter) {
      console.log(`[Restock System] Dispatching restock email for "${product.name}" to "${supplier.email}"...`);
      await transporter.sendMail({
        from: `"SmartStore LK Alerts" <${fromAddress}>`,
        to: supplier.email,
        subject: emailSubject,
        html: emailHtml,
      });
      console.log(`[Restock System] Restock email sent successfully to ${supplier.email}.`);
    } else {
      // Mock / Console Fallback Logger
      console.log("\n==================================================");
      console.log("[MOCK RESTOCK EMAIL DISPATCHED] (SMTP not configured in .env)");
      console.log(`From: "SmartStore LK Alerts" <${fromAddress}>`);
      console.log(`To: ${supplier.name} <${supplier.email}>`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Content:\nProduct Name: ${product.name}\nSKU: ${product.sku}\nCurrent Stock: ${product.stock} ${product.unit} (Threshold: ${product.minStockLevel})`);
      console.log("==================================================\n");
    }

    // 6. Update product alert timestamp in DB
    await Product.findByIdAndUpdate(product._id, {
      lastRestockAlertSent: new Date(),
    });

  } catch (error) {
    console.error(`[Restock Alert Error] Failed to send restock notification for product ${productDoc.name}:`, error);
  }
};

module.exports = {
  checkAndNotifyRestock,
};
