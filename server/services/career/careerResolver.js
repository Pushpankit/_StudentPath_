const CareerPath = require("../../models/CareerPath");
const CareerProfile = require("../../models/CareerProfile");

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._/-]+/g, " ")
    .replace(/\s+/g, " ");
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const resolveFromCareerPath = async (input) => {
  const normalized = normalizeText(input);

  if (!normalized) {
    return null;
  }

  const regex = new RegExp(
    `^${escapeRegex(normalized)}$`,
    "i"
  );

  const career = await CareerPath.findOne({
    $or: [
      { title: regex },
      { aliases: normalized },
    ],
  });

  if (!career) {
    return null;
  }

  return {
    type: "career_path",
    id: career._id,
    title: career.title,
    category: career.category,
    description: career.description,
    aliases: career.aliases || [],
    requiredSkills: career.requiredSkills || [],
    technologies: career.technologies || [],
    projects: career.projects || [],
    roadmap: career.roadmap || [],
  };
};

const resolveFromCareerProfile = async (input) => {
  const normalized = normalizeText(input);

  if (!normalized) {
    return null;
  }

  const career = await CareerProfile.findOne({
    $or: [
      { normalizedTitle: normalized },
      { aliases: normalized },
    ],
    status: "active",
  });

  if (!career) {
    return null;
  }

  return {
    type: "career_profile",
    id: career._id,
    title: career.canonicalTitle,
    category: career.category,
    description: career.description,
    aliases: career.aliases || [],
    requiredSkills: (career.skills || []).map(
      (skill) => skill.name
    ),
    technologies: career.technologies || [],
    projects: career.projectTypes || [],
    learningTopics: career.learningTopics || [],
  };
};

const resolveCareer = async (input) => {
  const normalizedInput = normalizeText(input);

  if (!normalizedInput) {
    return {
      status: "invalid",
      input,
    };
  }

  // 1. Check curated careers.
  const careerPath = await resolveFromCareerPath(
    normalizedInput
  );

  if (careerPath) {
    return {
      status: "resolved",
      source: "career_path",
      career: careerPath,
    };
  }

  // 2. Check previously discovered careers.
  const careerProfile =
    await resolveFromCareerProfile(normalizedInput);

  if (careerProfile) {
    return {
      status: "resolved",
      source: "career_profile",
      career: careerProfile,
    };
  }

  // 3. Nothing found.
  return {
    status: "not_found",
    input: normalizedInput,
  };
};

module.exports = {
  normalizeText,
  resolveCareer,
};