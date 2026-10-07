const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");

const getCompanyDashboard = async (req, res) => {
  try {
    const company = await Company.findOne({
      user: req.user.userId,
    }).select(
      "_id companyName legalName description industry companySize foundedYear website linkedinUrl headquarters locations logoUrl hiringRoles hiringLocations hiringWorkModes verificationStatus verificationSubmittedAt verifiedAt profileCompleted profileCompletedAt onboardingStep"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        code: "COMPANY_PROFILE_NOT_FOUND",
        message: "Company profile not found.",
      });
    }

    /*
     * --------------------------------------------
     * JOB COUNTS
     * --------------------------------------------
     */

    const [
      totalJobs,
      activeJobs,
      closedJobs,
      pendingJobs,
      rejectedJobs,
    ] = await Promise.all([
      Job.countDocuments({
        company: company._id,
      }),

      Job.countDocuments({
        company: company._id,
        status: "Approved",
        isActive: true,
      }),

      Job.countDocuments({
        company: company._id,
        status: "Closed",
      }),

      Job.countDocuments({
        company: company._id,
        status: "Pending",
      }),

      Job.countDocuments({
        company: company._id,
        status: "Rejected",
      }),
    ]);

    /*
     * --------------------------------------------
     * APPLICATION COUNTS
     * --------------------------------------------
     */

    const [
      totalApplications,
      newApplications,
      reviewedApplications,
      shortlistedApplications,
      interviewApplications,
      rejectedApplications,
      hiredApplications,
    ] = await Promise.all([
      Application.countDocuments({
        company: company._id,
      }),

      Application.countDocuments({
        company: company._id,
        status: "Applied",
      }),

      Application.countDocuments({
        company: company._id,
        status: "Reviewed",
      }),

      Application.countDocuments({
        company: company._id,
        status: "Shortlisted",
      }),

      Application.countDocuments({
        company: company._id,
        status: "Interview",
      }),

      Application.countDocuments({
        company: company._id,
        status: "Rejected",
      }),

      Application.countDocuments({
        company: company._id,
        status: "Hired",
      }),
    ]);

    /*
     * --------------------------------------------
     * RECENT JOBS
     * --------------------------------------------
     */

    const recentJobs = await Job.find({
      company: company._id,
    })
      .select(
        "title location jobType experienceLevel status isActive applicationCount createdAt updatedAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean();

    /*
     * --------------------------------------------
     * RECENT APPLICATIONS
     * --------------------------------------------
     */

    const recentApplications =
      await Application.find({
        company: company._id,
      })
        .populate(
          "student",
          "name college degree branch graduationYear targetRole skills"
        )
        .populate(
          "job",
          "title location jobType"
        )
        .select(
          "student job status appliedAt reviewedAt shortlistedAt interviewAt rejectedAt hiredAt"
        )
        .sort({
          appliedAt: -1,
        })
        .limit(10)
        .lean();

    /*
     * --------------------------------------------
     * DASHBOARD RESPONSE
     * --------------------------------------------
     */

    return res.status(200).json({
      success: true,
      code: "COMPANY_DASHBOARD_FETCHED",

      company: {
        id: company._id,
        companyName: company.companyName,
        legalName: company.legalName,
        description: company.description,
        industry: company.industry,
        companySize: company.companySize,
        foundedYear: company.foundedYear,
        website: company.website,
        linkedinUrl: company.linkedinUrl,
        headquarters: company.headquarters,
        locations: company.locations,
        logoUrl: company.logoUrl,

        hiringRoles: company.hiringRoles,
        hiringLocations: company.hiringLocations,
        hiringWorkModes: company.hiringWorkModes,

        verificationStatus:
          company.verificationStatus,

        verificationSubmittedAt:
          company.verificationSubmittedAt,

        verifiedAt: company.verifiedAt,

        profileCompleted:
          company.profileCompleted,

        profileCompletedAt:
          company.profileCompletedAt,

        onboardingStep:
          company.onboardingStep,
      },

      stats: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
          closed: closedJobs,
          pending: pendingJobs,
          rejected: rejectedJobs,
        },

        applications: {
          total: totalApplications,
          new: newApplications,
          reviewed: reviewedApplications,
          shortlisted: shortlistedApplications,
          interview: interviewApplications,
          rejected: rejectedApplications,
          hired: hiredApplications,
        },
      },

      recentJobs,

      recentApplications,
    });
  } catch (error) {
    console.error(
      "Get company dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "COMPANY_DASHBOARD_FETCH_FAILED",
      message: "Unable to load company dashboard.",
    });
  }
};

module.exports = {
  getCompanyDashboard,
};