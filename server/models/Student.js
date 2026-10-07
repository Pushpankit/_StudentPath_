const mongoose = require("mongoose");

/*
 * --------------------------------------------------
 * PROJECT SCHEMA
 * --------------------------------------------------
 */

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    technologies: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],

    url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    date: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
  },
  {
    _id: true,
  }
);

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    company: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    period: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    issuer: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    date: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
  },
  { _id: true }
);

/*
 * --------------------------------------------------
 * STUDENT SCHEMA
 * --------------------------------------------------
 */

const studentSchema = new mongoose.Schema(
  {
    /*
     * ------------------------------------------------
     * USER RELATION
     * ------------------------------------------------
     */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /*
     * ------------------------------------------------
     * BASIC INFORMATION
     * ------------------------------------------------
     */

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    /*
     * ------------------------------------------------
     * EDUCATION
     * ------------------------------------------------
     */

    college: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    degree: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    branch: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    graduationYear: {
      type: Number,
      min: 1950,
      max: 2100,
      default: null,
    },

    /*
     * ------------------------------------------------
     * LOCATION
     * ------------------------------------------------
     */

    city: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    preferredLocation: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    /*
     * ------------------------------------------------
     * CAREER
     * ------------------------------------------------
     */

    targetRole: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    /*
     * Current source of truth for the student's
     * selected/discovered career.
     */

    careerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerProfile",
      default: null,
      index: true,
    },

    /*
     * Keep CareerPath for backward compatibility
     * until all old application code is migrated.
     *
     * careerProfile remains the primary career
     * reference.
     */

    careerPath: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerPath",
      default: null,
    },

    /*
     * ------------------------------------------------
     * OPPORTUNITY PREFERENCES
     * ------------------------------------------------
     */

    opportunityType: {
      type: String,
      enum: [
        "Internship",
        "Full-time",
        "Both",
      ],
      default: "Both",
    },

    workMode: {
      type: String,
      enum: [
        "On-site",
        "Hybrid",
        "Remote",
        "Any",
      ],
      default: "Any",
    },

    /*
     * ------------------------------------------------
     * SKILLS
     * ------------------------------------------------
     */

    skills: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],

    /*
     * ------------------------------------------------
     * PROJECTS
     * ------------------------------------------------
     */

    projects: {
      type: [projectSchema],
      default: [],
    },

    experience: {
      type: [experienceSchema],
      default: [],
    },

    certifications: {
      type: [certificationSchema],
      default: [],
    },

    resumeUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    resume: {
      data: {
        type: Buffer,
        default: null,
      },
      fileName: {
        type: String,
        trim: true,
        maxlength: 255,
        default: "",
      },
      contentType: {
        type: String,
        trim: true,
        default: "application/pdf",
      },
      size: {
        type: Number,
        min: 0,
        default: 0,
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
    },

    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    university: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    workPreference: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    /*
     * ------------------------------------------------
     * ONBOARDING STATUS
     * ------------------------------------------------
     *
     * This is the backend source of truth.
     *
     * false:
     * Student has authenticated but has not
     * completed the required onboarding.
     *
     * true:
     * Required student information has been
     * completed and a career profile exists.
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

    /*
     * ------------------------------------------------
     * ONBOARDING PROGRESS
     * ------------------------------------------------
     *
     * Useful if onboarding becomes multi-step.
     *
     * We can show:
     *
     * basic
     * education
     * career
     * preferences
     * skills
     * projects
     * completed
     */

    onboardingStep: {
      type: String,
      enum: [
        "basic",
        "education",
        "career",
        "preferences",
        "skills",
        "projects",
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
 * --------------------------------------------------
 * INDEXES
 * --------------------------------------------------
 */

studentSchema.index({
  careerProfile: 1,
  profileCompleted: 1,
});

studentSchema.index({
  city: 1,
  preferredLocation: 1,
});

studentSchema.index({
  opportunityType: 1,
  workMode: 1,
});

/*
 * --------------------------------------------------
 * EXPORT
 * --------------------------------------------------
 */

module.exports =
  mongoose.model(
    "Student",
    studentSchema
  );