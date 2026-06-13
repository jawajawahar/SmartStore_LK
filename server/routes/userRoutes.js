const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { updateProfile, getUsers, updateUserPermissions } = require("../controllers/userController");

// Protected Routes
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected profile accessed",
    user: req.user,
  });
});

router.put("/profile", protect, updateProfile);

// Admin-managed User lists & RBAC overrides
router.get("/", protect, getUsers);
router.put("/:id/permissions", protect, updateUserPermissions);

module.exports = router;
