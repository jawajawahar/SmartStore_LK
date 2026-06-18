const express = require("express");
const router = express.Router();

const { protect, requireRoles } = require("../middleware/authMiddleware");
const { getAuditLogs } = require("../controllers/auditController");

// Get audit logs history (protected)
router.get("/", protect, requireRoles(["admin", "manager"]), getAuditLogs);

module.exports = router;
