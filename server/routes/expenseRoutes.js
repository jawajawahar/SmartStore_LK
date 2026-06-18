const express = require("express");
const router = express.Router();
const {
  getExpenses,
  createExpense,
  deleteExpense,
} = require("../controllers/expenseController");
const { protect, requireRoles } = require("../middleware/authMiddleware");

// All routes are protected and restricted to admin/manager
router.route("/").get(protect, requireRoles(["admin", "manager"]), getExpenses).post(protect, requireRoles(["admin", "manager"]), createExpense);
router.route("/:id").delete(protect, requireRoles(["admin", "manager"]), deleteExpense);

module.exports = router;
