const express = require("express");

const {
  getDashboardAnalytics,
  getDailyReport,
  getLowStockProducts,
  getReportData,
} = require("../controllers/analyticsController");

const { protect, requireRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.get("/dashboard", protect, requireRoles(["admin", "manager"]), getDashboardAnalytics);
router.get("/daily-report", protect, requireRoles(["admin", "manager"]), getDailyReport);
router.get("/low-stock", protect, requireRoles(["admin", "manager"]), getLowStockProducts);
router.get("/report-data", protect, requireRoles(["admin", "manager"]), getReportData);

module.exports = router;
