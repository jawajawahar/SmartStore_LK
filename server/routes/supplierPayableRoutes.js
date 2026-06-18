const express = require("express");
const {
  addPayable,
  getPayables,
  paySupplier,
  updatePayable,
  deletePayable,
} = require("../controllers/supplierPayableController");

const { protect, requireRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/", protect, requireRoles(["admin", "manager"]), addPayable);

router.get("/", protect, requireRoles(["admin", "manager"]), getPayables);

router.put("/:id/pay", protect, requireRoles(["admin", "manager"]), paySupplier);

router.put("/:id", protect, requireRoles(["admin", "manager"]), updatePayable);

router.delete("/:id", protect, requireRoles(["admin", "manager"]), deletePayable);

module.exports = router;
