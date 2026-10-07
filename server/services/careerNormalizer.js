const CareerPath = require("../models/CareerPath");
const CareerProfile = require("../models/CareerProfile");

const normalizeCareerInput = (value) => {
  if (!value) {
    return "";
  }

  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[._/-]+/g, " ")
    .replace(/\s+/g, " ");
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const findCareerByInput = async (input) => {
  const normalizedInput = normalizeCareerInput(input);

  if (!normalizedInput) {
    return null;
  }

  const escapedInput = escapeRegex(normalizedInput);

  // --------------------------------------------------
  // 1. Search standard CareerPath records
  // --------------------------------------------------

  let career = await CareerPath.findOne({
    title: {
      $regex: `^${escapedInput}$`,
      $options: "i",
    },
  });

  if (career) {
    return {
      type: "career_path",
      career,
    };
  }

  career = await CareerPath.findOne({
    aliases: normalizedInput,
  });

  if (career) {
    return {
      type: "career_path",
      career,
    };
  }

  // --------------------------------------------------
  // 2. Search AI-generated CareerProfile records
  // --------------------------------------------------

  career = await CareerProfile.findOne({
    canonicalTitle: {
      $regex: `^${escapedInput}$`,
      $options: "i",
    },
    status: "active",
  });

  if (career) {
    return {
      type: "career_profile",
      career,
    };
  }

  career = await CareerProfile.findOne({
    aliases: normalizedInput,
    status: "active",
  });

  if (career) {
    return {
      type: "career_profile",
      career,
    };
  }

  return null;
};

module.exports = {
  normalizeCareerInput,
  findCareerByInput,
};