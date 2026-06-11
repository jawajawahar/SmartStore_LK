const express = require("express");
const {
  addPayable,
  getPayables,
  paySupplier,
  updatePayable,
  deletePayable,
} = require("../controllers/supplierPayableController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/", protect, addPayable);

router.get("/", protect, getPayables);

router.put("/:id/pay", protect, paySupplier);

router.put("/:id", protect, updatePayable);

router.delete("/:id", protect, deletePayable);

module.exports = router;
