const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getAuditLogs } = require("../controllers/auditController");

// Get audit logs history (protected)
router.get("/", protect, getAuditLogs);

module.exports = router;
