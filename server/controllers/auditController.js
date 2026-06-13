const AuditLog = require("../models/AuditLog");

// @desc    Get all audit logs (restricted to admin/manager)
// @route   GET /api/audit-logs
// @access  Private
const getAuditLogs = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== "admin" && userRole !== "manager") {
      return res.status(403).json({ message: "Access denied. Only managers and admins can access audit logs." });
    }

    const logs = await AuditLog.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(200); // Return up to 200 logs for review

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAuditLogs,
};
