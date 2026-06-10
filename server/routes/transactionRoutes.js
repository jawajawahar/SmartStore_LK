const express = require("express");

const {
  getTransactions,
  addTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getTransactions);

router.post("/", protect, addTransaction);

router.delete("/:id", protect, deleteTransaction);

module.exports = router;
