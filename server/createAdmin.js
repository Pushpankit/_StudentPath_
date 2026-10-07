require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || "");

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured for admin creation.");
    }

    if (password.length < 12) {
      throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
    }

    await connectDB();

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      if (existingAdmin.role !== "admin") {
        throw new Error("The configured ADMIN_EMAIL already belongs to a non-admin account.");
      }
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name: process.env.ADMIN_NAME || "StudentPath Admin",
      email,
      passwordHash,
      role: "admin",
      emailVerified: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      authProvider: "local",
      signupMethod: "local",
      status: "active",
      tokenVersion: 0,
    });

    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
