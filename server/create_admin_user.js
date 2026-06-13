const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: "admin@store.com" });
    if (existing) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const admin = new User({
      name: "Admin User",
      email: "admin@store.com",
      password: hashedPassword,
      role: "admin",
      permissions: ["all"],
      isActive: true
    });

    await admin.save();
    console.log("Admin user created successfully!");
    console.log("Email: admin@store.com");
    console.log("Password: password123");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();
