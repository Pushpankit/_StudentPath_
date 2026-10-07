const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    /*
     * ==================================================
     * USER
     * ==================================================
     */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /*
     * ==================================================
     * BASIC COMPANY INFORMATION
     * ==================================================
     */

    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      default: "",
    },

    legalName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
      index: true,
    },

    companyType: {
      type: String,
      enum: [
        "",
        "Startup",
        "Small Business",
        "Medium Business",
        "Enterprise",
        "MNC",
        "Non-Profit",
        "Government",
        "Educational Institution",
        "Agency",
        "Consulting Firm",
        "Other",
      ],
      default: "",
    },

    companySize: {
      type: String,
      enum: [
        "",
        "1-10",
        "11-50",
        "51-200",
        "201-500",
        "501-1000",
        "1001-5000",
        "5001-10000",
        "10000+",
      ],
      default: "",
    },

    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
      default: null,
    },

    /*
     * ==================================================
     * COMPANY STAGE
     * ==================================================
     */

    companyStage: {
      type: String,
      enum: [
        "",
        "Bootstrapped",
        "Pre-Seed",
        "Seed",
        "Series A",
        "Series B",
        "Series C+",
        "Established",
      ],
      default: "",
    },

    /*
     * ==================================================
     * PUBLIC COMPANY URL
     * ==================================================
     */

    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },

    /*
     * ==================================================
     * ONLINE PRESENCE
     * ==================================================
     */

    website: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    linkedinUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    /*
     * ==================================================
     * LOCATION
     * ==================================================
     */

    headquarters: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    locations: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 200,
        },
      ],
      default: [],
    },

    /*
     * ==================================================
     * CONTACT
     * ==================================================
     */

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: "",
    },

    contactPhone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },

    /*
     * ==================================================
     * COMPANY BRANDING
     * ==================================================
     */

    logoUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    /*
     * ==================================================
     * HIRING INFORMATION
     * ==================================================
     */

    hiringRoles: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 150,
        },
      ],
      default: [],
    },

    hiringLocations: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 200,
        },
      ],
      default: [],
    },

    hiringWorkModes: {
      type: [
        {
          type: String,
          enum: [
            "On-site",
            "Hybrid",
            "Remote",
          ],
        },
      ],
      default: [],
    },

    /*
     * ==================================================
     * VERIFICATION
     * ==================================================
     */

    verificationStatus: {
      type: String,
      enum: [
        "unverified",
        "pending",
        "verified",
        "rejected",
      ],
      default: "unverified",
      index: true,
    },

    verificationSubmittedAt: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    /*
     * ==================================================
     * ONBOARDING / PROFILE COMPLETION
     * ==================================================
     */

    profileCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    profileCompletedAt: {
      type: Date,
      default: null,
    },

    onboardingStep: {
      type: String,
      enum: [
        "basic",
        "company-details",
        "online-presence",
        "location",
        "contact",
        "hiring",
        "completed",
      ],
      default: "basic",
    },
  },
  {
    timestamps: true,
  }
);

/*
 * ==================================================
 * INDEXES
 * ==================================================
 */

companySchema.index({
  companyName: 1,
});

companySchema.index({
  industry: 1,
});

companySchema.index({
  verificationStatus: 1,
  profileCompleted: 1,
});

/*
 * ==================================================
 * MODEL
 * ==================================================
 */

const Company = mongoose.model(
  "Company",
  companySchema
);

module.exports = Company;