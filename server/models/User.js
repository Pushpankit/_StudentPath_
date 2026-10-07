const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    /*
     * --------------------------------------------------
     * BASIC IDENTITY
     * --------------------------------------------------
     */

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    /*
     * --------------------------------------------------
     * PASSWORD AUTHENTICATION
     * --------------------------------------------------
     *
     * Google-only accounts can have no password.
     * A password can be added later.
     */

    passwordHash: {
      type: String,
      default: null,
      select: false,
    },

    /*
     * --------------------------------------------------
     * GOOGLE AUTHENTICATION
     * --------------------------------------------------
     */

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },

    authProvider: {
      type: String,
      enum: [
        "local",
        "google",
        "local_google",
      ],
      default: "local",
    },

    /*
     * --------------------------------------------------
     * EMAIL VERIFICATION
     * --------------------------------------------------
     */

    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    /*
     * --------------------------------------------------
     * PASSWORD RESET
     * --------------------------------------------------
     */

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    /*
     * --------------------------------------------------
     * ACCOUNT ROLE
     * --------------------------------------------------
     *
     * Determines which profile belongs to this user.
     *
     * student → Student profile
     * company → Company profile
     * admin   → Admin access
     */

    role: {
      type: String,
      enum: [
        "student",
        "company",
        "admin",
      ],
      required: true,
      default: "student",
      index: true,
    },

    /*
     * --------------------------------------------------
     * TERMS & PRIVACY
     * --------------------------------------------------
     */

    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    /*
     * --------------------------------------------------
     * ACCOUNT STATUS
     * --------------------------------------------------
     *
     * Allows us to disable/suspend accounts without
     * deleting them from the database.
     */

    status: {
      type: String,
      enum: [
        "active",
        "suspended",
        "deleted",
      ],
      default: "active",
      index: true,
    },

    /*
     * --------------------------------------------------
     * SECURITY / SESSION VERSION
     * --------------------------------------------------
     *
     * Increment this when we want to invalidate
     * previously issued JWTs.
     *
     * Example:
     * - password changed
     * - account compromised
     * - logout-all-devices
     */

    tokenVersion: {
      type: Number,
      default: 0,
    },

    /*
     * --------------------------------------------------
     * LAST LOGIN
     * --------------------------------------------------
     */

    lastLoginAt: {
      type: Date,
      default: null,
    },

    /*
     * --------------------------------------------------
     * ACCOUNT CREATION SOURCE
     * --------------------------------------------------
     *
     * Useful for analytics and debugging.
     *
     * local  → normal email/password signup
     * google → Google signup
     */

    signupMethod: {
      type: String,
      enum: [
        "local",
        "google",
      ],
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);

/*
 * --------------------------------------------------
 * INDEXES
 * --------------------------------------------------
 */

userSchema.index({
  role: 1,
  status: 1,
});

userSchema.index({
  email: 1,
  status: 1,
});

/*
 * --------------------------------------------------
 * EXPORT
 * --------------------------------------------------
 */

module.exports =
  mongoose.model(
    "User",
    userSchema
  );