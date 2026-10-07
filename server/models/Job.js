const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 10000,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    jobType: {
      type: String,
      required: true,
      enum: [
        "Internship",
        "Full-time",
        "Part-time",
        "Contract",
      ],
      index: true,
    },

    experienceLevel: {
      type: String,
      required: true,
      enum: [
        "Fresher",
        "0-1 years",
        "1-2 years",
        "2-3 years",
        "3+ years",
      ],
      index: true,
    },

    salaryMin: {
      type: Number,
      min: 0,
      default: null,
    },

    salaryMax: {
      type: Number,
      min: 0,
      default: null,
    },

    skills: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    careerPaths: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CareerPath",
      },
    ],

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Closed",
      ],
      default: "Pending",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    moderationNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    moderatedAt: {
      type: Date,
      default: null,
    },

    applicationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes for public job searching
jobSchema.index({
  status: 1,
  isActive: 1,
});

jobSchema.index({
  company: 1,
  status: 1,
});

jobSchema.index({
  careerPaths: 1,
});

jobSchema.index({
  title: "text",
  description: "text",
  skills: "text",
  location: "text",
});

module.exports = mongoose.model("Job", jobSchema);