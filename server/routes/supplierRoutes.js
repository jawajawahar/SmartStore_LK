const express = require("express");
const {
  addSupplier,
  getSuppliers,
  bulkAddSuppliers,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/bulk", protect, bulkAddSuppliers);

router.post("/", protect, addSupplier);

router.get("/", protect, getSuppliers);

router.put("/:id", protect, updateSupplier);

router.delete("/:id", protect, deleteSupplier);

module.exports = router;
