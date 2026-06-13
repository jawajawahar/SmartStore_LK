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

const sendTwilioWhatsAppReceipt = async ({ to, body, mediaUrl }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.log("\n==================================================");
    console.log("[MOCK CUSTOMER WHATSAPP RECEIPT DISPATCHED] (Twilio not configured in .env)");
    console.log(`To: whatsapp:${to}`);
    console.log(`From: whatsapp:${fromPhone || "MockTwilioWhatsApp"}`);
    console.log(`Media (QR Code URL): ${mediaUrl}`);
    console.log(`Body:\n${body}`);
    console.log("==================================================\n");
    return { mock: true };
  }

  const normalizedTo = normalizePhoneNumber(to);
  const normalizedFrom = normalizePhoneNumber(fromPhone);

  const formattedTo = `whatsapp:${normalizedTo}`;
  const formattedFrom = `whatsapp:${normalizedFrom}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams();
  params.append("To", formattedTo);
  params.append("From", formattedFrom);
  params.append("Body", body);
  if (mediaUrl) {
    params.append("MediaUrl", mediaUrl);
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

const sendCustomerReceipt = async (sale, customerDoc) => {
  try {
    if (!customerDoc || !customerDoc.phone) {
      console.log(`[Receipt Alert] Sale completed, but no customer phone number is associated.`);
      return;
    }

    const itemsText = sale.items
      .map((item, index) => 
        `${index + 1}. ${item.name} - ${item.quantity} x Rs. ${Number(item.price).toLocaleString()} = Rs. ${Number(item.total).toLocaleString()}`
      )
      .join("\n");

    const invoiceNo = sale._id.toString().slice(-6).toUpperCase();
    
    const receiptText = `SmartStore LK Receipt
Invoice: #INV-${invoiceNo}
Date: ${new Date(sale.createdAt || Date.now()).toLocaleString()}
Customer: ${customerDoc.name}
--------------------------
${itemsText}
--------------------------
Total Amount: Rs. ${Number(sale.netAmount).toLocaleString()}
Paid Amount: Rs. ${Number(sale.paidAmount).toLocaleString()}
Remaining Balance: Rs. ${Number(sale.remainingAmount).toLocaleString()}
Payment Method: ${sale.paymentMethod.toUpperCase()}

Thank you for shopping with us!
Scan the attached QR code to verify your purchase receipt details.`;

    // Generate QR code image URL using free API
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(receiptText)}`;

    console.log(`[Receipt System] Dispatching receipt WhatsApp message to customer "${customerDoc.name}" (${customerDoc.phone})...`);
    await sendTwilioWhatsAppReceipt({
      to: customerDoc.phone,
      body: receiptText,
      mediaUrl: qrImageUrl
    });
    console.log(`[Receipt System] Customer receipt WhatsApp dispatched successfully.`);
  } catch (error) {
    console.error("[Receipt System Error] Failed to send customer receipt WhatsApp message:", error.message);
  }
};

module.exports = {
  sendCustomerReceipt
};
