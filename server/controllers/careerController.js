const CareerPath = require("../models/CareerPath");
const CareerProfile = require("../models/CareerProfile");

const {
  resolveOrDiscoverCareer,
} = require("../services/career/careerResolutionService");

const getCareers = async (req, res) => {
  try {
    const [careerPaths, careerProfiles] = await Promise.all([
      CareerPath.find().sort({ title: 1 }),
      CareerProfile.find({
        status: "active",
      }).sort({ canonicalTitle: 1 }),
    ]);

    const careers = [
      ...careerPaths.map((career) => ({
        _id: career._id,
        type: "career_path",
        title: career.title,
        canonicalTitle: career.title,
        category: career.category,
        description: career.description,
        aliases: career.aliases || [],
        skills: career.requiredSkills || [],
        technologies: career.technologies || [],
        projects: career.projects || [],
        roadmap: career.roadmap || [],
      })),

      ...careerProfiles.map((career) => ({
        _id: career._id,
        type: "career_profile",
        title: career.canonicalTitle,
        canonicalTitle: career.canonicalTitle,
        category: career.category,
        description: career.description,
        aliases: career.aliases || [],
        skills: career.skills || [],
        technologies: career.technologies || [],
        projects: career.projectTypes || [],
        learningTopics: career.learningTopics || [],
        confidence: career.confidence,
        source: career.source,
      })),
    ];

    // Remove duplicate careers across CareerPath and CareerProfile.
    // Prefer CareerPath when the same career exists in both collections.
    const uniqueCareers = new Map();

    for (const career of careers) {
      const key = String(
        career.canonicalTitle ||
          career.title ||
          ""
      )
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (!key) {
        continue;
      }

      if (!uniqueCareers.has(key)) {
        uniqueCareers.set(key, career);
        continue;
      }

      const existing = uniqueCareers.get(key);

      // Prefer the standard CareerPath over an AI-created CareerProfile.
      if (
        existing.type === "career_profile" &&
        career.type === "career_path"
      ) {
        uniqueCareers.set(key, career);
      }
    }

    const result = Array.from(uniqueCareers.values()).sort((a, b) =>
      String(a.title).localeCompare(String(b.title))
    );

    res.json({
      careers: result,
    });
  } catch (error) {
    console.error("Get careers error:", error);

    res.status(500).json({
      message: "Unable to fetch careers",
    });
  }
};

const getCareerById = async (req, res) => {
  try {
    let career = await CareerPath.findById(
      req.params.id
    );

    if (career) {
      return res.json({
        career: {
          ...career.toObject(),
          type: "career_path",
          canonicalTitle: career.title,
          skills: career.requiredSkills || [],
        },
      });
    }

    career = await CareerProfile.findById(
      req.params.id
    );

    if (career) {
      return res.json({
        career: {
          ...career.toObject(),
          type: "career_profile",
          title: career.canonicalTitle,
          skills: career.skills || [],
          projects: career.projectTypes || [],
        },
      });
    }

    return res.status(404).json({
      message: "Career not found",
    });
  } catch (error) {
    console.error("Get career error:", error);

    res.status(500).json({
      message: "Unable to fetch career",
    });
  }
};

const normalizeCareer = async (req, res) => {
  try {
    const { targetRole } = req.body;

    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({
        message: "Target career is required",
      });
    }

    const result = await resolveOrDiscoverCareer(
      targetRole.trim()
    );

    if (result.status === "invalid") {
      return res.status(400).json({
        message: "Target career is required",
      });
    }

    return res.json({
      input: targetRole.trim(),
      source: result.source,
      career: result.career,
    });
  } catch (error) {
    console.error("Normalize career error:", error);

    res.status(500).json({
      message: "Unable to understand the target career",
    });
  }
};

module.exports = {
  getCareers,
  getCareerById,
  normalizeCareer,
};