const express = require("express");

const {
  getTransactions,
  addTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

const { protect, checkPermission } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getTransactions);

router.post("/", protect, addTransaction);

router.delete("/:id", protect, checkPermission("modify_sales"), deleteTransaction);

module.exports = router;
