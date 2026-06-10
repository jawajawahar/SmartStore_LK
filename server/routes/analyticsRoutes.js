const express = require("express");

const {
  getDashboardAnalytics,
  getDailyReport,
  getLowStockProducts,
} = require("../controllers/analyticsController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.get("/dashboard", protect, getDashboardAnalytics);
router.get("/daily-report", protect, getDailyReport);
router.get("/low-stock", protect, getLowStockProducts);

module.exports = router;
