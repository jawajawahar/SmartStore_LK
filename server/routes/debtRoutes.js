const express = require("express");
const { addDebt, getDebts, payDebt, deleteDebt, updateDebt } = require("../controllers/debtController");

const { protect, requireRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/", protect, requireRoles(["admin", "manager"]), addDebt);

router.get("/", protect, requireRoles(["admin", "manager"]), getDebts);

router.put("/:id/pay", protect, requireRoles(["admin", "manager"]), payDebt);

router.put("/:id", protect, requireRoles(["admin", "manager"]), updateDebt);

router.delete("/:id", protect, requireRoles(["admin", "manager"]), deleteDebt);

module.exports = router;
