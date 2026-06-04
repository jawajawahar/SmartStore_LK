const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

// Protected Route
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected profile accessed",
    user: req.user,
  });
});

module.exports = router;
