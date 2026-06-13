const User = require("../models/User");
const bcrypt = require("bcryptjs");

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, currentPassword, newPassword } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use by another account" });
      }
      user.email = email;
    }

    // Update other basic fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    await user.save();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "update",
      entity: "User",
      entityId: user._id,
      description: `User profile updated (Name/Email/Phone/Password changes).`,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        permissions: user.permissions || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL USERS (Admin Only)
const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER ROLE & PERMISSIONS (Admin Only)
const updateUserPermissions = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { id } = req.params;
    const { role, permissions } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldRole = user.role;
    const oldPermissions = [...(user.permissions || [])];

    if (role) user.role = role;
    if (permissions) user.permissions = permissions;

    await user.save();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "update",
      entity: "User",
      entityId: user._id,
      description: `Role/Permissions updated for user "${user.name}" (${user.email}). Role: ${oldRole} -> ${user.role}, Permissions: [${oldPermissions.join(", ")}] -> [${user.permissions.join(", ")}].`,
    });

    res.status(200).json({
      message: "User permissions updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateProfile,
  getUsers,
  updateUserPermissions,
};
