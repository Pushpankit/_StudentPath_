const crypto = require("crypto");

const ActionPlan = require("../../models/ActionPlan");
const Student = require("../../models/Student");
const Job = require("../../models/Job");

const {
  generateActionPlanWithAI,
} = require("../ai/actionPlanAI");

const ALLOWED_STEP_TYPES = new Set([
  "Profile",
  "Learn",
  "Build",
  "Opportunities",
  "Apply",
  "Tracking",
]);

const ALLOWED_PRIORITIES = new Set([
  "high",
  "medium",
  "low",
]);

const SINGLETON_STEP_TYPES = new Set([
  "Profile",
  "Opportunities",
  "Apply",
  "Tracking",
]);

/* =========================================================
   NORMALIZATION
========================================================= */

const normalizeSkill = (skill) => {
  if (skill && typeof skill === "object") {
    return String(skill.name || "")
      .trim()
      .toLowerCase();
  }

  return String(skill || "")
    .trim()
    .toLowerCase();
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

/* =========================================================
   FINGERPRINT
========================================================= */

const createFingerprint = ({
  student,
  career,
  missingSkills,
}) => {
  const normalizedSkills = (
    Array.isArray(student.skills)
      ? student.skills
      : []
  )
    .map(normalizeSkill)
    .filter(Boolean)
    .sort();

  const normalizedProjects = (
    Array.isArray(student.projects)
      ? student.projects
      : []
  )
    .map((project) => ({
      title: normalizeText(project?.title),
      description: normalizeText(
        project?.description
      ),
      technologies: (
        Array.isArray(project?.technologies)
          ? project.technologies
          : []
      )
        .map(normalizeSkill)
        .filter(Boolean)
        .sort(),
    }))
    .sort((a, b) =>
      JSON.stringify(a).localeCompare(
        JSON.stringify(b)
      )
    );

  const normalizedCareerSkills = (
    Array.isArray(career.skills)
      ? career.skills
      : []
  )
    .map(normalizeSkill)
    .filter(Boolean)
    .sort();

  const normalizedMissingSkills = (
    Array.isArray(missingSkills)
      ? missingSkills
      : []
  )
    .map(normalizeSkill)
    .filter(Boolean)
    .sort();

  const input = {
    targetRole: normalizeText(
      student.targetRole
    ),

    skills: normalizedSkills,

    projects: normalizedProjects,

    opportunityType: normalizeText(
      student.opportunityType
    ),

    workMode: normalizeText(
      student.workMode
    ),

    preferredLocation: normalizeText(
      student.preferredLocation
    ),

    careerId: String(career._id),

    careerSkills:
      normalizedCareerSkills,

    missingSkills:
      normalizedMissingSkills,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
};

/* =========================================================
   CAREER / SKILL ANALYSIS
========================================================= */

const buildCareerAnalysis = (
  student,
  career
) => {
  const currentSkills =
    Array.isArray(student.skills)
      ? student.skills
      : [];

  const currentSkillNames = [
    ...new Set(
      currentSkills
        .map(normalizeSkill)
        .filter(Boolean)
    ),
  ];

  const requiredSkills =
    Array.isArray(career.skills)
      ? career.skills
      : [];

  const seenRequiredSkills = new Set();

  const missingSkills = [];

  const matchedSkills = [];

  for (const skill of requiredSkills) {
    const name = normalizeSkill(skill);

    if (!name || seenRequiredSkills.has(name)) {
      continue;
    }

    seenRequiredSkills.add(name);

    if (currentSkillNames.includes(name)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  return {
    currentSkills,
    requiredSkills,
    missingSkills,
    matchedSkills,
  };
};

/* =========================================================
   RELATED JOBS
========================================================= */

const getRelatedJobs = async (career) => {
  try {
    return await Job.find({
      careerPaths: career._id,
    })
      .limit(10)
      .lean();
  } catch (error) {
    console.error(
      "Related jobs error:",
      error
    );

    return [];
  }
};

/* =========================================================
   STEP IDENTITY
========================================================= */

const getStepIdentity = (step) => {
  const type = ALLOWED_STEP_TYPES.has(
    step?.type
  )
    ? step.type
    : "Learn";

  const relatedSkill =
    normalizeSkill(step?.relatedSkill);

  /*
   * Skills should remain separate.
   *
   * Example:
   * Learn + React
   * Learn + TypeScript
   *
   * are two different tasks.
   */
  if (relatedSkill) {
    return `${type}|skill:${relatedSkill}`;
  }

  /*
   * These normally represent one overall
   * action in the plan.
   */
  if (SINGLETON_STEP_TYPES.has(type)) {
    return `type:${type}`;
  }

  /*
   * Build steps can legitimately be multiple
   * different tasks, so use their path/title.
   */
  const path = normalizeText(step?.path);

  const title = normalizeText(step?.title);

  return `${type}|path:${path}|title:${title}`;
};

/* =========================================================
   STABLE STEP ID
========================================================= */

const createStableStepId = (identity) => {
  const hash = crypto
    .createHash("sha256")
    .update(identity)
    .digest("hex")
    .slice(0, 20);

  return `action-${hash}`;
};

/* =========================================================
   STEP NORMALIZATION
========================================================= */

const normalizeGeneratedStep = (step) => {
  const type = ALLOWED_STEP_TYPES.has(
    step?.type
  )
    ? step.type
    : "Learn";

  const priority = ALLOWED_PRIORITIES.has(
    step?.priority
  )
    ? step.priority
    : "medium";

  const normalized = {
    title:
      String(step?.title || "").trim(),

    description:
      String(step?.description || "").trim(),

    type,

    action:
      String(step?.action || "").trim(),

    path:
      String(step?.path || "").trim(),

    priority,

    relatedSkill:
      String(step?.relatedSkill || "").trim(),

    estimatedHours:
      Number.isFinite(
        Number(step?.estimatedHours)
      )
        ? Math.max(
            1,
            Math.round(
              Number(step.estimatedHours)
            )
          )
        : null,

    successCriteria:
      String(
        step?.successCriteria || ""
      ).trim(),

    status: "pending",

    completedAt: null,
  };

  const identity =
    getStepIdentity(normalized);

  return {
    ...normalized,
    id: createStableStepId(identity),
  };
};

/* =========================================================
   MERGE ACTION PLAN STEPS
========================================================= */

/*
 * Important:
 *
 * We DO NOT replace the old steps.
 *
 * Existing steps stay.
 *
 * If AI produces a step that already exists:
 *   - update its description/details
 *   - preserve completed status
 *   - preserve completedAt
 *   - preserve its existing ID
 *
 * If AI produces a genuinely new step:
 *   - append it
 *
 * If an old step is no longer returned by AI:
 *   - keep it
 *
 * Therefore a profile change cannot reset
 * the user's Action Plan.
 */

const mergeSteps = (
  existingSteps,
  generatedSteps
) => {
  const existing =
    Array.isArray(existingSteps)
      ? existingSteps
      : [];

  const generated =
    Array.isArray(generatedSteps)
      ? generatedSteps
      : [];

  const merged = [];

  const identityMap = new Map();

  /*
   * First preserve everything already
   * stored in MongoDB.
   */
  for (const oldStep of existing) {
    const normalizedOld = {
      id:
        String(oldStep?.id || "").trim() ||
        createStableStepId(
          getStepIdentity(oldStep)
        ),

      title:
        String(oldStep?.title || "").trim(),

      description:
        String(
          oldStep?.description || ""
        ).trim(),

      type:
        ALLOWED_STEP_TYPES.has(
          oldStep?.type
        )
          ? oldStep.type
          : "Learn",

      action:
        String(oldStep?.action || "").trim(),

      path:
        String(oldStep?.path || "").trim(),

      priority:
        ALLOWED_PRIORITIES.has(
          oldStep?.priority
        )
          ? oldStep.priority
          : "medium",

      relatedSkill:
        String(
          oldStep?.relatedSkill || ""
        ).trim(),

      estimatedHours:
        Number.isFinite(
          Number(oldStep?.estimatedHours)
        )
          ? Math.max(
              1,
              Math.round(
                Number(
                  oldStep.estimatedHours
                )
              )
            )
          : null,

      successCriteria:
        String(
          oldStep?.successCriteria || ""
        ).trim(),

      status:
        oldStep?.status === "completed"
          ? "completed"
          : "pending",

      completedAt:
        oldStep?.status === "completed"
          ? oldStep?.completedAt || null
          : null,
    };

    const identity =
      getStepIdentity(normalizedOld);

    /*
     * Keep duplicates instead of deleting
     * user-created history.
     */
    let mapKey = identity;

    if (identityMap.has(mapKey)) {
      mapKey = `${identity}|existing:${merged.length}`;
    }

    identityMap.set(
      mapKey,
      merged.length
    );

    merged.push(normalizedOld);
  }

  /*
   * Now merge the newly generated tasks.
   */
  for (const generatedStep of generated) {
    const normalizedNew =
      normalizeGeneratedStep(
        generatedStep
      );

    const identity =
      getStepIdentity(
        normalizedNew
      );

    /*
     * Find an existing task with the
     * same identity.
     */
    const existingIndex =
      merged.findIndex(
        (step) =>
          getStepIdentity(step) ===
          identity
      );

    if (existingIndex === -1) {
      /*
       * Completely new task.
       */
      merged.push(normalizedNew);

      continue;
    }

    /*
     * Existing task found.
     *
     * Update its information but NEVER
     * reset its completion status.
     */
    const oldStep =
      merged[existingIndex];

    merged[existingIndex] = {
      ...normalizedNew,

      /*
       * Keep the MongoDB step ID so the
       * frontend can continue using it.
       */
      id: oldStep.id,

      /*
       * Most important part:
       * preserve completion.
       */
      status:
        oldStep.status === "completed"
          ? "completed"
          : "pending",

      completedAt:
        oldStep.status === "completed"
          ? oldStep.completedAt || null
          : null,
    };
  }

  /*
   * Re-number steps without changing their
   * identity or completion state.
   */
  return merged.map(
    (step, index) => ({
      ...step,
      number: index + 1,
    })
  );
};

/* =========================================================
   ATOMIC ACTION PLAN PERSISTENCE
========================================================= */

/*
 * We deliberately do NOT use:
 *
 * actionPlan.save()
 *
 * because two requests can read the same
 * document and then attempt to save different
 * versions.
 *
 * Instead we use an atomic update with
 * optimistic version checking.
 */

const persistActionPlan = async ({
  studentId,
  careerId,
  fingerprint,
  aiPlan,
}) => {
  const MAX_RETRIES = 4;

  const isAIGenerated =
    aiPlan.model !==
    "deterministic-fallback";

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt += 1
  ) {
    const current =
      await ActionPlan.findOne({
        student: studentId,
      });

    /*
     * Another request may already have
     * generated the exact same plan.
     *
     * Reuse it.
     */
    if (
      current &&
      current.inputFingerprint ===
        fingerprint
    ) {
      return current;
    }

    /*
     * No ActionPlan exists.
     *
     * Try to create one.
     */
    if (!current) {
      try {
        return await ActionPlan.create({
          student: studentId,

          careerProfile: careerId,

          summary:
            String(
              aiPlan.summary || ""
            ).trim(),

          steps: aiPlan.steps,

          aiGenerated:
            isAIGenerated,

          aiModel:
            aiPlan.model,

          inputFingerprint:
            fingerprint,

          generatedAt:
            new Date(),
        });
      } catch (error) {
        /*
         * Another request may have created
         * the plan between findOne() and create().
         *
         * Retry by reading it again.
         */
        if (error?.code === 11000) {
          continue;
        }

        throw error;
      }
    }

    /*
     * Existing plan found.
     *
     * Merge instead of replacing.
     */
    const mergedSteps =
      mergeSteps(
        current.steps,
        aiPlan.steps
      );

    const expectedVersion =
      Number.isInteger(
        current.__v
      )
        ? current.__v
        : null;

    let versionFilter;

    let update;

    if (expectedVersion === null) {
      /*
       * Legacy document without __v.
       */
      versionFilter = {
        _id: current._id,
        student: studentId,
        __v: {
          $exists: false,
        },
      };

      update = {
        $set: {
          careerProfile: careerId,

          summary:
            String(
              aiPlan.summary || ""
            ).trim(),

          steps: mergedSteps,

          aiGenerated:
            isAIGenerated,

          aiModel:
            aiPlan.model,

          inputFingerprint:
            fingerprint,

          generatedAt:
            new Date(),

          __v: 1,
        },
      };
    } else {
      /*
       * Normal Mongoose document.
       *
       * Only update if nobody changed the
       * document after we read it.
       */
      versionFilter = {
        _id: current._id,
        student: studentId,
        __v: expectedVersion,
      };

      update = {
        $set: {
          careerProfile: careerId,

          summary:
            String(
              aiPlan.summary || ""
            ).trim(),

          steps: mergedSteps,

          aiGenerated:
            isAIGenerated,

          aiModel:
            aiPlan.model,

          inputFingerprint:
            fingerprint,

          generatedAt:
            new Date(),
        },

        $inc: {
          __v: 1,
        },
      };
    }

    const updated =
      await ActionPlan.findOneAndUpdate(
        versionFilter,
        update,
        {
          returnDocument: "after",
          runValidators: true,
        }
      );

    /*
     * Update succeeded.
     */
    if (updated) {
      return updated;
    }

    /*
     * Version changed.
     *
     * Another request updated the ActionPlan
     * while we were working.
     *
     * Retry from the latest MongoDB state.
     */
  }

  throw new Error(
    "Action Plan was modified by another request. Please try again."
  );
};

/* =========================================================
   MAIN ACTION PLAN SERVICE
========================================================= */

const getOrCreateActionPlan =
  async (studentUserId) => {
    const student =
      await Student.findOne({
        user: studentUserId,
      })
        .populate("careerProfile")
        .populate(
          "user",
          "email role"
        );

    if (!student) {
      throw new Error(
        "Student profile not found"
      );
    }

    if (!student.careerProfile) {
      throw new Error(
        "Career profile has not been created yet"
      );
    }

    const career =
      student.careerProfile;

    const {
      missingSkills,
      matchedSkills,
    } =
      buildCareerAnalysis(
        student,
        career
      );

    const relatedJobs =
      await getRelatedJobs(career);

    const fingerprint =
      createFingerprint({
        student,
        career,
        missingSkills,
      });

    /*
     * If the exact same input already has
     * an ActionPlan, return it immediately.
     *
     * This applies to BOTH AI-generated
     * and deterministic fallback plans.
     */
    const existing =
      await ActionPlan.findOne({
        student: student._id,
      });

    if (
      existing &&
      existing.inputFingerprint ===
        fingerprint
    ) {
      return {
        actionPlan: existing,
        student,
        career,
        matchedSkills,
        missingSkills,
        relatedJobs,
      };
    }

    /*
     * Generate a new personalized plan.
     *
     * IMPORTANT:
     * This does NOT mean replacing the
     * existing MongoDB plan.
     *
     * persistActionPlan() merges it.
     */
    const aiPlan =
      await generateActionPlanWithAI({
        student,

        career,

        missingSkills:
          missingSkills.map(
            (skill) =>
              skill.name
          ),

        relatedJobs,
      });

    /*
     * Persist safely.
     *
     * Existing completed tasks remain
     * completed.
     *
     * Existing pending tasks remain.
     *
     * New relevant tasks are added.
     */
    const actionPlan =
      await persistActionPlan({
        studentId:
          student._id,

        careerId:
          career._id,

        fingerprint,

        aiPlan,
      });

    return {
      actionPlan,
      student,
      career,
      matchedSkills,
      missingSkills,
      relatedJobs,
    };
  };

module.exports = {
  getOrCreateActionPlan,
};