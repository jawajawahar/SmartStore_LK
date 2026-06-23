const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set default permissions based on role
    let permissions = [];
    if (role === "manager") {
      permissions = ["modify_sales", "view_purchase_prices", "edit_products"];
    } else if (role === "cashier") {
      permissions = ["view_purchase_prices"];
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      permissions,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
      },
    });

    // Audit log the login event (req.user isn't populated yet, so log directly)
    const AuditLog = require("../models/AuditLog");
    new AuditLog({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: "login",
      entity: "Session",
      description: `User "${user.name}" (${user.role}) logged in.`,
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
    }).save().catch(err => console.error("Login audit failed:", err));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
