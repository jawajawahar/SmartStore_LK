const express = require("express");

const {
  addSupplier,
  getSuppliers,
  bulkAddSuppliers,
} = require("../controllers/supplierController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/bulk", protect, bulkAddSuppliers);

router.post("/", protect, addSupplier);

router.get("/", protect, getSuppliers);

module.exports = router;
