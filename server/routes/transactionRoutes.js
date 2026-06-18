const express = require("express");

const {
  getTransactions,
  addTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

const { protect, checkPermission, requireRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, requireRoles(["admin", "manager"]), getTransactions);

router.post("/", protect, requireRoles(["admin", "manager"]), addTransaction);

router.delete("/:id", protect, requireRoles(["admin", "manager"]), checkPermission("modify_sales"), deleteTransaction);

module.exports = router;
