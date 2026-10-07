require("dotenv").config();

const {
  GoogleGenAI,
  Type,
} = require("@google/genai");

const apiKey =
  process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not configured."
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

const GEMINI_MODEL =
  "gemini-3.5-flash-lite";

const careerSchema = {
  type: Type.OBJECT,

  properties: {
    canonicalTitle: {
      type: Type.STRING,

      description:
        "The standard professional name of the career.",
    },

    aliases: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },

      description:
        "Common alternative names for this career.",
    },

    category: {
      type: Type.STRING,

      description:
        "Broad career category such as Software Development, Data, Design, Marketing, Finance, etc.",
    },

    description: {
      type: Type.STRING,

      description:
        "A concise explanation of what professionals in this career generally do.",
    },

    skills: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        properties: {
          name: {
            type: Type.STRING,

            description:
              "Name of the skill.",
          },

          importance: {
            type: Type.INTEGER,

            description:
              "Importance of the skill for this career from 0 to 100.",
          },
        },

        required: [
          "name",
          "importance",
        ],
      },
    },

    technologies: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },

      description:
        "Important tools, programming languages, frameworks, platforms, or software commonly used in this career.",
    },

    projectTypes: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },

      description:
        "Practical project types that would help a student demonstrate this career's skills.",
    },

    learningTopics: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING,
      },

      description:
        "Important topics a student should learn for this career.",
    },

    confidence: {
      type: Type.INTEGER,

      description:
        "Confidence that the input represents a valid, recognizable career from 0 to 100.",
    },
  },

  required: [
    "canonicalTitle",
    "aliases",
    "category",
    "description",
    "skills",
    "technologies",
    "projectTypes",
    "learningTopics",
    "confidence",
  ],
};

/*
 * Helpers
 */

const cleanString =
  (value) =>
    String(value ?? "").trim();

const cleanStringArray =
  (items) => {
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

/*
 * Validate Gemini career response.
 */
const validateCareerResult =
  (career) => {
    if (
      !career ||
      typeof career !==
        "object"
    ) {
      throw new Error(
        "AI returned an invalid career object."
      );
    }

    if (
      typeof career.canonicalTitle !==
        "string" ||
      !career.canonicalTitle.trim()
    ) {
      throw new Error(
        "AI career response is missing canonicalTitle."
      );
    }

    if (
      typeof career.category !==
        "string" ||
      !career.category.trim()
    ) {
      throw new Error(
        "AI career response is missing category."
      );
    }

    if (
      typeof career.description !==
        "string" ||
      !career.description.trim()
    ) {
      throw new Error(
        "AI career response is missing description."
      );
    }

    if (
      !Array.isArray(
        career.aliases
      )
    ) {
      throw new Error(
        "AI career response contains invalid aliases."
      );
    }

    if (
      !Array.isArray(
        career.skills
      )
    ) {
      throw new Error(
        "AI career response contains invalid skills."
      );
    }

    if (
      !Array.isArray(
        career.technologies
      )
    ) {
      throw new Error(
        "AI career response contains invalid technologies."
      );
    }

    if (
      !Array.isArray(
        career.projectTypes
      )
    ) {
      throw new Error(
        "AI career response contains invalid projectTypes."
      );
    }

    if (
      !Array.isArray(
        career.learningTopics
      )
    ) {
      throw new Error(
        "AI career response contains invalid learningTopics."
      );
    }

    const confidence =
      Number(
        career.confidence
      );

    if (
      !Number.isFinite(
        confidence
      ) ||
      confidence < 0 ||
      confidence > 100
    ) {
      throw new Error(
        "AI career response contains invalid confidence."
      );
    }

    const validSkills =
      career.skills.filter(
        (skill) =>
          skill &&
          typeof skill ===
            "object" &&
          typeof skill.name ===
            "string" &&
          skill.name.trim()
      );

    if (
      validSkills.length === 0
    ) {
      throw new Error(
        "AI career response contains no valid skills."
      );
    }

    for (
      const skill of validSkills
    ) {
      const importance =
        Number(
          skill.importance
        );

      if (
        !Number.isFinite(
          importance
        ) ||
        importance < 0 ||
        importance > 100
      ) {
        throw new Error(
          `Invalid importance score for skill: ${skill.name}`
        );
      }
    }

    return true;
  };

/*
 * Normalize validated career.
 */
const normalizeCareerResult =
  (career) => {
    return {
      canonicalTitle:
        career.canonicalTitle.trim(),

      aliases:
        cleanStringArray(
          career.aliases
        ),

      category:
        career.category.trim(),

      description:
        career.description.trim(),

      skills:
        career.skills
          .map((skill) => {
            if (
              !skill ||
              !skill.name
            ) {
              return null;
            }

            const importance =
              Number(
                skill.importance
              );

            return {
              name:
                String(
                  skill.name
                ).trim(),

              importance:
                Number.isFinite(
                  importance
                )
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        importance
                      )
                    )
                  : null,
            };
          })
          .filter(
            (skill) =>
              skill &&
              skill.name
          ),

      technologies:
        cleanStringArray(
          career.technologies
        ),

      projectTypes:
        cleanStringArray(
          career.projectTypes
        ),

      learningTopics:
        cleanStringArray(
          career.learningTopics
        ),

      confidence:
        Math.max(
          0,
          Math.min(
            100,
            Number(
              career.confidence
            )
          )
        ),
    };
  };

/*
 * Discover career with Gemini.
 */
const discoverCareerWithAI =
  async (careerInput) => {
    if (!careerInput) {
      throw new Error(
        "Career input is required."
      );
    }

    const normalizedInput =
      String(careerInput)
        .trim()
        .slice(0, 150);

    if (!normalizedInput) {
      throw new Error(
        "Career input is empty."
      );
    }

    const prompt = `
You are the career knowledge engine for StudentPath,
a platform that helps students understand career paths,
identify skill gaps, create learning plans, and discover
relevant internships and entry-level jobs.

The student entered this target career:

"${normalizedInput}"

Create a structured career profile for this career.

Rules:

1. Identify the most appropriate professional career title.
2. Do not invent a career if the input is nonsense.
3. Keep canonicalTitle concise and professionally recognizable.
4. Include common alternative names in aliases.
5. Give realistic skills relevant to this career.
6. Give each skill an importance score from 0 to 100.
7. Include technologies only when genuinely relevant.
8. Include practical project types that a student could build.
9. Include learning topics that help a student progress toward the career.
10. The information should be useful for students and entry-level candidates.
11. Do not promise employment or hiring outcomes.
12. Do not give salary estimates.
13. Do not rank universities, companies, or candidates.
14. Keep the description concise and factual.
15. Set confidence between 0 and 100.
16. If the input is a variation such as "ReactJS Developer",
normalize it to the appropriate professional career title.
`;

    try {
      const response =
        await ai.models.generateContent({
          model:
            GEMINI_MODEL,

          contents:
            prompt,

          config: {
            responseMimeType:
              "application/json",

            responseSchema:
              careerSchema,

            temperature:
              0.2,

            maxOutputTokens:
              2000,
          },
        });

      if (
        !response ||
        !response.text
      ) {
        throw new Error(
          "Gemini returned an empty response."
        );
      }

      let parsed;

      try {
        parsed =
          JSON.parse(
            response.text
          );
      } catch (
        parseError
      ) {
        console.error(
          "Gemini JSON parsing error:",
          parseError
        );

        throw new Error(
          "Gemini returned invalid JSON."
        );
      }

      validateCareerResult(
        parsed
      );

      const career =
        normalizeCareerResult(
          parsed
        );

      /*
       * Low-confidence careers should not
       * automatically become production
       * CareerProfile documents.
       */
      if (
        career.confidence < 60
      ) {
        throw new Error(
          "AI confidence is too low to create this career profile."
        );
      }

      return career;
    } catch (error) {
      console.error(
        "Career AI discovery error:",
        error
      );

      throw new Error(
        "Unable to discover career information at this time."
      );
    }
  };

module.exports = {
  discoverCareerWithAI,
};