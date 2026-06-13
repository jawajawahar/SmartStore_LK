const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generates a styled purchase order PDF for a supplier.
 * @param {Object} purchaseOrder - The Mongoose PurchaseOrder document.
 * @param {Object} product - The Mongoose Product document.
 * @param {Object} supplier - The Mongoose Supplier document.
 * @param {string} outputPath - Local filesystem destination path for the PDF.
 * @returns {Promise<string>} Path to the generated PDF.
 */
const generatePOPdf = (purchaseOrder, product, supplier, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // ─── HEADER BRANDING ──────────────────────────────────────────────────
      doc.fillColor("#4f46e5").fontSize(22).text("SmartStore LK", 50, 50, { lineGap: 4 });
      doc.fillColor("#6b7280").fontSize(9).text("Enterprise POS & Inventory Platform");
      doc.text("Colombo, Sri Lanka");
      doc.text("Email: purchase@smartstore.lk");

      // ─── DOCUMENT TITLE & METADATA ────────────────────────────────────────
      doc.fillColor("#111827").fontSize(20).text("PURCHASE ORDER", 300, 50, { align: "right" });
      doc.fillColor("#374151").fontSize(9);
      doc.text(`PO Date: ${new Date(purchaseOrder.createdAt || Date.now()).toLocaleDateString()}`, 300, 75, { align: "right" });
      doc.text(`PO Number: #PO-${purchaseOrder._id.toString().slice(-6).toUpperCase()}`, 300, 90, { align: "right" });
      doc.text(`Status: PENDING SHIPMENT`, 300, 105, { align: "right" });

      doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, 130).lineTo(550, 130).stroke();

      // ─── VENDOR & SHIPPING DETAILS ─────────────────────────────────────────
      let detailsY = 145;
      doc.fillColor("#111827").fontSize(11).text("VENDOR / SUPPLIER DETAILS", 50, detailsY, { lineGap: 6 });
      doc.fillColor("#374151").fontSize(9);
      doc.text(`Name: ${supplier.name}`);
      doc.text(`Company: ${supplier.company || "N/A"}`);
      doc.text(`Email: ${supplier.email || "N/A"}`);
      doc.text(`Phone: ${supplier.phone || "N/A"}`);

      doc.fillColor("#111827").fontSize(11).text("DELIVERY & BILLING DETAILS", 300, detailsY, { lineGap: 6 });
      doc.fillColor("#374151").fontSize(9);
      doc.text("Store: SmartStore LK - Central Warehouse");
      doc.text("Address: central Depot, Baseline Road");
      doc.text("Colombo, Sri Lanka");
      doc.text("Phone: +94 11 234 5678");

      doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, 235).lineTo(550, 235).stroke();

      // ─── ITEMIZATION TABLE ────────────────────────────────────────────────
      let tableY = 250;
      doc.fillColor("#111827").fontSize(9).text("S.No", 50, tableY);
      doc.text("Item Name / Description", 90, tableY);
      doc.text("SKU Code", 250, tableY);
      doc.text("Order Qty", 340, tableY);
      doc.text("Unit Price", 410, tableY);
      doc.text("Total Price", 480, tableY);

      doc.strokeColor("#9ca3af").lineWidth(1).moveTo(50, tableY + 12).lineTo(550, tableY + 12).stroke();

      let rowY = tableY + 22;
      doc.fillColor("#374151").fontSize(9);
      doc.text("1", 50, rowY);
      doc.text(product.name, 90, rowY);
      doc.text(product.sku || "N/A", 250, rowY);
      doc.text(`${purchaseOrder.quantity} ${product.unit || "pcs"}`, 340, rowY);
      doc.text(`Rs. ${purchaseOrder.buyingPrice.toLocaleString()}`, 410, rowY);
      doc.text(`Rs. ${purchaseOrder.totalPrice.toLocaleString()}`, 480, rowY);

      doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, rowY + 14).lineTo(550, rowY + 14).stroke();

      // ─── GRAND TOTAL SUMMARY ──────────────────────────────────────────────
      let summaryY = rowY + 25;
      doc.fillColor("#111827").fontSize(10).text("Grand Total:", 380, summaryY, { bold: true });
      doc.text(`Rs. ${purchaseOrder.totalPrice.toLocaleString()}`, 480, summaryY, { bold: true });

      // ─── FOOTER & INSTRUCTIONS ────────────────────────────────────────────
      let footerY = summaryY + 50;
      doc.fillColor("#4f46e5").fontSize(11).text("Important Reorder Instructions:", 50, footerY);
      doc.fillColor("#6b7280").fontSize(8);
      doc.text("1. Please review this PO and click the confirmation link in the email to mark as shipped.", 50, footerY + 18);
      doc.text("2. Once marked as shipped, our system will automatically schedule stock arrivals.", 50, footerY + 30);
      doc.text("3. Ensure the billing invoice matches the prices indicated in this Purchase Order.", 50, footerY + 42);

      doc.end();

      writeStream.on("finish", () => {
        resolve(outputPath);
      });
      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePOPdf,
};
