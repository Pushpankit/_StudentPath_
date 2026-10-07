const mongoose = require("mongoose");

const careerPathSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    technologies: [
      {
        type: String,
        trim: true,
      },
    ],

    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],

    projects: [
      {
        type: String,
        trim: true,
      },
    ],

    roadmap: [
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

module.exports = mongoose.model("CareerPath", careerPathSchema);