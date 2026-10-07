const Company = require("../models/Company");
const Job = require("../models/Job");

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const ALLOWED_COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10000+",
];

const ALLOWED_COMPANY_TYPES = [
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
];

const ALLOWED_COMPANY_STAGES = [
  "Bootstrapped",
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Established",
];

const ALLOWED_WORK_MODES = [
  "On-site",
  "Hybrid",
  "Remote",
];

const ALLOWED_VERIFICATION_STATUSES = [
  "unverified",
  "pending",
  "verified",
  "rejected",
];

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * Safely convert a value into a trimmed string.
 */
const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

/**
 * Validate optional URL.
 */
const isValidUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

/**
 * Validate email.
 */
const isValidEmail = (email) => {
  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Normalize array values.
 *
 * Removes:
 * - null
 * - undefined
 * - empty strings
 * - duplicate values
 */
const normalizeArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) => normalizeString(item))
        .filter(Boolean)
    ),
  ];
};

/**
 * Create a URL-safe company slug.
 */
const createCompanySlug = (companyName) => {
  return normalizeString(companyName)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
};

/**
 * Generate a unique company slug.
 *
 * Existing slug is preserved unless the company name changes.
 */
const generateUniqueSlug = async (companyName, companyId = null) => {
  const baseSlug = createCompanySlug(companyName);

  if (!baseSlug) {
    return "";
  }

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const query = { slug };

    if (companyId) {
      query._id = { $ne: companyId };
    }

    const existingCompany = await Company.findOne(query).select("_id");

    if (!existingCompany) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

/*
 * ============================================================
 * PROFILE COMPLETION
 * ============================================================
 *
 * Required for initial company profile completion:
 *
 * - companyName
 * - industry
 * - companySize
 * - description
 * - headquarters
 * - contactEmail
 *
 * Optional:
 * - companyType
 * - companyStage
 * - website
 * - LinkedIn
 * - hiring information
 */

const isProfileComplete = (company) => {
  const companyName = normalizeString(
    company.companyName
  );

  const industry = normalizeString(
    company.industry
  );

  const companySize = normalizeString(
    company.companySize
  );

  const description = normalizeString(
    company.description
  );

  const headquarters = normalizeString(
    company.headquarters
  );

  const contactEmail = normalizeString(
    company.contactEmail
  );

  return Boolean(
    companyName &&
      industry &&
      companySize &&
      description &&
      headquarters &&
      contactEmail
  );
};

/*
 * ============================================================
 * ONBOARDING STEP
 * ============================================================
 */

const getOnboardingStep = (company) => {
  if (
    !normalizeString(company.companyName)
  ) {
    return "basic";
  }

  if (
    !normalizeString(company.industry) ||
    !normalizeString(company.companySize)
  ) {
    return "company-details";
  }

  if (
    !normalizeString(company.description)
  ) {
    return "company-details";
  }

  if (
    !normalizeString(company.headquarters)
  ) {
    return "location";
  }

  if (
    !normalizeString(company.contactEmail)
  ) {
    return "location";
  }

  return "completed";
};

/*
 * ============================================================
 * RESPONSE BUILDER
 * ============================================================
 */

const buildCompanyResponse = (company) => {
  return {
    id: company._id,

    user: company.user,

    companyName:
      company.companyName || "",

    legalName:
      company.legalName || "",

    description:
      company.description || "",

    industry:
      company.industry || "",

    companyType:
      company.companyType || "",

    companySize:
      company.companySize || "",

    companyStage:
      company.companyStage || "",

    foundedYear:
      company.foundedYear || null,

    slug:
      company.slug || "",

    website:
      company.website || "",

    linkedinUrl:
      company.linkedinUrl || "",

    headquarters:
      company.headquarters || "",

    /*
     * Frontend compatibility:
     * Older UI may use "location".
     */
    location:
      company.headquarters || "",

    locations:
      Array.isArray(company.locations)
        ? company.locations
        : [],

    contactEmail:
      company.contactEmail || "",

    contactPhone:
      company.contactPhone || "",

    logoUrl:
      company.logoUrl || "",

    hiringRoles:
      Array.isArray(company.hiringRoles)
        ? company.hiringRoles
        : [],

    hiringLocations:
      Array.isArray(company.hiringLocations)
        ? company.hiringLocations
        : [],

    hiringWorkModes:
      Array.isArray(company.hiringWorkModes)
        ? company.hiringWorkModes
        : [],

    verificationStatus:
      company.verificationStatus || "unverified",

    verificationSubmittedAt:
      company.verificationSubmittedAt || null,

    verifiedAt:
      company.verifiedAt || null,

    verificationNotes:
      company.verificationNotes || "",

    profileCompleted:
      Boolean(company.profileCompleted),

    profileCompletedAt:
      company.profileCompletedAt || null,

    onboardingStep:
      company.onboardingStep || "basic",

    createdAt:
      company.createdAt,

    updatedAt:
      company.updatedAt,
  };
};

/*
 * ============================================================
 * GET MY COMPANY
 * ============================================================
 *
 * GET /api/company/me
 */

const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      user: req.user.userId,
    }).populate(
      "user",
      "name email username role emailVerified"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        code: "COMPANY_PROFILE_NOT_FOUND",
        message: "Company profile not found.",
      });
    }

    const profileCompleted =
      isProfileComplete(company);

    const onboardingStep =
      getOnboardingStep(company);

    let changed = false;

    if (
      company.profileCompleted !==
      profileCompleted
    ) {
      company.profileCompleted =
        profileCompleted;

      changed = true;
    }

    if (
      company.onboardingStep !==
      onboardingStep
    ) {
      company.onboardingStep =
        onboardingStep;

      changed = true;
    }

    if (profileCompleted) {
      if (!company.profileCompletedAt) {
        company.profileCompletedAt =
          new Date();

        changed = true;
      }
    } else {
      if (company.profileCompletedAt) {
        company.profileCompletedAt = null;

        changed = true;
      }
    }

    if (changed) {
      await company.save();
    }

    return res.status(200).json({
      success: true,

      code: "COMPANY_PROFILE_FETCHED",

      company:
        buildCompanyResponse(company),

      profileCompleted,

      onboardingStep,

      verificationStatus:
        company.verificationStatus ||
        "unverified",
    });
  } catch (error) {
    console.error(
      "Get company profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "COMPANY_PROFILE_FETCH_FAILED",
      message:
        "Unable to fetch company profile.",
    });
  }
};

/*
 * ============================================================
 * UPDATE MY COMPANY
 * ============================================================
 *
 * PUT /api/company/me
 */

const updateMyCompany = async (req, res) => {
  try {
    const body = req.body || {};

    const company = await Company.findOne({
      user: req.user.userId,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        code: "COMPANY_PROFILE_NOT_FOUND",
        message: "Company profile not found.",
      });
    }

    const previousCompanyName =
      company.companyName;

    const previousVerificationStatus =
      company.verificationStatus ||
      "unverified";

    /*
     * --------------------------------------------------------
     * SECURITY
     * --------------------------------------------------------
     *
     * Verification fields are never directly editable
     * by the company.
     */

    if (
      body.verificationStatus !==
        undefined ||
      body.verifiedAt !== undefined ||
      body.verificationNotes !==
        undefined ||
      body.verificationSubmittedAt !==
        undefined
    ) {
      return res.status(403).json({
        success: false,
        code:
          "VERIFICATION_FIELDS_NOT_ALLOWED",
        message:
          "Verification information can only be managed through the verification process.",
      });
    }

    /*
     * --------------------------------------------------------
     * COMPANY NAME
     * --------------------------------------------------------
     */

    if (
      body.companyName !==
      undefined
    ) {
      const companyName =
        normalizeString(
          body.companyName
        );

      if (
        companyName.length < 2 ||
        companyName.length > 150
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_COMPANY_NAME",
          message:
            "Company name must be between 2 and 150 characters.",
        });
      }

      company.companyName =
        companyName;
    }

    /*
     * --------------------------------------------------------
     * LEGAL NAME
     * --------------------------------------------------------
     */

    if (
      body.legalName !== undefined
    ) {
      const legalName =
        normalizeString(
          body.legalName
        );

      if (
        legalName.length > 200
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_LEGAL_NAME",
          message:
            "Legal name must not exceed 200 characters.",
        });
      }

      company.legalName =
        legalName;
    }

    /*
     * --------------------------------------------------------
     * DESCRIPTION
     * --------------------------------------------------------
     */

    if (
      body.description !== undefined
    ) {
      const description =
        normalizeString(
          body.description
        );

      if (
        description.length < 30 ||
        description.length > 3000
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_COMPANY_DESCRIPTION",
          message:
            "Company description must be between 30 and 3000 characters.",
        });
      }

      company.description =
        description;
    }

    /*
     * --------------------------------------------------------
     * INDUSTRY
     * --------------------------------------------------------
     */

    if (
      body.industry !== undefined
    ) {
      const industry =
        normalizeString(
          body.industry
        );

      if (
        industry.length < 2 ||
        industry.length > 100
      ) {
        return res.status(400).json({
          success: false,
          code: "INVALID_INDUSTRY",
          message:
            "Industry must be between 2 and 100 characters.",
        });
      }

      company.industry =
        industry;
    }

    /*
     * --------------------------------------------------------
     * COMPANY TYPE
     * --------------------------------------------------------
     */

    if (
      body.companyType !== undefined
    ) {
      const companyType =
        normalizeString(
          body.companyType
        );

      if (
        companyType &&
        !ALLOWED_COMPANY_TYPES.includes(
          companyType
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_COMPANY_TYPE",
          message:
            "Invalid company type.",
        });
      }

      company.companyType =
        companyType;
    }

    /*
     * --------------------------------------------------------
     * COMPANY SIZE
     * --------------------------------------------------------
     */

    if (
      body.companySize !== undefined
    ) {
      const companySize =
        normalizeString(
          body.companySize
        );

      if (
        !ALLOWED_COMPANY_SIZES.includes(
          companySize
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_COMPANY_SIZE",
          message:
            "Invalid company size.",
        });
      }

      company.companySize =
        companySize;
    }

    /*
     * --------------------------------------------------------
     * COMPANY STAGE
     * --------------------------------------------------------
     */

    if (
      body.companyStage !== undefined
    ) {
      const companyStage =
        normalizeString(
          body.companyStage
        );

      if (
        companyStage &&
        !ALLOWED_COMPANY_STAGES.includes(
          companyStage
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_COMPANY_STAGE",
          message:
            "Invalid company stage.",
        });
      }

      company.companyStage =
        companyStage;
    }

    /*
     * --------------------------------------------------------
     * FOUNDED YEAR
     * --------------------------------------------------------
     */

    if (
      body.foundedYear !== undefined
    ) {
      if (
        body.foundedYear === null ||
        body.foundedYear === ""
      ) {
        company.foundedYear = null;
      } else {
        const foundedYear =
          Number(
            body.foundedYear
          );

        if (
          !Number.isInteger(
            foundedYear
          ) ||
          foundedYear < 1800 ||
          foundedYear >
            new Date().getFullYear()
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_FOUNDED_YEAR",
            message:
              "Please provide a valid founded year.",
          });
        }

        company.foundedYear =
          foundedYear;
      }
    }

    /*
     * --------------------------------------------------------
     * WEBSITE
     * --------------------------------------------------------
     */

    if (
      body.website !== undefined
    ) {
      const website =
        normalizeString(
          body.website
        );

      if (
        !isValidUrl(website)
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_WEBSITE",
          message:
            "Please provide a valid website URL.",
        });
      }

      company.website =
        website;
    }

    /*
     * --------------------------------------------------------
     * LINKEDIN
     * --------------------------------------------------------
     */

    if (
      body.linkedinUrl !== undefined
    ) {
      const linkedinUrl =
        normalizeString(
          body.linkedinUrl
        );

      if (
        !isValidUrl(linkedinUrl)
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_LINKEDIN_URL",
          message:
            "Please provide a valid LinkedIn URL.",
        });
      }

      company.linkedinUrl =
        linkedinUrl;
    }

    /*
     * --------------------------------------------------------
     * HEADQUARTERS / LOCATION
     * --------------------------------------------------------
     *
     * Supports both:
     * - headquarters
     * - location
     */

    if (
      body.headquarters !==
        undefined ||
      body.location !== undefined
    ) {
      const headquarters =
        normalizeString(
          body.headquarters !==
            undefined
            ? body.headquarters
            : body.location
        );

      if (
        headquarters.length >
        200
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_HEADQUARTERS",
          message:
            "Company location must not exceed 200 characters.",
        });
      }

      company.headquarters =
        headquarters;
    }

    /*
     * --------------------------------------------------------
     * LOCATIONS
     * --------------------------------------------------------
     */

    if (
      body.locations !== undefined
    ) {
      if (
        !Array.isArray(
          body.locations
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_LOCATIONS",
          message:
            "Locations must be an array.",
        });
      }

      company.locations =
        normalizeArray(
          body.locations
        );
    }

    /*
     * --------------------------------------------------------
     * CONTACT EMAIL
     * --------------------------------------------------------
     */

    if (
      body.contactEmail !==
      undefined
    ) {
      const contactEmail =
        normalizeString(
          body.contactEmail
        ).toLowerCase();

      if (
        !isValidEmail(
          contactEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_CONTACT_EMAIL",
          message:
            "Please provide a valid contact email.",
        });
      }

      company.contactEmail =
        contactEmail;
    }

    /*
     * --------------------------------------------------------
     * CONTACT PHONE
     * --------------------------------------------------------
     */

    if (
      body.contactPhone !==
      undefined
    ) {
      const contactPhone =
        normalizeString(
          body.contactPhone
        );

      if (
        contactPhone.length > 30
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_CONTACT_PHONE",
          message:
            "Contact phone number is too long.",
        });
      }

      company.contactPhone =
        contactPhone;
    }

    /*
     * --------------------------------------------------------
     * LOGO
     * --------------------------------------------------------
     */

    if (
      body.logoUrl !== undefined
    ) {
      const logoUrl =
        normalizeString(
          body.logoUrl
        );

      if (
        !isValidUrl(logoUrl)
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_LOGO_URL",
          message:
            "Please provide a valid logo URL.",
        });
      }

      company.logoUrl =
        logoUrl;
    }

    /*
     * --------------------------------------------------------
     * HIRING ROLES
     * --------------------------------------------------------
     */

    if (
      body.hiringRoles !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.hiringRoles
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_HIRING_ROLES",
          message:
            "Hiring roles must be an array.",
        });
      }

      company.hiringRoles =
        normalizeArray(
          body.hiringRoles
        );
    }

    /*
     * --------------------------------------------------------
     * HIRING LOCATIONS
     * --------------------------------------------------------
     */

    if (
      body.hiringLocations !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.hiringLocations
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_HIRING_LOCATIONS",
          message:
            "Hiring locations must be an array.",
        });
      }

      company.hiringLocations =
        normalizeArray(
          body.hiringLocations
        );
    }

    /*
     * --------------------------------------------------------
     * HIRING WORK MODES
     * --------------------------------------------------------
     */

    if (
      body.hiringWorkModes !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.hiringWorkModes
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_HIRING_WORK_MODES",
          message:
            "Hiring work modes must be an array.",
        });
      }

      const invalidModes =
        body.hiringWorkModes.filter(
          (mode) =>
            !ALLOWED_WORK_MODES.includes(
              mode
            )
        );

      if (
        invalidModes.length > 0
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_HIRING_WORK_MODE",
          message:
            "One or more hiring work modes are invalid.",
        });
      }

      company.hiringWorkModes = [
        ...new Set(
          body.hiringWorkModes
        ),
      ];
    }

    /*
     * --------------------------------------------------------
     * SLUG
     * --------------------------------------------------------
     *
     * Slug is generated by the backend.
     * Frontend cannot directly control it.
     */

    const companyNameChanged =
      previousCompanyName !==
      company.companyName;

    if (
      !company.slug ||
      companyNameChanged
    ) {
      company.slug =
        await generateUniqueSlug(
          company.companyName,
          company._id
        );
    }

    /*
     * --------------------------------------------------------
     * PROFILE COMPLETION
     * --------------------------------------------------------
     */

    const profileCompleted =
      isProfileComplete(
        company
      );

    const onboardingStep =
      getOnboardingStep(
        company
      );

    company.profileCompleted =
      profileCompleted;

    company.onboardingStep =
      onboardingStep;

    if (profileCompleted) {
      if (
        !company.profileCompletedAt
      ) {
        company.profileCompletedAt =
          new Date();
      }

      /*
       * Automatically submit completed profiles
       * for admin verification.
       *
       * Verified companies are also returned to
       * pending if they make profile changes.
       */

      if (
        previousVerificationStatus ===
          "unverified" ||
        previousVerificationStatus ===
          "rejected" ||
        previousVerificationStatus ===
          "verified"
      ) {
        company.verificationStatus =
          "pending";

        company.verificationSubmittedAt =
          new Date();

        company.verifiedAt = null;

        company.verificationNotes =
          "";
      }
    } else {
      company.profileCompletedAt =
        null;

      if (
        previousVerificationStatus ===
          "verified" ||
        previousVerificationStatus ===
          "pending"
      ) {
        company.verificationStatus =
          "unverified";

        company.verificationSubmittedAt =
          null;

        company.verifiedAt = null;

        company.verificationNotes =
          "";
      }
    }

    /*
     * --------------------------------------------------------
     * CLOSE APPROVED JOBS IF A VERIFIED COMPANY
     * BECOMES PENDING AGAIN.
     * --------------------------------------------------------
     */

    if (
      previousVerificationStatus ===
        "verified" &&
      company.verificationStatus ===
        "pending"
    ) {
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

    await company.save();

    /*
     * Re-fetch with user information.
     */

    const populatedCompany =
      await Company.findById(
        company._id
      ).populate(
        "user",
        "name email username role emailVerified"
      );

    return res.status(200).json({
      success: true,

      code:
        profileCompleted
          ? "COMPANY_PROFILE_COMPLETED"
          : "COMPANY_PROFILE_UPDATED",

      message:
        profileCompleted
          ? "Company profile completed successfully."
          : "Company profile updated successfully.",

      company:
        buildCompanyResponse(
          populatedCompany
        ),

      profileCompleted,

      onboardingStep,

      verificationStatus:
        populatedCompany.verificationStatus ||
        "unverified",
    });
  } catch (error) {
    console.error(
      "Update company profile error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        code:
          "COMPANY_PROFILE_VALIDATION_FAILED",
        message:
          "Some company information is invalid.",
      });
    }

    /*
     * Handle duplicate slug safely.
     */
    if (
      error.code === 11000 &&
      error.keyPattern?.slug
    ) {
      return res.status(409).json({
        success: false,
        code:
          "COMPANY_SLUG_ALREADY_EXISTS",
        message:
          "Unable to generate a unique company URL. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      code:
        "COMPANY_PROFILE_UPDATE_FAILED",
      message:
        "Unable to update company profile.",
    });
  }
};

/*
 * ============================================================
 * SUBMIT COMPANY VERIFICATION
 * ============================================================
 *
 * POST /api/company/verification/submit
 */

const submitVerification =
  async (req, res) => {
    try {
      const company =
        await Company.findOne({
          user: req.user.userId,
        });

      if (!company) {
        return res.status(404).json({
          success: false,
          code:
            "COMPANY_PROFILE_NOT_FOUND",
          message:
            "Company profile not found.",
        });
      }

      /*
       * PROFILE MUST BE COMPLETE
       */

      const profileCompleted =
        isProfileComplete(
          company
        );

      if (!profileCompleted) {
        const onboardingStep =
          getOnboardingStep(
            company
          );

        return res.status(403).json({
          success: false,
          code:
            "PROFILE_COMPLETION_REQUIRED",
          message:
            "Please complete your company profile before submitting verification.",
          nextStep:
            "onboarding",
          onboardingStep,
        });
      }

      /*
       * ALREADY VERIFIED
       */

      if (
        company.verificationStatus ===
        "verified"
      ) {
        return res.status(409).json({
          success: false,
          code:
            "COMPANY_ALREADY_VERIFIED",
          message:
            "Your company is already verified.",
        });
      }

      /*
       * ALREADY PENDING
       */

      if (
        company.verificationStatus ===
        "pending"
      ) {
        return res.status(200).json({
          success: true,
          code:
            "VERIFICATION_ALREADY_PENDING",
          message:
            "Your verification request is already pending review.",
          verificationStatus:
            "pending",
          verificationSubmittedAt:
            company.verificationSubmittedAt ||
            null,
        });
      }

      /*
       * SUBMIT
       */

      company.verificationStatus =
        "pending";

      company.verificationSubmittedAt =
        new Date();

      company.verificationNotes =
        "";

      company.verifiedAt =
        null;

      await company.save();

      return res.status(200).json({
        success: true,

        code:
          "COMPANY_VERIFICATION_SUBMITTED",

        message:
          "Your company verification request has been submitted for review.",

        verificationStatus:
          company.verificationStatus,

        verificationSubmittedAt:
          company.verificationSubmittedAt,
      });
    } catch (error) {
      console.error(
        "Submit company verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "COMPANY_VERIFICATION_SUBMISSION_FAILED",
        message:
          "Unable to submit company verification.",
      });
    }
  };

/*
 * ============================================================
 * GET MY JOBS
 * ============================================================
 *
 * GET /api/company/jobs
 */

const getMyJobs = async (req, res) => {
  try {
    const company =
      await Company.findOne({
        user: req.user.userId,
      });

    if (!company) {
      return res.status(404).json({
        success: false,
        code:
          "COMPANY_PROFILE_NOT_FOUND",
        message:
          "Company profile not found.",
      });
    }

    const jobs =
      await Job.find({
        company: company._id,
      })
        .populate(
          "careerPaths",
          "title category"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      code:
        "COMPANY_JOBS_FETCHED",

      jobs,
    });
  } catch (error) {
    console.error(
      "Get company jobs error:",
      error
    );

    return res.status(500).json({
      success: false,
      code:
        "COMPANY_JOBS_FETCH_FAILED",
      message:
        "Unable to fetch company jobs.",
    });
  }
};

/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  getMyCompany,
  updateMyCompany,
  submitVerification,
  getMyJobs,
};