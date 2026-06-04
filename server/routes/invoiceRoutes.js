const express = require("express");

const { getInvoiceDetails } = require("../controllers/invoiceController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:id", protect, getInvoiceDetails);

module.exports = router;
