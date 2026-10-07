/*
 * Skill normalization shared by profile/career matching.
 *
 * The goal is deliberately conservative: exact canonical matches are
 * preferred. Only well-known aliases are collapsed so that unrelated
 * skills such as "Java" and "JavaScript" never match by substring.
 */

const SKILL_ALIASES = new Map([
  ["js", "javascript"],
  ["javascript es6", "javascript"],
  ["ecmascript", "javascript"],
  ["ts", "typescript"],
  ["html5", "html"],
  ["css3", "css"],
  ["reactjs", "react"],
  ["react.js", "react"],
  ["nodejs", "node.js"],
  ["node", "node.js"],
  ["node js", "node.js"],
  ["expressjs", "express.js"],
  ["express", "express.js"],
  ["mongodb", "mongodb"],
  ["mongo db", "mongodb"],
  ["restful api", "rest api"],
  ["restful apis", "rest api"],
  ["rest apis", "rest api"],
  ["git hub", "github"],
  ["github", "github"],
]);

const toSkillText = (skill) => {
  if (typeof skill === "string") return skill;

  if (skill && typeof skill === "object") {
    return skill.name || skill.title || skill.skill || "";
  }

  return "";
};

const normalizeSkill = (skill) => {
  const value = String(toSkillText(skill) || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!value) return "";

  return SKILL_ALIASES.get(value) || value;
};

const normalizeSkillList = (skills) => {
  if (!Array.isArray(skills)) return [];

  return [
    ...new Set(
      skills
        .map(normalizeSkill)
        .filter(Boolean)
    ),
  ];
};

const getMatchedSkills = (studentSkills, requiredSkills) => {
  const studentSet = new Set(normalizeSkillList(studentSkills));

  return (Array.isArray(requiredSkills) ? requiredSkills : [])
    .filter((skill) => studentSet.has(normalizeSkill(skill)))
    .map(normalizeSkill)
    .filter(Boolean);
};

const getMissingSkills = (studentSkills, requiredSkills) => {
  const studentSet = new Set(normalizeSkillList(studentSkills));

  return (Array.isArray(requiredSkills) ? requiredSkills : [])
    .map(normalizeSkill)
    .filter((skill) => skill && !studentSet.has(skill));
};

module.exports = {
  normalizeSkill,
  normalizeSkillList,
  getMatchedSkills,
  getMissingSkills,
};
