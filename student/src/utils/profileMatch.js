function normalizeSkill(skill) {
  if (!skill) return "";

  if (typeof skill === "string") {
    return skill.trim().toLowerCase();
  }

  if (typeof skill === "object") {
    return String(
      skill.name ||
      skill.title ||
      skill.skill ||
      ""
    )
      .trim()
      .toLowerCase();
  }

  return "";
}

function getStudentSkills(student) {
  if (!student) return [];

  const skills = student.skills;

  if (Array.isArray(skills)) {
    return skills
      .map(normalizeSkill)
      .filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map(normalizeSkill)
      .filter(Boolean);
  }

  if (skills && typeof skills === "object") {
    return Object.values(skills)
      .flat()
      .map(normalizeSkill)
      .filter(Boolean);
  }

  return [];
}

function getJobSkills(job) {
  if (!job) return [];

  const skills = job.skills;

  if (Array.isArray(skills)) {
    return skills
      .map(normalizeSkill)
      .filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map(normalizeSkill)
      .filter(Boolean);
  }

  return [];
}

export function getMatchedSkills(student, job) {
  const studentSkills = getStudentSkills(student);
  const jobSkills = getJobSkills(job);

  return jobSkills.filter((jobSkill) =>
    studentSkills.some((studentSkill) => {
      return (
        studentSkill === jobSkill ||
        studentSkill.includes(jobSkill) ||
        jobSkill.includes(studentSkill)
      );
    })
  );
}

export function getMissingSkills(student, job) {
  const studentSkills = getStudentSkills(student);
  const jobSkills = getJobSkills(job);

  return jobSkills.filter(
    (jobSkill) =>
      !studentSkills.some((studentSkill) => {
        return (
          studentSkill === jobSkill ||
          studentSkill.includes(jobSkill) ||
          jobSkill.includes(studentSkill)
        );
      })
  );
}

export function calculateProfileMatch(student, job) {
  const jobSkills = getJobSkills(job);

  if (jobSkills.length === 0) {
    return 0;
  }

  const matchedSkills = getMatchedSkills(student, job);

  return Math.round(
    (matchedSkills.length / jobSkills.length) * 100
  );
}