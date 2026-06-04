const express = require("express");

const {
  addSupplier,
  getSuppliers,
} = require("../controllers/supplierController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/", protect, addSupplier);

router.get("/", protect, getSuppliers);

module.exports = router;
