require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not configured."
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

const GEMINI_MODEL =
  "gemini-3.8-flash";

const ALLOWED_STEP_TYPES = [
  "Profile",
  "Learn",
  "Build",
  "Opportunities",
  "Apply",
  "Tracking",
];

const ALLOWED_PRIORITIES = [
  "high",
  "medium",
  "low",
];

const ALLOWED_PATHS = [
  "/profile",
  "/skill-gap",
  "/action-plan",
  "/jobs",
  "/applications",
];

/*
 * Gemini cooldown.
 */
let geminiCooldownUntil = 0;

/*
 * Gemini structured output schema.
 */
const actionPlanSchema = {
  type: "object",

  properties: {
    summary: {
      type: "string",
    },

    steps: {
      type: "array",

      items: {
        type: "object",

        properties: {
          id: {
            type: "string",
          },

          number: {
            type: "integer",
          },

          title: {
            type: "string",
          },

          description: {
            type: "string",
          },

          type: {
            type: "string",
            enum: ALLOWED_STEP_TYPES,
          },

          action: {
            type: "string",
          },

          path: {
            type: "string",
            enum: ALLOWED_PATHS,
          },

          priority: {
            type: "string",
            enum: ALLOWED_PRIORITIES,
          },

          relatedSkill: {
            type: "string",
          },

          estimatedHours: {
            type: "integer",
          },

          successCriteria: {
            type: "string",
          },
        },

        required: [
          "id",
          "number",
          "title",
          "description",
          "type",
          "action",
          "path",
          "priority",
          "relatedSkill",
          "estimatedHours",
          "successCriteria",
        ],
      },
    },
  },

  required: [
    "summary",
    "steps",
  ],
};

/*
 * Helpers
 */

const cleanString = (value) =>
  String(value ?? "").trim();

const cleanArray = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return [
    ...new Set(
      items
        .map((item) =>
          cleanString(item)
        )
        .filter(Boolean)
    ),
  ];
};

const normalizeSkillName = (skill) => {
  if (typeof skill === "string") {
    return cleanString(skill);
  }

  return cleanString(
    skill?.name
  );
};

const isGeminiOnCooldown = () => {
  return (
    Date.now() <
    geminiCooldownUntil
  );
};

const getRetryAfterSeconds = (
  error
) => {
  const retryAfterHeader =
    error?.headers?.get?.(
      "retry-after"
    ) ||
    error?.headers?.get?.(
      "Retry-After"
    );

  if (retryAfterHeader) {
    const seconds = Number(
      retryAfterHeader
    );

    if (
      Number.isFinite(seconds) &&
      seconds > 0
    ) {
      return seconds;
    }
  }

  const message =
    error?.message ||
    error?.error?.message ||
    error?.cause?.error?.message ||
    "";

  const match = message.match(
    /retry in\s+(\d+)\s*s/i
  );

  if (match) {
    const seconds = Number(
      match[1]
    );

    if (
      Number.isFinite(seconds) &&
      seconds > 0
    ) {
      return seconds;
    }
  }

  return 60;
};

const setGeminiCooldown = (
  seconds
) => {
  const safeSeconds = Math.max(
    30,
    Math.min(
      Number(seconds) || 60,
      3600
    )
  );

  geminiCooldownUntil =
    Date.now() +
    safeSeconds * 1000;

  console.warn(
    `Gemini temporarily disabled for ${safeSeconds} seconds because of rate limiting.`
  );
};

/*
 * Normalize the AI result.
 *
 * The service layer will later assign stable
 * database step IDs.
 */
const normalizeResult = (
  result,
  model
) => {
  if (
    !result ||
    typeof result !== "object"
  ) {
    throw new Error(
      "Invalid AI action plan."
    );
  }

  const summary =
    cleanString(result.summary);

  if (!summary) {
    throw new Error(
      "AI action plan has no summary."
    );
  }

  if (
    !Array.isArray(result.steps)
  ) {
    throw new Error(
      "AI action plan has invalid steps."
    );
  }

  const steps = result.steps
    .slice(0, 10)
    .map((step, index) => {
      const type =
        cleanString(step.type);

      const priority =
        cleanString(
          step.priority
        );

      const path =
        cleanString(step.path);

      const estimatedHours =
        Number(step.estimatedHours);

      return {
        /*
         * Temporary ID only.
         * actionPlanService will replace this
         * with a stable server-generated ID.
         */
        id:
          cleanString(step.id) ||
          `generated-${index + 1}`,

        number:
          Number.isInteger(
            Number(step.number)
          ) &&
          Number(step.number) > 0
            ? Number(step.number)
            : index + 1,

        title:
          cleanString(step.title) ||
          `Action ${index + 1}`,

        description:
          cleanString(
            step.description
          ),

        type:
          ALLOWED_STEP_TYPES.includes(
            type
          )
            ? type
            : "Learn",

        action:
          cleanString(step.action),

        path:
          ALLOWED_PATHS.includes(path)
            ? path
            : "/action-plan",

        priority:
          ALLOWED_PRIORITIES.includes(
            priority
          )
            ? priority
            : "medium",

        relatedSkill:
          cleanString(
            step.relatedSkill
          ),

        estimatedHours:
          Number.isFinite(
            estimatedHours
          ) &&
          estimatedHours >= 0
            ? Math.round(
                estimatedHours
              )
            : null,

        successCriteria:
          cleanString(
            step.successCriteria
          ),

        status: "pending",

        completedAt: null,
      };
    })
    .filter(
      (step) =>
        step.title &&
        step.description &&
        step.action
    );

  if (steps.length === 0) {
    throw new Error(
      "AI action plan contains no usable steps."
    );
  }

  /*
   * Renumber after filtering.
   */
  steps.forEach(
    (step, index) => {
      step.number = index + 1;
    }
  );

  return {
    summary,
    steps,
    model,
  };
};

/*
 * Generate with Gemini Interactions API.
 */
const generateWithInteractions =
  async (prompt) => {
    if (isGeminiOnCooldown()) {
      const remainingSeconds =
        Math.ceil(
          (geminiCooldownUntil -
            Date.now()) /
            1000
        );

      const error =
        new Error(
          `Gemini is temporarily rate-limited. Retry in approximately ${remainingSeconds} seconds.`
        );

      error.code =
        "GEMINI_RATE_LIMIT";

      error.status = 429;

      throw error;
    }

    try {
      const interaction =
        await ai.interactions.create({
          model: GEMINI_MODEL,

          input: prompt,

          response_format: {
            type: "text",

            mime_type:
              "application/json",

            schema:
              actionPlanSchema,
          },
        });

      if (
        !interaction?.output_text
      ) {
        throw new Error(
          "Gemini returned an empty response."
        );
      }

      let parsed;

      try {
        parsed = JSON.parse(
          interaction.output_text
        );
      } catch (error) {
        console.error(
          "Gemini JSON parsing error:",
          error
        );

        throw new Error(
          "Gemini returned invalid JSON."
        );
      }

      return normalizeResult(
        parsed,
        GEMINI_MODEL
      );
    } catch (error) {
      const status =
        error?.status ||
        error?.statusCode ||
        error?.cause?.statusCode;

      if (status === 429) {
        const retryAfter =
          getRetryAfterSeconds(
            error
          );

        setGeminiCooldown(
          retryAfter
        );

        const rateLimitError =
          new Error(
            `Gemini rate limit reached. Retry after ${retryAfter} seconds.`
          );

        rateLimitError.code =
          "GEMINI_RATE_LIMIT";

        rateLimitError.status = 429;

        throw rateLimitError;
      }

      throw error;
    }
  };

/*
 * Deterministic fallback.
 */
const buildFallbackActionPlan =
  ({
    student,
    career,
    missingSkills,
    relatedJobs,
  }) => {
    const steps = [];

    const projects =
      Array.isArray(
        student.projects
      )
        ? student.projects
        : [];

    const missing =
      cleanArray(
        missingSkills
      );

    const addStep = ({
      title,
      description,
      type,
      action,
      path,
      priority,
      relatedSkill = "",
      estimatedHours = null,
      successCriteria,
    }) => {
      steps.push({
        id:
          `fallback-${steps.length + 1}`,

        number:
          steps.length + 1,

        title,

        description,

        type,

        action,

        path,

        priority,

        relatedSkill,

        estimatedHours,

        successCriteria,

        status: "pending",

        completedAt: null,
      });
    };

    /*
     * PROFILE
     */

    if (
      !student.name ||
      !student.college ||
      !student.degree
    ) {
      addStep({
        title:
          "Complete your profile",

        description:
          "Add the education and career information needed to understand your current position.",

        type:
          "Profile",

        action:
          "Complete your education, target role, skills and location details.",

        path:
          "/profile",

        priority:
          "high",

        estimatedHours:
          1,

        successCriteria:
          "Your student profile contains the important education and career details.",
      });
    } else {
      addStep({
        title:
          "Review your career profile",

        description:
          "Make sure your StudentPath profile accurately represents your current skills and target career.",

        type:
          "Profile",

        action:
          "Review your target role, skills, education and projects and update anything outdated.",

        path:
          "/profile",

        priority:
          "high",

        estimatedHours:
          1,

        successCriteria:
          "Your profile accurately reflects your current experience and target role.",
      });
    }

    /*
     * MISSING SKILLS
     */

    missing
      .slice(0, 3)
      .forEach(
        (skill, index) => {
          addStep({
            title:
              `Learn ${skill}`,

            description:
              `Build practical knowledge of ${skill} because it is currently identified as a gap for your target career.`,

            type:
              "Learn",

            action:
              `Study ${skill} fundamentals and use them in a small practical exercise.`,

            path:
              "/skill-gap",

            priority:
              index === 0
                ? "high"
                : "medium",

            relatedSkill:
              skill,

            estimatedHours:
              8,

            successCriteria:
              `You can explain the main concepts of ${skill} and use it in a small practical task.`,
          });
        }
      );

    /*
     * PROJECT
     */

    if (
      projects.length === 0
    ) {
      addStep({
        title:
          "Build a career-relevant project",

        description:
          `Build a practical project that demonstrates skills required for ${career.canonicalTitle}.`,

        type:
          "Build",

        action:
          `Choose one project related to ${career.canonicalTitle} and build it from start to finish.`,

        path:
          "/action-plan",

        priority:
          "high",

        estimatedHours:
          20,

        successCriteria:
          "You have a working project that can be demonstrated to an employer.",
      });
    } else {
      addStep({
        title:
          "Strengthen your strongest project",

        description:
          "Improve an existing project so it demonstrates your target career skills clearly.",

        type:
          "Build",

        action:
          "Choose your strongest project, improve its functionality and documentation, and make it easy to demonstrate.",

        path:
          "/action-plan",

        priority:
          "medium",

        estimatedHours:
          8,

        successCriteria:
          "Your strongest project clearly demonstrates relevant technical skills.",
      });
    }

    /*
     * OPPORTUNITIES
     */

    addStep({
      title:
        "Find relevant opportunities",

      description:
        "Identify internships and entry-level positions related to your target career.",

      type:
        "Opportunities",

      action:
        `Search for internships and entry-level ${career.canonicalTitle} opportunities that match your current profile.`,

      path:
        "/jobs",

      priority:
        "high",

      estimatedHours:
        2,

      successCriteria:
        "You have identified relevant opportunities worth applying to.",
    });

    /*
     * APPLY
     */

    addStep({
      title:
        "Apply to suitable opportunities",

      description:
        "Use your updated profile and strongest project when applying to relevant opportunities.",

      type:
        "Apply",

      action:
        "Apply to opportunities where your current skills and projects reasonably match the requirements.",

      path:
        "/jobs",

      priority:
        "high",

      estimatedHours:
        3,

      successCriteria:
        "You have submitted applications to relevant opportunities.",
    });

    /*
     * TRACKING
     */

    addStep({
      title:
        "Track your applications",

      description:
        "Keep a record of applications so you can follow up and learn from your results.",

      type:
        "Tracking",

      action:
        "Record each application, company, role, date, status and next action.",

      path:
        "/applications",

      priority:
        "medium",

      estimatedHours:
        1,

      successCriteria:
        "Every submitted application has a clear status and next action.",
    });

    return {
      summary:
        `Your current plan focuses on strengthening your profile, addressing important skill gaps for ${career.canonicalTitle}, building evidence through projects, and moving toward relevant opportunities.`,

      steps:
        steps.slice(0, 10),

      model:
        "deterministic-fallback",
    };
  };

/*
 * Main generator.
 */
const generateActionPlanWithAI =
  async ({
    student,
    career,
    missingSkills = [],
    relatedJobs = [],
  }) => {
    if (!student) {
      throw new Error(
        "Student data is required."
      );
    }

    if (!career) {
      throw new Error(
        "Career data is required."
      );
    }

    const currentSkills =
      cleanArray(
        student.skills
      );

    const careerSkills =
      Array.isArray(
        career.skills
      )
        ? career.skills
            .map(
              normalizeSkillName
            )
            .filter(Boolean)
        : [];

    const projects =
      Array.isArray(
        student.projects
      )
        ? student.projects
            .slice(0, 10)
            .map(
              (project) => ({
                title:
                  cleanString(
                    project.title
                  ),

                description:
                  cleanString(
                    project.description
                  ),

                technologies:
                  cleanArray(
                    project.technologies
                  ),
              })
            )
        : [];

    const jobs =
      Array.isArray(
        relatedJobs
      )
        ? relatedJobs
            .slice(0, 10)
            .map(
              (job) => ({
                title:
                  cleanString(
                    job.title
                  ),

                company:
                  cleanString(
                    job.company
                  ),

                location:
                  cleanString(
                    job.location
                  ),

                skills:
                  cleanArray(
                    job.skills
                  ),
              })
            )
        : [];

    const prompt = `
You are the career action-plan engine for StudentPath.

Create a practical personalized action plan for this student.

STUDENT

Name:
${cleanString(student.name)}

College:
${cleanString(student.college)}

Degree:
${cleanString(student.degree)}

Branch:
${cleanString(student.branch)}

Graduation Year:
${student.graduationYear || ""}

Target Role:
${cleanString(student.targetRole)}

Current Skills:
${JSON.stringify(currentSkills)}

Projects:
${JSON.stringify(projects)}

CAREER

Career:
${cleanString(career.canonicalTitle)}

Category:
${cleanString(career.category)}

Description:
${cleanString(career.description)}

Required Skills:
${JSON.stringify(careerSkills)}

Technologies:
${JSON.stringify(
  cleanArray(
    career.technologies
  )
)}

Project Types:
${JSON.stringify(
  cleanArray(
    career.projectTypes
  )
)}

Learning Topics:
${JSON.stringify(
  cleanArray(
    career.learningTopics
  )
)}

Missing Skills:
${JSON.stringify(
  cleanArray(
    missingSkills
  )
)}

Related Opportunities:
${JSON.stringify(jobs)}

RULES

1. Create 6 to 10 practical steps.
2. Focus on what the student should do next.
3. Prioritize important missing skills.
4. Consider the student's existing skills.
5. Consider the student's existing projects.
6. Do not ask the student to relearn skills they already demonstrate.
7. Include learning where necessary.
8. Include project work where useful.
9. Include opportunity discovery.
10. Include applications.
11. Include application tracking.
12. Keep actions practical for a college student.
13. Do not promise employment.
14. Do not estimate hiring probability.
15. Do not rank companies.
16. Do not invent jobs.
17. Do not invent qualifications.
18. Every step MUST contain a valid path.
19. Use exactly these step types:

Profile
Learn
Build
Opportunities
Apply
Tracking

20. Use these paths:

Profile:
 /profile

Learn:
 /skill-gap

Build:
 /action-plan

Opportunities:
 /jobs

Apply:
 /jobs

Tracking:
 /applications

21. Keep step titles specific enough that the server can identify
similar tasks across future plan generations.

22. Return only valid JSON matching the provided schema.
`;

    try {
      console.log(
        `Generating action plan using Gemini ${GEMINI_MODEL}...`
      );

      const result =
        await generateWithInteractions(
          prompt
        );

      console.log(
        "Action plan generated successfully using Gemini."
      );

      return result;
    } catch (error) {
      if (
        error?.code ===
        "GEMINI_RATE_LIMIT"
      ) {
        console.warn(
          "Gemini rate limit reached. Using deterministic fallback."
        );
      } else {
        console.error(
          "Gemini action plan generation failed:",
          error
        );
      }

      return buildFallbackActionPlan({
        student,
        career,
        missingSkills,
        relatedJobs,
      });
    }
  };

module.exports = {
  generateActionPlanWithAI,
};