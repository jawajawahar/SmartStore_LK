const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "jawajawaharsha@gmail.com";
    const rawPassword = "Jawa15155-A";

    let existing = await User.findOne({ $or: [{ email: adminEmail }, { role: "admin" }] });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    if (existing) {
      existing.email = adminEmail;
      existing.password = hashedPassword;
      existing.role = "admin";
      existing.permissions = ["all"];
      existing.isActive = true;
      await existing.save();
      console.log("Admin user updated successfully!");
    } else {
      const admin = new User({
        name: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        permissions: ["all"],
        isActive: true
      });
      await admin.save();
      console.log("Admin user created successfully!");
    }

    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${rawPassword}`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();
