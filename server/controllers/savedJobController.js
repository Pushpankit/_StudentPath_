const mongoose = require("mongoose");
const SavedJob = require("../models/SavedJob");
const Student = require("../models/Student");
const Job = require("../models/Job");

const saveJob = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_JOB_ID",
        message: "Invalid job ID.",
      });
    }

    const job = await Job.findOne({
      _id: req.params.jobId,
      status: "Approved",
      isActive: true,
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const existingSavedJob = await SavedJob.findOne({
      student: student._id,
      job: job._id,
    });

    if (existingSavedJob) {
      return res.status(409).json({
        message: "Opportunity already saved",
        savedJob: existingSavedJob,
      });
    }

    const savedJob = await SavedJob.create({
      student: student._id,
      job: job._id,
    });

    const populatedSavedJob = await SavedJob.findById(
      savedJob._id
    ).populate("job");

    res.status(201).json({
      message: "Opportunity saved successfully",
      savedJob: populatedSavedJob,
    });
  } catch (error) {
    console.error("Save job error:", error);

    res.status(500).json({
      message: "Unable to save opportunity",
    });
  }
};

const unsaveJob = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_JOB_ID",
        message: "Invalid job ID.",
      });
    }

    const deleted = await SavedJob.findOneAndDelete({
      student: student._id,
      job: req.params.jobId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Saved opportunity not found",
      });
    }

    res.json({
      message: "Opportunity removed from saved list",
    });
  } catch (error) {
    console.error("Unsave job error:", error);

    res.status(500).json({
      message: "Unable to remove saved opportunity",
    });
  }
};

const getMySavedJobs = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    const savedJobs = await SavedJob.find({
      student: student._id,
    })
      .populate("job")
      .sort({ createdAt: -1 });

    res.json({
      savedJobs,
    });
  } catch (error) {
    console.error("Get saved jobs error:", error);

    res.status(500).json({
      message: "Unable to fetch saved opportunities",
    });
  }
};

const checkSavedJob = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_JOB_ID",
        message: "Invalid job ID.",
      });
    }

    const savedJob = await SavedJob.findOne({
      student: student._id,
      job: req.params.jobId,
    });

    res.json({
      saved: Boolean(savedJob),
    });
  } catch (error) {
    console.error("Check saved job error:", error);

    res.status(500).json({
      message: "Unable to check saved opportunity",
    });
  }
};

module.exports = {
  saveJob,
  unsaveJob,
  getMySavedJobs,
  checkSavedJob,
};