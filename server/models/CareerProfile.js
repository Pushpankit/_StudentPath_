const mongoose = require("mongoose");

const careerSkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    importance: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    source: {
      type: String,
      enum: [
        "curated",
        "jobs",
        "external",
        "ai",
      ],
      default: "ai",
    },
  },
  { _id: false }
);

const careerProfileSchema = new mongoose.Schema(
  {
    canonicalTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

  normalizedTitle: {
  type: String,
  required: true,
  trim: true,
  lowercase: true,
},

    aliases: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    category: {
      type: String,
      trim: true,
      default: "Other",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    skills: {
      type: [careerSkillSchema],
      default: [],
    },

    technologies: [
      {
        type: String,
        trim: true,
      },
    ],

    projectTypes: [
      {
        type: String,
        trim: true,
      },
    ],

    learningTopics: [
      {
        type: String,
        trim: true,
      },
    ],

    source: {
      type: String,
      enum: [
        "curated",
        "jobs",
        "external",
        "ai",
        "hybrid",
      ],
      default: "ai",
    },

    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "active",
        "pending_review",
        "rejected",
      ],
      default: "active",
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    lastValidatedAt: {
      type: Date,
      default: null,
    },

    lastGeneratedAt: {
      type: Date,
      default: null,
    },

    sourceReferences: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

careerProfileSchema.index(
  { normalizedTitle: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CareerProfile",
  careerProfileSchema
);