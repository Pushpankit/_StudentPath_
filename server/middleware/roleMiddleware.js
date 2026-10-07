const Student = require("../models/Student");
const Company = require("../models/Company");

/*
 * ==================================================
 * REQUIRE ROLE
 * ==================================================
 *
 * Usage:
 *
 * router.get(
 *   "/...",
 *   protect,
 *   requireRole("student"),
 *   controller
 * );
 *
 * or:
 *
 * requireRole("company")
 *
 * ==================================================
 */

const requireRole =
  (...allowedRoles) => {
    return (req, res, next) => {
      /*
       * protect middleware must run first.
       */

      if (!req.user) {
        return res.status(401).json({
          success: false,
          code:
            "NOT_AUTHENTICATED",
          message:
            "Authentication is required.",
        });
      }

      /*
       * Check whether the user's current
       * database role is allowed.
       */

      if (
        !allowedRoles.includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          success: false,
          code:
            "INSUFFICIENT_ROLE",
          message:
            "You do not have permission to access this resource.",
        });
      }

      next();
    };
  };

/*
 * ==================================================
 * REQUIRE COMPLETED PROFILE
 * ==================================================
 *
 * This middleware is used AFTER:
 *
 * protect
 * requireRole(...)
 *
 * It checks the actual Student or Company
 * profile in MongoDB.
 *
 * This prevents a user from accessing the
 * main application before completing onboarding.
 * ==================================================
 */

const requireCompletedProfile =
  async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code:
            "NOT_AUTHENTICATED",
          message:
            "Authentication is required.",
        });
      }

      /*
       * ----------------------------------------------
       * STUDENT
       * ----------------------------------------------
       */

      if (
        req.user.role ===
        "student"
      ) {
        const student =
          await Student.findOne({
            user:
              req.user.userId,
          }).select(
            "profileCompleted onboardingStep"
          );

        if (!student) {
          return res.status(409).json({
            success: false,
            code:
              "STUDENT_PROFILE_REQUIRED",
            message:
              "Your student profile has not been created yet.",
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
              "Please complete your student profile before continuing.",
            nextStep:
              "onboarding",
            onboardingStep:
              student.onboardingStep ||
              "basic",
          });
        }

        next();
        return;
      }

      /*
       * ----------------------------------------------
       * COMPANY
       * ----------------------------------------------
       */

      if (
        req.user.role ===
        "company"
      ) {
        const company =
          await Company.findOne({
            user:
              req.user.userId,
          }).select(
            "profileCompleted onboardingStep verificationStatus"
          );

        if (!company) {
          return res.status(409).json({
            success: false,
            code:
              "COMPANY_PROFILE_REQUIRED",
            message:
              "Your company profile has not been created yet.",
            nextStep:
              "onboarding",
          });
        }

        if (
          !company.profileCompleted
        ) {
          return res.status(403).json({
            success: false,
            code:
              "PROFILE_COMPLETION_REQUIRED",
            message:
              "Please complete your company profile before continuing.",
            nextStep:
              "onboarding",
            onboardingStep:
              company.onboardingStep ||
              "basic",
          });
        }

        /*
         * IMPORTANT:
         *
         * Profile completion and company
         * verification are separate.
         *
         * A company can access its profile/dashboard
         * while verification is still pending.
         *
         * Job posting will later use a separate
         * requireVerifiedCompany middleware.
         */

        next();
        return;
      }

      /*
       * ----------------------------------------------
       * ADMIN
       * ----------------------------------------------
       *
       * Admin does not use student/company
       * onboarding.
       */

      if (
        req.user.role ===
        "admin"
      ) {
        next();
        return;
      }

      return res.status(403).json({
        success: false,
        code:
          "INVALID_ACCOUNT_ROLE",
        message:
          "Your account role is not supported.",
      });
    } catch (error) {
      console.error(
        "Profile authorization error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "PROFILE_AUTHORIZATION_FAILED",
        message:
          "Unable to verify your profile status.",
      });
    }
  };

/*
 * ==================================================
 * REQUIRE VERIFIED COMPANY
 * ==================================================
 *
 * Used for company actions that should only be
 * available after admin verification.
 *
 * Example:
 *
 * protect
 * requireRole("company")
 * requireCompletedProfile
 * requireVerifiedCompany
 * createJob
 *
 * ==================================================
 */

const requireVerifiedCompany =
  async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code:
            "NOT_AUTHENTICATED",
          message:
            "Authentication is required.",
        });
      }

      if (
        req.user.role !==
        "company"
      ) {
        return res.status(403).json({
          success: false,
          code:
            "COMPANY_ACCESS_REQUIRED",
          message:
            "Only company accounts can perform this action.",
        });
      }

      const company =
        await Company.findOne({
          user:
            req.user.userId,
        }).select(
          "profileCompleted verificationStatus"
        );

      if (!company) {
        return res.status(409).json({
          success: false,
          code:
            "COMPANY_PROFILE_REQUIRED",
          message:
            "Please complete your company profile first.",
          nextStep:
            "onboarding",
        });
      }

      if (
        !company.profileCompleted
      ) {
        return res.status(403).json({
          success: false,
          code:
            "PROFILE_COMPLETION_REQUIRED",
          message:
            "Please complete your company profile first.",
          nextStep:
            "onboarding",
        });
      }

      if (
        company.verificationStatus !==
        "verified"
      ) {
        return res.status(403).json({
          success: false,
          code:
            "COMPANY_VERIFICATION_REQUIRED",
          message:
            "Your company must be verified before performing this action.",
          verificationStatus:
            company.verificationStatus,
        });
      }

      next();
    } catch (error) {
      console.error(
        "Company verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "COMPANY_VERIFICATION_CHECK_FAILED",
        message:
          "Unable to verify company status.",
      });
    }
  };

module.exports = {
  requireRole,
  requireCompletedProfile,
  requireVerifiedCompany,
};