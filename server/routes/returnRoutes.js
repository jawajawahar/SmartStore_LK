const express = require("express");
const router = express.Router();
const { getReturns, createReturn } = require("../controllers/returnController");
const { protect, checkPermission } = require("../middleware/authMiddleware");

// All routes are protected
router.route("/").get(protect, getReturns).post(protect, checkPermission("modify_sales"), createReturn);

module.exports = router;
