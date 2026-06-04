const express = require("express");

const {
  addPayable,
  getPayables,
  paySupplier,
} = require("../controllers/supplierPayableController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/", protect, addPayable);

router.get("/", protect, getPayables);

router.put("/:id/pay", protect, paySupplier);

module.exports = router;
