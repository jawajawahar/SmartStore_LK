const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getPurchaseOrders, confirmPurchaseOrder } = require("../controllers/purchaseOrderController");

// Manager-only endpoint to list purchase orders history
router.get("/", protect, getPurchaseOrders);

// Public supplier click-to-confirm shipment reorders
router.get("/confirm/:token", confirmPurchaseOrder);

module.exports = router;
