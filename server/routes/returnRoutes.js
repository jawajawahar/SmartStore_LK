const express = require("express");
const router = express.Router();
const { getReturns, createReturn } = require("../controllers/returnController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.route("/").get(protect, getReturns).post(protect, createReturn);

module.exports = router;
