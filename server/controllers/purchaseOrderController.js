const PurchaseOrder = require("../models/PurchaseOrder");
const Product = require("../models/Product");
const { logAudit } = require("../utils/auditLogger");

// @desc    Get all purchase orders (restricted to admin/manager)
// @route   GET /api/purchase-orders
// @access  Private
const getPurchaseOrders = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== "admin" && userRole !== "manager") {
      return res.status(403).json({ message: "Access denied." });
    }

    const orders = await PurchaseOrder.find()
      .populate("product")
      .populate("supplier")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm shipment by supplier (updates inventory auto)
// @route   GET /api/purchase-orders/confirm/:token
// @access  Public
const confirmPurchaseOrder = async (req, res) => {
  try {
    const { token } = req.params;

    const po = await PurchaseOrder.findOne({ token });
    if (!po) {
      return res.status(404).send(getHtmlTemplate({
        success: false,
        title: "Invalid Link",
        description: "This Purchase Order link is invalid, expired, or incorrect.",
      }));
    }

    if (po.status !== "pending") {
      return res.status(400).send(getHtmlTemplate({
        success: false,
        title: "Already Processed",
        description: `This Purchase Order (#PO-${po._id.toString().slice(-6).toUpperCase()}) was already confirmed and processed. Current status: ${po.status.toUpperCase()}.`,
      }));
    }

    // Update PO status to shipped/completed
    po.status = "completed"; // Since supplier confirmed shipping, we mark arrival & update inventory immediately
    po.shippedAt = new Date();
    po.completedAt = new Date();
    await po.save();

    // Update Product Stock Level
    let product = await Product.findById(po.product);
    let isRecreated = false;

    if (!product) {
      // Recreate product if it was auto-deleted on stock reaching 0
      product = new Product({
        _id: po.product,
        name: po.productName,
        sku: po.sku || `SKU-RESTOCK-${po._id.toString().slice(-6).toUpperCase()}`,
        stock: po.quantity,
        buyingPrice: po.buyingPrice,
        sellingPrice: po.buyingPrice * 1.3, // default markup (30%)
        category: "Restocked",
        unit: "pcs",
        minStockLevel: 5,
        lastRestockAlertSent: null,
      });
      isRecreated = true;
      await product.save();
    } else {
      product.stock += po.quantity;
      product.lastRestockAlertSent = null; // Clear rate limiter so it can warn again in the future
      await product.save();
    }

    // Write Audit Log
    // Create a mock req object since this is triggered publicly by a supplier click
    const mockReq = {
      user: {
        id: po.supplier,
        name: `Supplier Agent (${po.productName})`,
        role: "supplier",
      },
      headers: req.headers,
      socket: req.socket,
    };

    await logAudit({
      req: mockReq,
      action: "status_change",
      entity: "Product",
      entityId: product._id,
      description: `Purchase Order #PO-${po._id.toString().slice(-6).toUpperCase()} confirmed by supplier. Stock levels for "${product.name}" automatically updated (+${po.quantity} restocked). ${isRecreated ? "(Product was auto-recreated)" : ""}`,
      changes: {
        stockAdded: po.quantity,
        newStock: product.stock,
      },
    });

    res.send(getHtmlTemplate({
      success: true,
      poNumber: `PO-${po._id.toString().slice(-6).toUpperCase()}`,
      title: "Shipment Confirmed!",
      description: `Thank you for confirming the shipment of <strong>${po.quantity} pcs of ${po.productName}</strong>. The store inventory has been automatically updated with the restocked items.`,
    }));
  } catch (error) {
    console.error("PO Confirmation Error:", error);
    res.status(500).send(getHtmlTemplate({
      success: false,
      title: "Server Error",
      description: "An unexpected error occurred while confirming your Purchase Order shipment.",
    }));
  }
};

// Help helper to generate HTML response pages
const getHtmlTemplate = ({ success, poNumber, title, description }) => {
  const brandBg = success ? "#ecfdf5" : "#fef2f2";
  const brandColor = success ? "#10b981" : "#ef4444";
  const iconText = success ? "✓" : "✗";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SmartStore LK — Purchase Order Confirmation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background-color: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 40px 30px;
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
          text-align: center;
          max-width: 480px;
          width: 100%;
        }
        .icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background-color: ${brandBg};
          color: ${brandColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: bold;
          margin: 0 auto 24px;
        }
        h1 {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 12px;
        }
        p {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .badge {
          display: inline-block;
          background-color: #312e81;
          color: #818cf8;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 24px;
          border: 1px solid #4338ca;
        }
        .btn {
          display: inline-block;
          background-color: #4f46e5;
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          border: none;
        }
        .btn:hover {
          background-color: #4338ca;
          transform: translateY(-1px);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${iconText}</div>
        ${poNumber ? `<div class="badge">${poNumber} Status Update</div>` : ""}
        <h1>${title}</h1>
        <p>${description}</p>
        <a href="https://smartstore.lk" target="_blank" class="btn">Return to SmartStore LK</a>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  getPurchaseOrders,
  confirmPurchaseOrder,
};
