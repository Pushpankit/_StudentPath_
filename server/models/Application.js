const mongoose = require("mongoose");

const applicationSchema =
  new mongoose.Schema(
    {
      /*
       * ============================================
       * STUDENT
       * ============================================
       */

      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
      },

      /*
       * ============================================
       * JOB
       * ============================================
       */

      job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
        index: true,
      },

      /*
       * ============================================
       * COMPANY
       * ============================================
       *
       * Stored separately from Job so applications
       * can be queried efficiently from the company
       * side without repeatedly resolving the job.
       */

      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        index: true,
      },

      /*
       * ============================================
       * COVER LETTER
       * ============================================
       */

      coverLetter: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: "",
      },

      /*
       * ============================================
       * APPLICATION STATUS
       * ============================================
       */

      status: {
        type: String,
        enum: [
          "Applied",
          "Reviewed",
          "Shortlisted",
          "Interview",
          "Rejected",
          "Hired",
          "Withdrawn",
        ],
        default: "Applied",
        required: true,
        index: true,
      },

      /*
       * ============================================
       * IMPORTANT DATES
       * ============================================
       */

      appliedAt: {
        type: Date,
        default: Date.now,
        required: true,
        index: true,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      shortlistedAt: {
        type: Date,
        default: null,
      },

      interviewAt: {
        type: Date,
        default: null,
      },

      rejectedAt: {
        type: Date,
        default: null,
      },

      hiredAt: {
        type: Date,
        default: null,
      },

      withdrawnAt: {
        type: Date,
        default: null,
      },

      /*
       * ============================================
       * COMPANY / ADMIN NOTES
       * ============================================
       *
       * Internal notes should never be returned
       * directly to students.
       */

      recruiterNotes: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: "",
      },

      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: "",
      },

      /*
       * ============================================
       * INTERVIEW INFORMATION
       * ============================================
       */

      interviewDetails: {
        scheduled: {
          type: Boolean,
          default: false,
        },

        scheduledAt: {
          type: Date,
          default: null,
        },

        mode: {
          type: String,
          enum: [
            "Online",
            "Phone",
            "In-person",
            "Other",
          ],
          default: null,
        },

        meetingUrl: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: "",
        },

        location: {
          type: String,
          trim: true,
          maxlength: 500,
          default: "",
        },

        notes: {
          type: String,
          trim: true,
          maxlength: 2000,
          default: "",
        },
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * ================================================
 * DUPLICATE APPLICATION PROTECTION
 * ================================================
 *
 * A student can apply to the same job only once.
 *
 * This is enforced at the database level as well as
 * in the controller.
 */

applicationSchema.index(
  {
    student: 1,
    job: 1,
  },
  {
    unique: true,
  }
);

/*
 * ================================================
 * STUDENT APPLICATIONS
 * ================================================
 *
 * Used for:
 * - My Applications
 * - Application tracking
 * - Dashboard
 */

applicationSchema.index({
  student: 1,
  appliedAt: -1,
});

/*
 * ================================================
 * COMPANY APPLICATIONS
 * ================================================
 *
 * Used by companies to view applicants.
 */

applicationSchema.index({
  company: 1,
  status: 1,
  appliedAt: -1,
});

/*
 * ================================================
 * JOB APPLICATIONS
 * ================================================
 *
 * Useful for:
 * - Applicant counts
 * - Recruiter dashboard
 * - Job management
 */

applicationSchema.index({
  job: 1,
  status: 1,
  appliedAt: -1,
});

/*
 * ================================================
 * STATUS + DATE
 * ================================================
 */

applicationSchema.index({
  status: 1,
  appliedAt: -1,
});

/*
 * ================================================
 * VALIDATION
 * ================================================
 */

applicationSchema.pre(
  "validate",
  function () {
    /*
     * Withdrawn applications should have
     * withdrawnAt.
     */

    if (
      this.status === "Withdrawn" &&
      !this.withdrawnAt
    ) {
      this.withdrawnAt = new Date();
    }

    /*
     * Rejected applications should have
     * rejectedAt.
     */

    if (
      this.status === "Rejected" &&
      !this.rejectedAt
    ) {
      this.rejectedAt = new Date();
    }

    /*
     * Hired applications should have
     * hiredAt.
     */

    if (
      this.status === "Hired" &&
      !this.hiredAt
    ) {
      this.hiredAt = new Date();
    }

    /*
     * Shortlisted applications should have
     * shortlistedAt.
     */

    if (
      this.status === "Shortlisted" &&
      !this.shortlistedAt
    ) {
      this.shortlistedAt = new Date();
    }

    /*
     * Reviewed, shortlisted, interview, rejected
     * and hired applications have passed the
     * initial application stage.
     */

    if (
      [
        "Reviewed",
        "Shortlisted",
        "Interview",
        "Rejected",
        "Hired",
      ].includes(this.status) &&
      !this.reviewedAt
    ) {
      this.reviewedAt = new Date();
    }
  }
);

module.exports =
  mongoose.model(
    "Application",
    applicationSchema
  );