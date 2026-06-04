const express = require("express");

const { addDebt, getDebts, payDebt } = require("../controllers/debtController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/", protect, addDebt);

router.get("/", protect, getDebts);

router.put("/:id/pay", protect, payDebt);

module.exports = router;
