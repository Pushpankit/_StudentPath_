const mongoose = require("mongoose");

const Application = require("../models/Application");
const Job = require("../models/Job");
const Student = require("../models/Student");
const Company = require("../models/Company");

/*
 * ==================================================
 * CONSTANTS
 * ==================================================
 */

const ALLOWED_APPLICATION_STATUSES = [
  "Applied",
  "Reviewed",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Hired",
  "Withdrawn",
];

const COMPANY_STATUS_UPDATES = [
  "Reviewed",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Hired",
];

const INTERVIEW_MODES = [
  "Online",
  "Phone",
  "In-person",
  "Other",
];

const MAX_COVER_LETTER_LENGTH = 5000;
const MAX_RECRUITER_NOTES_LENGTH = 5000;
const MAX_REJECTION_REASON_LENGTH = 2000;

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

const normalizeString = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
};

const getStudentForUser = async (
  userId
) => {
  return Student.findOne({
    user: userId,
  });
};

const getCompanyForUser = async (
  userId
) => {
  return Company.findOne({
    user: userId,
  });
};

/*
 * ==================================================
 * STUDENT
 * APPLY TO JOB
 * ==================================================
 *
 * POST /api/applications/:jobId
 */

const applyToJob = async (
  req,
  res
) => {
  try {
    const { jobId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        jobId
      )
    ) {
      return res.status(400).json({
        success: false,
        code:
          "INVALID_JOB_ID",
        message:
          "Invalid job ID.",
      });
    }

    const student =
      await getStudentForUser(
        req.user.userId
      );

    if (!student) {
      return res.status(409).json({
        success: false,
        code:
          "STUDENT_PROFILE_REQUIRED",
        message:
          "Please complete your student profile before applying.",
        nextStep:
          "onboarding",
      });
    }

    if (
      !student.profileCompleted
    ) {
      return res.status(403).json({
        success: false,
        code:
          "PROFILE_COMPLETION_REQUIRED",
        message:
          "Please complete your student profile before applying for jobs.",
        nextStep:
          "onboarding",
        onboardingStep:
          student.onboardingStep ||
          "basic",
      });
    }

    const job =
      await Job.findOne({
        _id: jobId,
        status: "Approved",
        isActive: true,
      }).populate(
        "company",
        "companyName verificationStatus"
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        code:
          "JOB_NOT_AVAILABLE",
        message:
          "This job is no longer available.",
      });
    }

    if (
      !job.company ||
      job.company.verificationStatus !==
        "verified"
    ) {
      return res.status(404).json({
        success: false,
        code:
          "JOB_NOT_AVAILABLE",
        message:
          "This job is no longer available.",
      });
    }

    const coverLetter =
      normalizeString(
        req.body?.coverLetter
      );

    if (
      coverLetter.length >
      MAX_COVER_LETTER_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        code:
          "INVALID_COVER_LETTER",
        message:
          `Cover letter must not exceed ${MAX_COVER_LETTER_LENGTH} characters.`,
      });
    }

    const existingApplication =
      await Application.findOne({
        student:
          student._id,
        job:
          job._id,
      });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        code:
          "ALREADY_APPLIED",
        message:
          "You have already applied for this job.",
        application:
          existingApplication,
      });
    }

    const application =
      await Application.create({
        student:
          student._id,

        job:
          job._id,

        company:
          job.company._id,

        coverLetter,

        status:
          "Applied",

        appliedAt:
          new Date(),
      });

    await Job.updateOne(
      {
        _id:
          job._id,
      },
      {
        $inc: {
          applicationCount: 1,
        },
      }
    );

    const populatedApplication =
      await Application.findById(
        application._id
      )
        .populate(
          "job",
          "title location jobType experienceLevel company"
        )
        .populate(
          "company",
          "companyName logoUrl website"
        );

    return res.status(201).json({
      success: true,
      code:
        "APPLICATION_CREATED",
      message:
        "Your application has been submitted successfully.",
      application:
        populatedApplication,
    });
  } catch (error) {
    console.error(
      "Apply to job error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        code:
          "ALREADY_APPLIED",
        message:
          "You have already applied for this job.",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        code:
          "APPLICATION_VALIDATION_FAILED",
        message:
          "Some application information is invalid.",
      });
    }

    return res.status(500).json({
      success: false,
      code:
        "APPLICATION_CREATION_FAILED",
      message:
        "Unable to submit your application.",
    });
  }
};

/*
 * ==================================================
 * STUDENT
 * GET MY APPLICATIONS
 * ==================================================
 *
 * GET /api/applications
 */

const getMyApplications =
  async (
    req,
    res
  ) => {
    try {
      const student =
        await getStudentForUser(
          req.user.userId
        );

      if (!student) {
        return res.status(409).json({
          success: false,
          code:
            "STUDENT_PROFILE_REQUIRED",
          message:
            "Student profile not found.",
          nextStep:
            "onboarding",
        });
      }

      const applications =
        await Application.find({
          student:
            student._id,
        })
          .populate(
            "job",
            "title location jobType experienceLevel salaryMin salaryMax skills status isActive createdAt"
          )
          .populate(
            "company",
            "companyName logoUrl website headquarters verificationStatus"
          )
          .sort({
            appliedAt: -1,
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        code:
          "APPLICATIONS_FETCHED",
        count:
          applications.length,
        applications,
      });
    } catch (error) {
      console.error(
        "Get my applications error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "APPLICATIONS_FETCH_FAILED",
        message:
          "Unable to fetch your applications.",
      });
    }
  };

/*
 * ==================================================
 * STUDENT
 * GET SINGLE APPLICATION
 * ==================================================
 *
 * GET /api/applications/:id
 */

const getMyApplicationById =
  async (
    req,
    res
  ) => {
    try {
      const applicationId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_APPLICATION_ID",
          message:
            "Invalid application ID.",
        });
      }

      const student =
        await getStudentForUser(
          req.user.userId
        );

      if (!student) {
        return res.status(409).json({
          success: false,
          code:
            "STUDENT_PROFILE_REQUIRED",
          message:
            "Student profile not found.",
          nextStep:
            "onboarding",
        });
      }

      const application =
        await Application.findOne({
          _id:
            applicationId,

          student:
            student._id,
        })
          .populate(
            "job",
            "title description location jobType experienceLevel salaryMin salaryMax skills status isActive createdAt"
          )
          .populate(
            "company",
            "companyName description logoUrl website linkedinUrl headquarters verificationStatus"
          )
          .lean();

      if (!application) {
        return res.status(404).json({
          success: false,
          code:
            "APPLICATION_NOT_FOUND",
          message:
            "Application not found.",
        });
      }

      return res.status(200).json({
        success: true,
        code:
          "APPLICATION_FETCHED",
        application,
      });
    } catch (error) {
      console.error(
        "Get application error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "APPLICATION_FETCH_FAILED",
        message:
          "Unable to fetch application.",
      });
    }
  };

/*
 * ==================================================
 * STUDENT
 * WITHDRAW APPLICATION
 * ==================================================
 *
 * PATCH /api/applications/:id/withdraw
 */

const withdrawApplication =
  async (
    req,
    res
  ) => {
    try {
      const applicationId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_APPLICATION_ID",
          message:
            "Invalid application ID.",
        });
      }

      const student =
        await getStudentForUser(
          req.user.userId
        );

      if (!student) {
        return res.status(409).json({
          success: false,
          code:
            "STUDENT_PROFILE_REQUIRED",
          message:
            "Student profile not found.",
        });
      }

      const application =
        await Application.findOne({
          _id:
            applicationId,

          student:
            student._id,
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          code:
            "APPLICATION_NOT_FOUND",
          message:
            "Application not found.",
        });
      }

      const nonWithdrawableStatuses = [
        "Rejected",
        "Hired",
        "Withdrawn",
      ];

      if (
        nonWithdrawableStatuses.includes(
          application.status
        )
      ) {
        return res.status(409).json({
          success: false,
          code:
            "APPLICATION_CANNOT_BE_WITHDRAWN",
          message:
            "This application cannot be withdrawn.",
          status:
            application.status,
        });
      }

      application.status =
        "Withdrawn";

      application.withdrawnAt =
        new Date();

      await application.save();

      await Job.updateOne(
        {
          _id:
            application.job,
          applicationCount: {
            $gt: 0,
          },
        },
        {
          $inc: {
            applicationCount: -1,
          },
        }
      );

      return res.status(200).json({
        success: true,
        code:
          "APPLICATION_WITHDRAWN",
        message:
          "Application withdrawn successfully.",
        application,
      });
    } catch (error) {
      console.error(
        "Withdraw application error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "APPLICATION_WITHDRAW_FAILED",
        message:
          "Unable to withdraw application.",
      });
    }
  };

/*
 * ==================================================
 * STUDENT
 * CHECK APPLICATION
 * ==================================================
 *
 * GET /api/applications/check/:jobId
 */

const checkApplication =
  async (
    req,
    res
  ) => {
    try {
      const {
        jobId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          jobId
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_JOB_ID",
          message:
            "Invalid job ID.",
        });
      }

      const student =
        await getStudentForUser(
          req.user.userId
        );

      if (!student) {
        return res.status(200).json({
          success: true,
          applied: false,
        });
      }

      const application =
        await Application.findOne({
          student:
            student._id,
          job:
            jobId,
        })
          .select(
            "_id status appliedAt"
          )
          .lean();

      return res.status(200).json({
        success: true,
        code:
          "APPLICATION_STATUS_FETCHED",
        applied:
          Boolean(application),
        application:
          application || null,
      });
    } catch (error) {
      console.error(
        "Check application error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "APPLICATION_CHECK_FAILED",
        message:
          "Unable to check application status.",
      });
    }
  };

/*
 * ==================================================
 * COMPANY
 * GET ALL APPLICANTS
 * ==================================================
 *
 * GET /api/applications/company
 *
 * A company can only see applications belonging
 * to that company.
 */

const getCompanyApplications =
  async (
    req,
    res
  ) => {
    try {
      const company =
        await getCompanyForUser(
          req.user.userId
        );

      if (!company) {
        return res.status(409).json({
          success: false,
          code:
            "COMPANY_PROFILE_REQUIRED",
          message:
            "Company profile not found.",
          nextStep:
            "onboarding",
        });
      }

      const applications =
        await Application.find({
          company:
            company._id,
        })
          .populate(
            "student",
            "name college degree branch graduationYear city preferredLocation targetRole careerProfile careerPath opportunityType workMode skills projects experience certifications resumeUrl resume profileCompleted onboardingStep"
          )
          .populate(
            "job",
            "title description location jobType experienceLevel salaryMin salaryMax skills careerPaths status isActive createdAt"
          )
          .sort({
            appliedAt: -1,
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        code:
          "COMPANY_APPLICATIONS_FETCHED",
        count:
          applications.length,
        applications,
      });
    } catch (error) {
      console.error(
        "Get company applications error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "COMPANY_APPLICATIONS_FETCH_FAILED",
        message:
          "Unable to fetch company applications.",
      });
    }
  };

/*
 * ==================================================
 * COMPANY
 * GET SINGLE APPLICANT
 * ==================================================
 *
 * GET /api/applications/company/:id
 */

const getCompanyApplicationById =
  async (
    req,
    res
  ) => {
    try {
      const applicationId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_APPLICATION_ID",
          message:
            "Invalid application ID.",
        });
      }

      const company =
        await getCompanyForUser(
          req.user.userId
        );

      if (!company) {
        return res.status(409).json({
          success: false,
          code:
            "COMPANY_PROFILE_REQUIRED",
          message:
            "Company profile not found.",
          nextStep:
            "onboarding",
        });
      }

      const application =
        await Application.findOne({
          _id:
            applicationId,

          company:
            company._id,
        })
          .populate(
            "student",
            "name college degree branch graduationYear city preferredLocation targetRole careerProfile careerPath opportunityType workMode skills projects experience certifications resumeUrl resume profileCompleted onboardingStep"
          )
          .populate(
            "job",
            "title description location jobType experienceLevel salaryMin salaryMax skills careerPaths status isActive createdAt"
          )
          .populate(
            "company",
            "companyName logoUrl website headquarters verificationStatus"
          )
          .lean();

      if (!application) {
        return res.status(404).json({
          success: false,
          code:
            "APPLICATION_NOT_FOUND",
          message:
            "Application not found.",
        });
      }

      return res.status(200).json({
        success: true,
        code:
          "COMPANY_APPLICATION_FETCHED",
        application,
      });
    } catch (error) {
      console.error(
        "Get company application error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "COMPANY_APPLICATION_FETCH_FAILED",
        message:
          "Unable to fetch applicant.",
      });
    }
  };

/*
 * ==================================================
 * COMPANY
 * UPDATE APPLICATION STATUS
 * ==================================================
 *
 * PATCH /api/applications/company/:id/status
 */

const updateCompanyApplicationStatus =
  async (
    req,
    res
  ) => {
    try {
      const applicationId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_APPLICATION_ID",
          message:
            "Invalid application ID.",
        });
      }

      const status =
        normalizeString(
          req.body?.status
        );

      if (
        !COMPANY_STATUS_UPDATES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_APPLICATION_STATUS",
          message:
            "Invalid application status.",
          allowedStatuses:
            COMPANY_STATUS_UPDATES,
        });
      }

      const company =
        await getCompanyForUser(
          req.user.userId
        );

      if (!company) {
        return res.status(409).json({
          success: false,
          code:
            "COMPANY_PROFILE_REQUIRED",
          message:
            "Company profile not found.",
          nextStep:
            "onboarding",
        });
      }

      const application =
        await Application.findOne({
          _id:
            applicationId,

          company:
            company._id,
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          code:
            "APPLICATION_NOT_FOUND",
          message:
            "Application not found.",
        });
      }

      if (
        application.status ===
          "Withdrawn" &&
        status !== "Hired"
      ) {
        return res.status(409).json({
          success: false,
          code:
            "APPLICATION_CANNOT_BE_UPDATED",
          message:
            "A withdrawn application cannot be moved to this status.",
          status:
            application.status,
        });
      }

      application.status =
        status;

      /*
       * Keep important status timestamps
       * synchronized.
       */

      if (
        status === "Reviewed" &&
        !application.reviewedAt
      ) {
        application.reviewedAt =
          new Date();
      }

      if (
        status === "Shortlisted" &&
        !application.shortlistedAt
      ) {
        application.shortlistedAt =
          new Date();
      }

      if (
        status === "Interview" &&
        !application.interviewAt
      ) {
        application.interviewAt =
          new Date();
      }

      if (
        status === "Rejected" &&
        !application.rejectedAt
      ) {
        application.rejectedAt =
          new Date();
      }

      if (
        status === "Hired" &&
        !application.hiredAt
      ) {
        application.hiredAt =
          new Date();
      }

      await application.save();

      const updatedApplication =
        await Application.findById(
          application._id
        )
          .populate(
            "student",
            "name college degree branch graduationYear city preferredLocation targetRole careerProfile careerPath opportunityType workMode skills projects experience certifications resumeUrl resume profileCompleted onboardingStep"
          )
          .populate(
            "job",
            "title location jobType experienceLevel salaryMin salaryMax status isActive"
          )
          .lean();

      return res.status(200).json({
        success: true,
        code:
          "APPLICATION_STATUS_UPDATED",
        message:
          "Application status updated successfully.",
        application:
          updatedApplication,
      });
    } catch (error) {
      console.error(
        "Update company application status error:",
        error
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          code:
            "APPLICATION_VALIDATION_FAILED",
          message:
            "Some application information is invalid.",
        });
      }

      return res.status(500).json({
        success: false,
        code:
          "APPLICATION_STATUS_UPDATE_FAILED",
        message:
          "Unable to update application status.",
      });
    }
  };

/*
 * ==================================================
 * COMPANY
 * UPDATE RECRUITER NOTES
 * ==================================================
 *
 * PATCH /api/applications/company/:id/notes
 */

const updateCompanyApplicationNotes =
  async (
    req,
    res
  ) => {
    try {
      const applicationId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_APPLICATION_ID",
          message:
            "Invalid application ID.",
        });
      }

      const company =
        await getCompanyForUser(
          req.user.userId
        );

      if (!company) {
        return res.status(409).json({
          success: false,
          code:
            "COMPANY_PROFILE_REQUIRED",
          message:
            "Company profile not found.",
          nextStep:
            "onboarding",
        });
      }

      const application =
        await Application.findOne({
          _id:
            applicationId,

          company:
            company._id,
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          code:
            "APPLICATION_NOT_FOUND",
          message:
            "Application not found.",
        });
      }

      const recruiterNotes =
        normalizeString(
          req.body?.recruiterNotes
        );

      const rejectionReason =
        normalizeString(
          req.body?.rejectionReason
        );

      if (
        recruiterNotes.length >
        MAX_RECRUITER_NOTES_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_RECRUITER_NOTES",
          message:
            `Recruiter notes must not exceed ${MAX_RECRUITER_NOTES_LENGTH} characters.`,
        });
      }

      if (
        rejectionReason.length >
        MAX_REJECTION_REASON_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_REJECTION_REASON",
          message:
            `Rejection reason must not exceed ${MAX_REJECTION_REASON_LENGTH} characters.`,
        });
      }

      application.recruiterNotes =
        recruiterNotes;

      application.rejectionReason =
        rejectionReason;

      await application.save();

      return res.status(200).json({
        success: true,
        code:
          "APPLICATION_NOTES_UPDATED",
        message:
          "Applicant notes updated successfully.",
        application,
      });
    } catch (error) {
      console.error(
        "Update company application notes error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "APPLICATION_NOTES_UPDATE_FAILED",
        message:
          "Unable to update applicant notes.",
      });
    }
  };

/*
 * ==================================================
 * COMPANY
 * UPDATE INTERVIEW DETAILS
 * ==================================================
 *
 * PATCH /api/applications/company/:id/interview
 */

const updateCompanyApplicationInterview =
  async (
    req,
    res
  ) => {
    try {
      const applicationId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_APPLICATION_ID",
          message:
            "Invalid application ID.",
        });
      }

      const company =
        await getCompanyForUser(
          req.user.userId
        );

      if (!company) {
        return res.status(409).json({
          success: false,
          code:
            "COMPANY_PROFILE_REQUIRED",
          message:
            "Company profile not found.",
          nextStep:
            "onboarding",
        });
      }

      const application =
        await Application.findOne({
          _id:
            applicationId,

          company:
            company._id,
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          code:
            "APPLICATION_NOT_FOUND",
          message:
            "Application not found.",
        });
      }

      const scheduled =
        Boolean(
          req.body?.scheduled
        );

      const mode =
        normalizeString(
          req.body?.mode
        );

      const meetingUrl =
        normalizeString(
          req.body?.meetingUrl
        );

      const location =
        normalizeString(
          req.body?.location
        );

      const notes =
        normalizeString(
          req.body?.notes
        );

      const scheduledAtValue =
        req.body?.scheduledAt;

      if (
        mode &&
        !INTERVIEW_MODES.includes(
          mode
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_INTERVIEW_MODE",
          message:
            "Invalid interview mode.",
          allowedModes:
            INTERVIEW_MODES,
        });
      }

      if (
        meetingUrl.length >
        1000
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_MEETING_URL",
          message:
            "Meeting URL is too long.",
        });
      }

      if (
        location.length >
        500
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_INTERVIEW_LOCATION",
          message:
            "Interview location is too long.",
        });
      }

      if (
        notes.length >
        2000
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_INTERVIEW_NOTES",
          message:
            "Interview notes are too long.",
        });
      }

      let scheduledAt =
        null;

      if (
        scheduledAtValue
      ) {
        const parsedDate =
          new Date(
            scheduledAtValue
          );

        if (
          Number.isNaN(
            parsedDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_INTERVIEW_DATE",
            message:
              "Invalid interview date.",
          });
        }

        scheduledAt =
          parsedDate;
      }

      if (
        scheduled &&
        !scheduledAt
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INTERVIEW_DATE_REQUIRED",
          message:
            "Please provide the interview date and time.",
        });
      }

      application.interviewDetails =
        {
          scheduled,

          scheduledAt,

          mode:
            mode || null,

          meetingUrl,

          location,

          notes,
        };

      if (
        scheduled
      ) {
        application.status =
          "Interview";

        application.interviewAt =
          scheduledAt ||
          new Date();

        if (
          !application.reviewedAt
        ) {
          application.reviewedAt =
            new Date();
        }
      } else {
        application.interviewAt =
          null;
      }

      await application.save();

      return res.status(200).json({
        success: true,
        code:
          "INTERVIEW_DETAILS_UPDATED",
        message:
          "Interview details updated successfully.",
        application,
      });
    } catch (error) {
      console.error(
        "Update company interview error:",
        error
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INTERVIEW_VALIDATION_FAILED",
          message:
            "Some interview information is invalid.",
        });
      }

      return res.status(500).json({
        success: false,
        code:
          "INTERVIEW_UPDATE_FAILED",
        message:
          "Unable to update interview details.",
      });
    }
  };

/*
 * ==================================================
 * EXPORTS
 * ==================================================
 */

module.exports = {
  applyToJob,
  getMyApplications,
  getMyApplicationById,
  withdrawApplication,
  checkApplication,

  getCompanyApplications,
  getCompanyApplicationById,
  updateCompanyApplicationStatus,
  updateCompanyApplicationNotes,
  updateCompanyApplicationInterview,
};