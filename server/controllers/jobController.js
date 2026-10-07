const mongoose = require("mongoose");
const Job = require("../models/Job");

const getPublicJobQuery = () => ({
  status: "Approved",
  isActive: true,
});

// GET /api/jobs
// Public jobs
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

    const query = getPublicJobQuery();

    if (search && search.trim()) {
      query.$text = {
        $search: search.trim(),
      };
    }

    if (location && location.trim()) {
      query.location = {
        $regex: location.trim(),
        $options: "i",
      };
    }

    if (jobType && jobType.trim()) {
      query.jobType = jobType.trim();
    }

    if (experienceLevel && experienceLevel.trim()) {
      query.experienceLevel = experienceLevel.trim();
    }

    if (
      careerPath &&
      mongoose.Types.ObjectId.isValid(careerPath)
    ) {
      query.careerPaths = careerPath;
    }

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      50
    );

    const skip = (currentPage - 1) * perPage;

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

    return res.status(200).json({
      success: true,
      jobs,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: currentPage < Math.ceil(total / perPage),
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get public jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs.",
    });
  }
};

// GET /api/jobs/:id
// Public job details
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
    console.error("Get public job by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job.",
    });
  }
};

// GET /api/jobs/featured
// Featured/latest approved jobs
const getFeaturedJobs = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 6, 1),
      20
    );

    const jobs = await Job.find(getPublicJobQuery())
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
    console.error("Get featured jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch featured jobs.",
    });
  }
};

module.exports = {
  getPublicJobs,
  getPublicJobById,
  getFeaturedJobs,
};