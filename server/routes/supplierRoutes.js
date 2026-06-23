const express = require("express");
const {
  addSupplier,
  getSuppliers,
  bulkAddSuppliers,
  updateSupplier,
  deleteSupplier,
  bulkDeleteSuppliers,
  getSupplierProducts,
} = require("../controllers/supplierController");

const { protect, requireRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/bulk", protect, requireRoles(["admin", "manager"]), bulkAddSuppliers);
router.post("/bulk-delete", protect, requireRoles(["admin", "manager"]), bulkDeleteSuppliers);

router.post("/", protect, requireRoles(["admin", "manager"]), addSupplier);

router.get("/", protect, requireRoles(["admin", "manager"]), getSuppliers);

router.put("/:id", protect, requireRoles(["admin", "manager"]), updateSupplier);

router.get("/:id/products", protect, requireRoles(["admin", "manager"]), getSupplierProducts);

router.delete("/:id", protect, requireRoles(["admin", "manager"]), deleteSupplier);

module.exports = router;
