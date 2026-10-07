const CareerProfile = require("../../models/CareerProfile");

const createCareerProfile = async ({
  canonicalTitle,
  aliases = [],
  category = "Other",
  description = "",
  skills = [],
  technologies = [],
  projectTypes = [],
  learningTopics = [],
  confidence = null,
  source = "ai",
  sourceReferences = [],
}) => {
  if (!canonicalTitle) {
    throw new Error(
      "Career profile requires a canonical title."
    );
  }

  const normalizedTitle = canonicalTitle
    .trim()
    .toLowerCase()
    .replace(/[._/-]+/g, " ")
    .replace(/\s+/g, " ");

  const existing = await CareerProfile.findOne({
    normalizedTitle,
  });

  if (existing) {
    return existing;
  }

  const profile = await CareerProfile.create({
    canonicalTitle: canonicalTitle.trim(),

    normalizedTitle,

    aliases: aliases
      .map((alias) => alias.trim().toLowerCase())
      .filter(Boolean),

    category: category.trim(),

    description: description.trim(),

    skills: skills
      .map((skill) => {
        if (typeof skill === "string") {
          return {
            name: skill.trim(),
            source,
          };
        }

        return {
          name: String(skill.name || "").trim(),
          importance:
            typeof skill.importance === "number"
              ? skill.importance
              : null,
          source: skill.source || source,
        };
      })
      .filter((skill) => skill.name),

    technologies: technologies
      .map((item) => String(item).trim())
      .filter(Boolean),

    projectTypes: projectTypes
      .map((item) => String(item).trim())
      .filter(Boolean),

    learningTopics: learningTopics
      .map((item) => String(item).trim())
      .filter(Boolean),

    confidence,

    source,

    sourceReferences: sourceReferences
      .map((item) => String(item).trim())
      .filter(Boolean),

    status:
      confidence !== null && confidence < 60
        ? "pending_review"
        : "active",

    version: 1,

    lastGeneratedAt: new Date(),

    lastValidatedAt: null,
  });

  return profile;
};

module.exports = {
  createCareerProfile,
};