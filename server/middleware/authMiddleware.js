const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch full user from DB (exclude password)
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message: "Account is deactivated. Contact admin.",
        });
      }

      // Save full user info to request
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        phone: user.phone || "",
        avatar: user.avatar || "",
      };

      next();
    } catch (error) {
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no user context" });
    }

    // Admins bypass all granular permissions
    if (req.user.role === "admin") {
      return next();
    }

    // Check if the user has the required permission
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      message: `Access denied. You do not have the required permission: ${permission}`,
    });
  };
};

const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no user context" });
    }
    if (roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      message: `Access denied. Your role (${req.user.role}) is not authorized to access this resource.`,
    });
  };
};

module.exports = { protect, checkPermission, requireRoles };
