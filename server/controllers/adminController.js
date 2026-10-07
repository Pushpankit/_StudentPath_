
const mongoose = require("mongoose");

const Company = require("../models/Company");
const Job = require("../models/Job");
const User = require("../models/User");

const COMPANY_STATUSES = ["verified", "unverified"];

/*
|--------------------------------------------------------------------------
| Admin Dashboard Stats
|--------------------------------------------------------------------------
*/
const getDashboardStats = async (req, res) => {
  try {
    const [
      students,
      companies,
      verifiedCompanies,
      unverifiedCompanies,
    ] = await Promise.all([
      User.countDocuments({
        role: "student",
        status: "active",
      }),

      Company.countDocuments(),

      Company.countDocuments({
        verificationStatus: "verified",
      }),

      Company.countDocuments({
        $in: ["unverified", "pending", "rejected", "approved"],
      }),
    ]);

    return res.status(200).json({
      success: true,
      code: "ADMIN_DASHBOARD_STATS_FETCHED",
      stats: {
        students,
        companies,
        verifiedCompanies,
        unverifiedCompanies,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);

    return res.status(500).json({
      success: false,
      code: "ADMIN_STATS_FETCH_FAILED",
      message: "Unable to fetch dashboard statistics.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Companies
|--------------------------------------------------------------------------
*/
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate(
        "user",
        "name email username emailVerified status createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      code: "COMPANIES_FETCHED",
      count: companies.length,
      companies,
    });
  } catch (error) {
    console.error("Get companies error:", error);

    return res.status(500).json({
      success: false,
      code: "COMPANIES_FETCH_FAILED",
      message: "Unable to fetch companies.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Company Verification
|--------------------------------------------------------------------------
|
| Admin can:
|
| verified   -> unverified
| unverified -> verified
|
| We also handle old "approved" records as verified for compatibility.
|--------------------------------------------------------------------------
*/
const updateCompanyStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status, notes } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_COMPANY_ID",
        message: "Invalid company ID.",
      });
    }

    if (!COMPANY_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_COMPANY_STATUS",
        message: "Status must be either verified or unverified.",
      });
    }

    const verificationNotes =
      notes === undefined || notes === null
        ? ""
        : String(notes).trim();

    if (verificationNotes.length > 2000) {
      return res.status(400).json({
        success: false,
        code: "INVALID_VERIFICATION_NOTES",
        message: "Verification notes must not exceed 2000 characters.",
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        code: "COMPANY_NOT_FOUND",
        message: "Company not found.",
      });
    }

    /*
     * Do not require "pending" here.
     * Admin is allowed to verify or unverify any company.
     */

    const now = new Date();

    if (status === "verified") {
      company.verificationStatus = "verified";
      company.verificationSubmittedAt =
        company.verificationSubmittedAt || now;
      company.verifiedAt = now;
      company.verificationNotes = verificationNotes;
    }

    if (status === "unverified") {
      company.verificationStatus = "unverified";
      company.verifiedAt = null;
      company.verificationNotes = verificationNotes;
    }

    await company.save();

    /*
     * If a company is unverified, close its currently active
     * approved jobs. This keeps the verification rule consistent.
     */
    if (status === "unverified") {
      await Job.updateMany(
        {
          company: company._id,
          status: "Approved",
          isActive: true,
        },
        {
          $set: {
            status: "Closed",
            isActive: false,
          },
        }
      );
    }

    const updatedCompany = await Company.findById(company._id)
      .populate(
        "user",
        "name email username emailVerified status createdAt"
      )
      .lean();

    return res.status(200).json({
      success: true,
      code:
        status === "verified"
          ? "COMPANY_VERIFIED"
          : "COMPANY_UNVERIFIED",

      message:
        status === "verified"
          ? "Company verified successfully."
          : "Company marked as unverified successfully.",

      company: updatedCompany,
    });
  } catch (error) {
    console.error("Update company status error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        code: "COMPANY_STATUS_VALIDATION_FAILED",
        message: "Company verification information is invalid.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "COMPANY_STATUS_UPDATE_FAILED",
      message: "Unable to update company verification status.",
    });
  }
};

module.exports = {
  getDashboardStats,
  getCompanies,
  updateCompanyStatus,
};
