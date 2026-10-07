const {
  resolveCareer,
} = require("./careerResolver");

const {
  createCareerProfile,
} = require("./careerDiscovery");

const {
  discoverCareerWithAI,
} = require("../ai/careerAI");

const resolveOrDiscoverCareer = async (careerInput) => {
  const existing = await resolveCareer(careerInput);

  if (existing.status === "invalid") {
    return existing;
  }

  if (existing.status === "resolved") {
    return existing;
  }

  const aiResult = await discoverCareerWithAI(careerInput);

  const profile = await createCareerProfile({
    ...aiResult,
    aliases: [
      careerInput,
      ...(aiResult.aliases || []),
    ],
    source: "ai",
  });

  return {
    status: "resolved",
    source: "ai",
    career: {
      type: "career_profile",
      id: profile._id,
      title: profile.canonicalTitle,
      category: profile.category,
      description: profile.description,
      aliases: profile.aliases || [],
      requiredSkills: (profile.skills || []).map(
        (skill) => skill.name
      ),
      technologies: profile.technologies || [],
      projects: profile.projectTypes || [],
      learningTopics: profile.learningTopics || [],
    },
  };
};

module.exports = {
  resolveOrDiscoverCareer,
};