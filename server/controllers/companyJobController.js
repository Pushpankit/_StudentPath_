const mongoose = require("mongoose");
const Job = require("../models/Job");
const Company = require("../models/Company");
const CareerPath = require("../models/CareerPath");
const CareerProfile = require("../models/CareerProfile");


// ======================================================
// CONSTANTS
// ======================================================

const ALLOWED_JOB_TYPES = [
  "Internship",
  "Full-time",
  "Part-time",
  "Contract",
];

const ALLOWED_EXPERIENCE_LEVELS = [
  "Fresher",
  "0-1 years",
  "1-2 years",
  "2-3 years",
  "3+ years",
];


// ======================================================
// HELPERS
// ======================================================

const normalizeString = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};


const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return [
    ...new Set(
      skills
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter(Boolean)
    ),
  ].slice(0, 50);
};


const validateSalary = (salary, fieldName) => {
  if (
    salary === undefined ||
    salary === null ||
    salary === ""
  ) {
    return {
      valid: true,
      value: null,
    };
  }

  const numericValue = Number(salary);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return {
      valid: false,
      message: `${fieldName} must be a valid non-negative number.`,
    };
  }

  return {
    valid: true,
    value: numericValue,
  };
};


// ======================================================
// COMPANY JOBS
// ======================================================


// ------------------------------------------------------
// CREATE JOB
// POST /api/company/jobs
// ------------------------------------------------------

const createCompanyJob = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const company = await Company.findOne({
      user: userId,
    }).select("_id verificationStatus");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found.",
      });
    }

    // Only verified companies can create jobs.
    if (company.verificationStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message:
          "Your company must be verified before posting jobs.",
        code: "COMPANY_NOT_VERIFIED",
      });
    }

    const {
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      skills,
      careerPaths,
    } = req.body;

    // ----------------------------------------------
    // Basic validation
    // ----------------------------------------------

    const cleanTitle = normalizeString(title);
    const cleanDescription = normalizeString(description);
    const cleanLocation = normalizeString(location);

    if (
      cleanTitle.length < 2 ||
      cleanTitle.length > 200
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job title must be between 2 and 200 characters.",
      });
    }

    if (
      cleanDescription.length < 20 ||
      cleanDescription.length > 10000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job description must be between 20 and 10000 characters.",
      });
    }

    if (
      cleanLocation.length < 2 ||
      cleanLocation.length > 200
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job location must be between 2 and 200 characters.",
      });
    }

    if (!ALLOWED_JOB_TYPES.includes(jobType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job type.",
      });
    }

    if (
      !ALLOWED_EXPERIENCE_LEVELS.includes(
        experienceLevel
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience level.",
      });
    }

    // ----------------------------------------------
    // Salary validation
    // ----------------------------------------------

    const minimumSalary = validateSalary(
      salaryMin,
      "Minimum salary"
    );

    if (!minimumSalary.valid) {
      return res.status(400).json({
        success: false,
        message: minimumSalary.message,
      });
    }

    const maximumSalary = validateSalary(
      salaryMax,
      "Maximum salary"
    );

    if (!maximumSalary.valid) {
      return res.status(400).json({
        success: false,
        message: maximumSalary.message,
      });
    }

    if (
      minimumSalary.value !== null &&
      maximumSalary.value !== null &&
      minimumSalary.value > maximumSalary.value
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum salary cannot be greater than maximum salary.",
      });
    }

    // ----------------------------------------------
    // Skills
    // ----------------------------------------------

    const normalizedSkills = normalizeSkills(skills);

    // ----------------------------------------------
    // Career paths
    // ----------------------------------------------

    let normalizedCareerPaths = [];

    if (careerPaths !== undefined) {
      if (!Array.isArray(careerPaths)) {
        return res.status(400).json({
          success: false,
          message: "Career paths must be an array.",
        });
      }

      for (const careerPathId of careerPaths) {
        if (
          !mongoose.Types.ObjectId.isValid(
            careerPathId
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid career path ID.",
          });
        }

        let careerPath = await CareerPath.findById(
          careerPathId
        ).select("_id");

        // If the ID belongs to CareerProfile, resolve
        // it to the canonical CareerPath.
        if (!careerPath) {
          const careerProfile =
            await CareerProfile.findById(
              careerPathId
            ).select(
              "canonicalTitle aliases"
            );

          if (careerProfile) {
            const canonicalTitle =
              normalizeString(
                careerProfile.canonicalTitle
              );

            if (canonicalTitle) {
              careerPath =
                await CareerPath.findOne({
                  $or: [
                    {
                      title: canonicalTitle,
                    },
                    {
                      aliases: canonicalTitle,
                    },
                  ],
                }).select("_id");
            }
          }
        }

        if (!careerPath) {
          return res.status(400).json({
            success: false,
            message:
              "One or more selected career paths are invalid.",
          });
        }

        normalizedCareerPaths.push(
          careerPath._id
        );
      }
    }

    normalizedCareerPaths = [
      ...new Set(
        normalizedCareerPaths.map((id) =>
          id.toString()
        )
      ),
    ];

    // ----------------------------------------------
    // Create job
    // ----------------------------------------------

    const job = await Job.create({
      company: company._id,
      title: cleanTitle,
      description: cleanDescription,
      location: cleanLocation,
      jobType,
      experienceLevel,
      salaryMin: minimumSalary.value,
      salaryMax: maximumSalary.value,
      skills: normalizedSkills,
      careerPaths: normalizedCareerPaths,

      // Jobs always start pending.
      status: "Pending",
      isActive: false,

      applicationCount: 0,
    });

    const populatedJob = await Job.findById(job._id)
      .populate(
        "company",
        "companyName legalName website linkedinUrl headquarters logoUrl verificationStatus"
      )
      .populate(
        "careerPaths",
        "title category"
      );

    return res.status(201).json({
      success: true,
      code: "COMPANY_JOB_CREATED",
      message:
        "Job submitted for admin approval.",
      job: populatedJob,
    });
  } catch (error) {
    console.error(
      "Create company job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create job.",
    });
  }
};


// ------------------------------------------------------
// GET COMPANY JOBS
// GET /api/company/jobs
// ------------------------------------------------------

const getMyJobs = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const company = await Company.findOne({
      user: userId,
    }).select("_id");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found.",
      });
    }

    const jobs = await Job.find({
      company: company._id,
    })
      .populate(
        "careerPaths",
        "title category"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error(
      "Get company jobs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch company jobs.",
    });
  }
};


// ------------------------------------------------------
// GET COMPANY JOB BY ID
// GET /api/company/jobs/:id
// ------------------------------------------------------

const getMyJobById = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const company = await Company.findOne({
      user: userId,
    }).select("_id");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found.",
      });
    }

    const job = await Job.findOne({
      _id: id,
      company: company._id,
    })
      .populate(
        "careerPaths",
        "title category description"
      )
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error(
      "Get company job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job.",
    });
  }
};


// ------------------------------------------------------
// UPDATE COMPANY JOB
// PUT /api/company/jobs/:id
// ------------------------------------------------------

const updateMyJob = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const company = await Company.findOne({
      user: userId,
    }).select("_id verificationStatus");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found.",
      });
    }

    const job = await Job.findOne({
      _id: id,
      company: company._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    const {
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      skills,
      careerPaths,
    } = req.body;

    // ----------------------------------------------
    // Title
    // ----------------------------------------------

    if (title !== undefined) {
      const cleanTitle = normalizeString(title);

      if (
        cleanTitle.length < 2 ||
        cleanTitle.length > 200
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Job title must be between 2 and 200 characters.",
        });
      }

      job.title = cleanTitle;
    }

    // ----------------------------------------------
    // Description
    // ----------------------------------------------

    if (description !== undefined) {
      const cleanDescription =
        normalizeString(description);

      if (
        cleanDescription.length < 20 ||
        cleanDescription.length > 10000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Job description must be between 20 and 10000 characters.",
        });
      }

      job.description = cleanDescription;
    }

    // ----------------------------------------------
    // Location
    // ----------------------------------------------

    if (location !== undefined) {
      const cleanLocation =
        normalizeString(location);

      if (
        cleanLocation.length < 2 ||
        cleanLocation.length > 200
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Job location must be between 2 and 200 characters.",
        });
      }

      job.location = cleanLocation;
    }

    // ----------------------------------------------
    // Job type
    // ----------------------------------------------

    if (jobType !== undefined) {
      if (!ALLOWED_JOB_TYPES.includes(jobType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid job type.",
        });
      }

      job.jobType = jobType;
    }

    // ----------------------------------------------
    // Experience level
    // ----------------------------------------------

    if (experienceLevel !== undefined) {
      if (
        !ALLOWED_EXPERIENCE_LEVELS.includes(
          experienceLevel
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid experience level.",
        });
      }

      job.experienceLevel = experienceLevel;
    }

    // ----------------------------------------------
    // Salary
    // ----------------------------------------------

    let newSalaryMin = job.salaryMin;
    let newSalaryMax = job.salaryMax;

    if (salaryMin !== undefined) {
      const result = validateSalary(
        salaryMin,
        "Minimum salary"
      );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      newSalaryMin = result.value;
    }

    if (salaryMax !== undefined) {
      const result = validateSalary(
        salaryMax,
        "Maximum salary"
      );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      newSalaryMax = result.value;
    }

    if (
      newSalaryMin !== null &&
      newSalaryMax !== null &&
      newSalaryMin > newSalaryMax
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum salary cannot be greater than maximum salary.",
      });
    }

    job.salaryMin = newSalaryMin;
    job.salaryMax = newSalaryMax;

    // ----------------------------------------------
    // Skills
    // ----------------------------------------------

    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({
          success: false,
          message: "Skills must be an array.",
        });
      }

      job.skills = normalizeSkills(skills);
    }

    // ----------------------------------------------
    // Career paths
    // ----------------------------------------------

    if (careerPaths !== undefined) {
      if (!Array.isArray(careerPaths)) {
        return res.status(400).json({
          success: false,
          message:
            "Career paths must be an array.",
        });
      }

      const normalizedCareerPaths = [];

      for (const careerPathId of careerPaths) {
        if (
          !mongoose.Types.ObjectId.isValid(
            careerPathId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid career path ID.",
          });
        }

        let careerPath =
          await CareerPath.findById(
            careerPathId
          ).select("_id");

        if (!careerPath) {
          const careerProfile =
            await CareerProfile.findById(
              careerPathId
            ).select(
              "canonicalTitle aliases"
            );

          if (careerProfile) {
            const canonicalTitle =
              normalizeString(
                careerProfile.canonicalTitle
              );

            if (canonicalTitle) {
              careerPath =
                await CareerPath.findOne({
                  $or: [
                    {
                      title: canonicalTitle,
                    },
                    {
                      aliases: canonicalTitle,
                    },
                  ],
                }).select("_id");
            }
          }
        }

        if (!careerPath) {
          return res.status(400).json({
            success: false,
            message:
              "One or more selected career paths are invalid.",
          });
        }

        normalizedCareerPaths.push(
          careerPath._id
        );
      }

      job.careerPaths = [
        ...new Map(
          normalizedCareerPaths.map((path) => [
            path.toString(),
            path,
          ])
        ).values(),
      ];
    }

    // Do not allow company to modify these:
    // status
    // isActive
    // company
    //
    // These remain controlled by the moderation/company
    // workflow.

    await job.save();

    const updatedJob = await Job.findById(job._id)
      .populate(
        "careerPaths",
        "title category description"
      )
      .lean();

    return res.status(200).json({
      success: true,
      message: "Job updated successfully.",
      job: updatedJob,
    });
  } catch (error) {
    console.error(
      "Update company job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update job.",
    });
  }
};


// ------------------------------------------------------
// CLOSE JOB
// PATCH /api/company/jobs/:id/close
// ------------------------------------------------------

const closeMyJob = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const company = await Company.findOne({
      user: userId,
    }).select("_id");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found.",
      });
    }

    const job = await Job.findOne({
      _id: id,
      company: company._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    if (job.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message:
          "Only approved jobs can be closed.",
      });
    }

    job.status = "Closed";
    job.isActive = false;

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job closed successfully.",
      job,
    });
  } catch (error) {
    console.error(
      "Close company job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to close job.",
    });
  }
};


// ------------------------------------------------------
// REOPEN JOB
// PATCH /api/company/jobs/:id/reopen
// ------------------------------------------------------

const reopenMyJob = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const company = await Company.findOne({
      user: userId,
    }).select("_id verificationStatus");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found.",
      });
    }

    if (company.verificationStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message:
          "Your company must be verified to reopen jobs.",
      });
    }

    const job = await Job.findOne({
      _id: id,
      company: company._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    if (job.status !== "Closed") {
      return res.status(400).json({
        success: false,
        message:
          "Only closed jobs can be reopened.",
      });
    }

    // Reopening does not bypass moderation.
    // The job goes back to Pending.
    job.status = "Pending";
    job.isActive = false;
    job.moderationNotes = "";

    await job.save();

    return res.status(200).json({
      success: true,
      message:
        "Job submitted again for admin approval.",
      job,
    });
  } catch (error) {
    console.error(
      "Reopen company job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to reopen job.",
    });
  }
};


// ======================================================
// PUBLIC JOBS
// ======================================================


// ------------------------------------------------------
// GET PUBLIC JOBS
// GET /api/company/jobs/public
// ------------------------------------------------------

const getPublicJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      jobType,
      experienceLevel,
      careerPath,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      status: "Approved",
      isActive: true,
    };

    // ----------------------------------------------
    // Search
    // ----------------------------------------------

    if (search && search.trim()) {
      const searchTerm = search.trim();

      query.$or = [
        {
          title: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          description: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          skills: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ];
    }

    // ----------------------------------------------
    // Location
    // ----------------------------------------------

    if (location && location.trim()) {
      query.location = {
        $regex: location.trim(),
        $options: "i",
      };
    }

    // ----------------------------------------------
    // Job type
    // ----------------------------------------------

    if (jobType && jobType.trim()) {
      if (!ALLOWED_JOB_TYPES.includes(jobType.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid job type.",
        });
      }

      query.jobType = jobType.trim();
    }

    // ----------------------------------------------
    // Experience
    // ----------------------------------------------

    if (
      experienceLevel &&
      experienceLevel.trim()
    ) {
      if (
        !ALLOWED_EXPERIENCE_LEVELS.includes(
          experienceLevel.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid experience level.",
        });
      }

      query.experienceLevel =
        experienceLevel.trim();
    }

    // ----------------------------------------------
    // Career path
    // ----------------------------------------------

    if (careerPath) {
      if (
        !mongoose.Types.ObjectId.isValid(
          careerPath
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid career path ID.",
        });
      }

      query.careerPaths = careerPath;
    }

    // ----------------------------------------------
    // Pagination
    // ----------------------------------------------

    const currentPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      50
    );

    const skip =
      (currentPage - 1) * perPage;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate(
          "company",
          "companyName legalName website linkedinUrl headquarters logoUrl verificationStatus"
        )
        .populate(
          "careerPaths",
          "title category"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Job.countDocuments(query),
    ]);

    const totalPages = Math.ceil(
      total / perPage
    );

    return res.status(200).json({
      success: true,
      jobs,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get public jobs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs.",
    });
  }
};


// ------------------------------------------------------
// GET FEATURED JOBS
// GET /api/company/jobs/public/featured
// ------------------------------------------------------

const getFeaturedJobs = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) || 6,
        1
      ),
      20
    );

    const jobs = await Job.find({
      status: "Approved",
      isActive: true,
    })
      .populate(
        "company",
        "companyName logoUrl headquarters verificationStatus"
      )
      .populate(
        "careerPaths",
        "title category"
      )
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error(
      "Get featured jobs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch featured jobs.",
    });
  }
};


// ------------------------------------------------------
// GET PUBLIC JOB BY ID
// GET /api/company/jobs/public/:id
// ------------------------------------------------------

const getPublicJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const job = await Job.findOne({
      _id: id,
      status: "Approved",
      isActive: true,
    })
      .populate(
        "company",
        "companyName legalName description industry companyType companySize companyStage website linkedinUrl headquarters locations logoUrl verificationStatus"
      )
      .populate(
        "careerPaths",
        "title category description"
      )
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error(
      "Get public job by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job.",
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createCompanyJob,
  getMyJobs,
  getMyJobById,
  updateMyJob,
  closeMyJob,
  reopenMyJob,

  getPublicJobs,
  getFeaturedJobs,
  getPublicJobById,
};