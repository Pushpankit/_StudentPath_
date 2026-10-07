const Student = require("../models/Student");
const User = require("../models/User");

const {
  resolveOrDiscoverCareer,
} = require("../services/career/careerResolutionService");

/*
 * ==================================================
 * CONSTANTS
 * ==================================================
 */

const ALLOWED_OPPORTUNITY_TYPES = [
  "Internship",
  "Full-time",
  "Both",
];

const ALLOWED_WORK_MODES = [
  "On-site",
  "Hybrid",
  "Remote",
  "Any",
];

const MAX_SKILLS = 50;
const MAX_PROJECTS = 20;
const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set(["application/pdf"]);

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

const normalizeString = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
};

const normalizeSkill = (skill) => {
  return String(skill || "")
    .trim()
    .toLowerCase();
};

const isValidUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

/*
 * ==================================================
 * PROFILE COMPLETION
 * ==================================================
 *
 * Projects are optional.
 *
 * Required:
 * - Name
 * - College
 * - Degree
 * - Branch
 * - Graduation year
 * - City
 * - Target role
 * - Opportunity type
 * - Work mode
 * - Preferred location
 * - Career profile
 * - At least one skill
 */

const isProfileComplete = (
  student
) => {
  const requiredFields = [
    student.name,
    student.college,
    student.degree,
    student.branch,
    student.graduationYear,
    student.city,
    student.targetRole,
    student.opportunityType,
    student.workMode,
    student.preferredLocation,
    student.careerProfile,
  ];

  const basicFieldsComplete =
    requiredFields.every(
      (value) => {
        if (
          value === null ||
          value === undefined
        ) {
          return false;
        }

        if (
          typeof value ===
          "string"
        ) {
          return (
            value.trim().length > 0
          );
        }

        return true;
      }
    );

  if (!basicFieldsComplete) {
    return false;
  }

  return (
    Array.isArray(
      student.skills
    ) &&
    student.skills.length > 0
  );
};

const getProfileCompletionPercent = (student) => {
  const checks = [
    Boolean(normalizeString(student.name)),
    Boolean(normalizeString(student.college)),
    Boolean(normalizeString(student.degree)),
    Boolean(normalizeString(student.branch)),
    Boolean(student.graduationYear),
    Boolean(normalizeString(student.city)),
    Boolean(normalizeString(student.targetRole)),
    Boolean(normalizeString(student.opportunityType)),
    Boolean(normalizeString(student.workMode)),
    Boolean(normalizeString(student.preferredLocation)),
    Boolean(student.careerProfile),
    Array.isArray(student.skills) && student.skills.length > 0,
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round(
    (completed / checks.length) * 100
  );
};

/*
 * ==================================================
 * ONBOARDING STEP
 * ==================================================
 *
 * This is calculated on the backend.
 *
 * The frontend should not be trusted to decide
 * whether onboarding is complete.
 */

const getOnboardingStep = (
  student
) => {
  /*
   * Basic identity
   */

  if (!student.name) {
    return "basic";
  }

  /*
   * Education
   */

  if (
    !student.college ||
    !student.degree ||
    !student.branch ||
    !student.graduationYear
  ) {
    return "education";
  }

  /*
   * Career
   */

  if (
    !student.targetRole ||
    !student.careerProfile
  ) {
    return "career";
  }

  /*
   * Job preferences
   */

  if (
    !student.opportunityType ||
    !student.workMode ||
    !student.preferredLocation
  ) {
    return "preferences";
  }

  /*
   * Skills
   */

  if (
    !Array.isArray(
      student.skills
    ) ||
    student.skills.length === 0
  ) {
    return "skills";
  }

  /*
   * Projects are optional.
   *
   * A student can complete onboarding
   * without having a project.
   */

  return "completed";
};

/*
 * ==================================================
 * RESPONSE BUILDER
 * ==================================================
 */

const buildStudentResponse = (
  student
) => {
  return {
    id: student._id,

    user: student.user,

    name: student.name,

    college:
      student.college || "",

    degree:
      student.degree || "",

    branch:
      student.branch || "",

    graduationYear:
      student.graduationYear ||
      null,

    city:
      student.city || "",

    targetRole:
      student.targetRole || "",

    careerProfile:
      student.careerProfile ||
      null,

    careerPath:
      student.careerPath ||
      null,

    opportunityType:
      student.opportunityType ||
      "",

    workMode:
      student.workMode || "",

    preferredLocation:
      student.preferredLocation ||
      "",

    skills:
      Array.isArray(
        student.skills
      )
        ? student.skills
        : [],

    projects:
      Array.isArray(
        student.projects
      )
        ? student.projects
        : [],

    experience:
      Array.isArray(student.experience)
        ? student.experience
        : [],

    certifications:
      Array.isArray(student.certifications)
        ? student.certifications
        : [],

    resumeUrl:
      student.resumeUrl || "",

    resume: student.resume?.data
      ? {
          fileName: student.resume.fileName || "Resume.pdf",
          contentType: student.resume.contentType || "application/pdf",
          size: student.resume.size || student.resume.data.length,
          uploadedAt: student.resume.uploadedAt || null,
          url: "/api/student/resume",
        }
      : null,

    location:
      student.location || student.city || "",

    university:
      student.university || student.college || "",

    workPreference:
      student.workPreference || student.workMode || "",

    profileCompletion:
      getProfileCompletionPercent(student),

    profileCompleted:
      Boolean(
        student.profileCompleted
      ),

    profileCompletedAt:
      student.profileCompletedAt ||
      null,

    onboardingStep:
      student.onboardingStep ||
      "basic",

    createdAt:
      student.createdAt,

    updatedAt:
      student.updatedAt,
  };
};

/*
 * ==================================================
 * GET MY PROFILE
 * ==================================================
 *
 * GET /api/student/me
 *
 * This endpoint is available before onboarding
 * is complete.
 */

const getMyProfile = async (
  req,
  res
) => {
  try {
    const student =
      await Student.findOne({
        user: req.user.userId,
      })
        .populate(
          "user",
          "name email username role emailVerified"
        )
        .populate(
          "careerProfile"
        )
        .populate(
          "careerPath"
        );

    if (!student) {
      return res.status(404).json({
        success: false,
        code:
          "STUDENT_PROFILE_NOT_FOUND",
        message:
          "Student profile not found.",
      });
    }

    /*
     * Always calculate these values from
     * the actual database profile.
     */

    const profileCompleted =
      isProfileComplete(
        student
      );

    const onboardingStep =
      getOnboardingStep(
        student
      );

    /*
     * Repair inconsistent or old records.
     */

    if (
      student.profileCompleted !==
        profileCompleted ||
      student.onboardingStep !==
        onboardingStep
    ) {
      student.profileCompleted =
        profileCompleted;

      student.onboardingStep =
        onboardingStep;

      student.profileCompletedAt =
        profileCompleted
          ? student.profileCompletedAt ||
            new Date()
          : null;

      await student.save();
    }

    return res.status(200).json({
      success: true,

      code:
        "STUDENT_PROFILE_FETCHED",

      student:
        buildStudentResponse(
          student
        ),

      profileCompleted,

      onboardingStep,
    });
  } catch (error) {
    console.error(
      "Get student profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      code:
        "STUDENT_PROFILE_FETCH_FAILED",
      message:
        "Unable to fetch student profile.",
    });
  }
};

/*
 * ==================================================
 * GET MY CAREER CONTEXT
 * ==================================================
 *
 * GET /api/student/career-context
 *
 * Requires completed onboarding through
 * requireCompletedProfile middleware.
 */

const getMyCareerContext =
  async (
    req,
    res
  ) => {
    try {
      const student =
        await Student.findOne({
          user:
            req.user.userId,
        })
          .populate(
            "careerProfile"
          )
          .populate(
            "user",
            "name email username role"
          );

      if (!student) {
        return res.status(404).json({
          success: false,
          code:
            "STUDENT_PROFILE_NOT_FOUND",
          message:
            "Student profile not found.",
        });
      }

      /*
       * Keep this defensive check even though
       * the route middleware already checks it.
       */

      if (
        !student.profileCompleted
      ) {
        return res.status(409).json({
          success: false,
          code:
            "ONBOARDING_REQUIRED",
          message:
            "Complete your student profile before accessing career information.",
          nextStep:
            "onboarding",
          onboardingStep:
            student.onboardingStep ||
            "basic",
        });
      }

      if (
        !student.careerProfile
      ) {
        return res.status(409).json({
          success: false,
          code:
            "CAREER_PROFILE_REQUIRED",
          message:
            "A career profile has not been created yet.",
        });
      }

      const career =
        student.careerProfile;

      const currentSkills =
        Array.isArray(
          student.skills
        )
          ? student.skills
          : [];

      const requiredSkills =
        Array.isArray(
          career.skills
        )
          ? career.skills
          : [];

      const currentSkillNames =
        currentSkills
          .map(normalizeSkill)
          .filter(Boolean);

      const skillGap =
        requiredSkills.filter(
          (skill) => {
            const requiredSkill =
              normalizeSkill(
                skill.name
              );

            return (
              requiredSkill &&
              !currentSkillNames.includes(
                requiredSkill
              )
            );
          }
        );

      const matchedSkills =
        requiredSkills.filter(
          (skill) => {
            const requiredSkill =
              normalizeSkill(
                skill.name
              );

            return (
              requiredSkill &&
              currentSkillNames.includes(
                requiredSkill
              )
            );
          }
        );

      return res.status(200).json({
        success: true,

        code:
          "CAREER_CONTEXT_FETCHED",

        career: {
          id: career._id,

          title:
            career.canonicalTitle,

          category:
            career.category,

          description:
            career.description,

          aliases:
            career.aliases || [],

          skills:
            requiredSkills,

          technologies:
            career.technologies ||
            [],

          projectTypes:
            career.projectTypes ||
            [],

          learningTopics:
            career.learningTopics ||
            [],
        },

        student: {
          id: student._id,

          name:
            student.name,

          targetRole:
            student.targetRole,

          skills:
            currentSkills,

          projects:
            student.projects || [],
        },

        skillAnalysis: {
          matchedSkills,

          missingSkills:
            skillGap,

          matchedCount:
            matchedSkills.length,

          missingCount:
            skillGap.length,

          totalRequiredSkills:
            requiredSkills.length,
        },
      });
    } catch (error) {
      console.error(
        "Get career context error:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "CAREER_CONTEXT_FETCH_FAILED",
        message:
          "Unable to fetch career context.",
      });
    }
  };

/*
 * ==================================================
 * UPDATE MY PROFILE
 * ==================================================
 *
 * PUT /api/student/me
 *
 * This endpoint is also used during onboarding.
 */

const updateMyProfile =
  async (
    req,
    res
  ) => {
    try {
      const body =
        req.body || {};

      const allowedFields = [
        "name",
        "college",
        "degree",
        "branch",
        "graduationYear",
        "city",
        "targetRole",
        "opportunityType",
        "workMode",
        "preferredLocation",
        "skills",
        "projects",
        "experience",
        "certifications",
        "resumeUrl",
        "location",
        "university",
        "workPreference",
      ];

      const updates = {};

      /*
       * Only allow known profile fields.
       */

      allowedFields.forEach(
        (field) => {
          if (
            body[field] !==
            undefined
          ) {
            updates[field] =
              body[field];
          }
        }
      );

      if (
        Object.keys(updates)
          .length === 0
      ) {
        return res.status(400).json({
          success: false,
          code:
            "NO_PROFILE_CHANGES",
          message:
            "No profile information was provided.",
        });
      }

      /*
       * ----------------------------------------------
       * NAME
       * ----------------------------------------------
       */

      if (
        body.name !==
        undefined
      ) {
        const name =
          normalizeString(
            body.name
          );

        if (
          name.length < 2 ||
          name.length > 100
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_NAME",
            message:
              "Name must be between 2 and 100 characters.",
          });
        }

        updates.name =
          name;
      }

      /*
       * ----------------------------------------------
       * STRING FIELDS
       * ----------------------------------------------
       */

      const stringFields = [
        "college",
        "degree",
        "branch",
        "city",
        "targetRole",
        "workMode",
        "preferredLocation",
        "location",
        "university",
        "workPreference",
      ];

      for (
        const field of
          stringFields
      ) {
        if (
          body[field] !==
          undefined
        ) {
          updates[field] =
            normalizeString(
              body[field]
            );
        }
      }

      /*
       * ----------------------------------------------
       * PROFILE EDITOR COMPATIBILITY
       * ----------------------------------------------
       */
      if (body.location !== undefined) {
        updates.city = normalizeString(body.location);
      }

      if (body.university !== undefined) {
        updates.college = normalizeString(body.university);
      }

      if (body.workPreference !== undefined) {
        const preference = normalizeString(
          body.workPreference
        );

        const preferenceMap = {
          "Remote or Hybrid": "Hybrid",
          "Open to all": "Any",
        };

        updates.workMode =
          preferenceMap[preference] || preference;
        updates.workPreference = preference;
      }

      /*
       * ----------------------------------------------
       * WORK MODE
       * ----------------------------------------------
       */

      if (
        body.workMode !==
        undefined
      ) {
        if (
          !ALLOWED_WORK_MODES.includes(
            body.workMode
          )
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_WORK_MODE",
            message:
              "Invalid work mode.",
          });
        }

        updates.workMode =
          body.workMode;
      }

      /*
       * ----------------------------------------------
       * GRADUATION YEAR
       * ----------------------------------------------
       */

      if (
        body.graduationYear !==
        undefined
      ) {
        const year =
          Number(
            body.graduationYear
          );

        if (
          !Number.isInteger(
            year
          ) ||
          year < 1950 ||
          year > 2100
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_GRADUATION_YEAR",
            message:
              "Please provide a valid graduation year.",
          });
        }

        updates.graduationYear =
          year;
      }

      /*
       * ----------------------------------------------
       * OPPORTUNITY TYPE
       * ----------------------------------------------
       */

      if (
        body.opportunityType !==
        undefined
      ) {
        if (
          !ALLOWED_OPPORTUNITY_TYPES.includes(
            body.opportunityType
          )
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_OPPORTUNITY_TYPE",
            message:
              "Invalid opportunity type.",
          });
        }

        updates.opportunityType =
          body.opportunityType;
      }

      /*
       * ----------------------------------------------
       * SKILLS
       * ----------------------------------------------
       */

      if (
        body.skills !==
        undefined
      ) {
        if (
          !Array.isArray(
            body.skills
          )
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_SKILLS",
            message:
              "Skills must be an array.",
          });
        }

        if (
          body.skills.length >
          MAX_SKILLS
        ) {
          return res.status(400).json({
            success: false,
            code:
              "TOO_MANY_SKILLS",
            message:
              `You can add up to ${MAX_SKILLS} skills.`,
          });
        }

        const skills =
          body.skills
            .map((skill) => {
              if (typeof skill === "string") {
                return normalizeString(skill);
              }

              if (
                skill &&
                typeof skill === "object" &&
                !Array.isArray(skill)
              ) {
                return normalizeString(
                  skill.name ||
                    skill.skill ||
                    skill.title
                );
              }

              return "";
            })
            .filter(Boolean);

        updates.skills = [
          ...new Set(skills),
        ];
      }

      /*
       * ----------------------------------------------
       * PROJECTS
       * ----------------------------------------------
       */

      if (
        body.projects !==
        undefined
      ) {
        if (
          !Array.isArray(
            body.projects
          )
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_PROJECTS",
            message:
              "Projects must be an array.",
          });
        }

        if (
          body.projects.length >
          MAX_PROJECTS
        ) {
          return res.status(400).json({
            success: false,
            code:
              "TOO_MANY_PROJECTS",
            message:
              `You can add up to ${MAX_PROJECTS} projects.`,
          });
        }

        const projects = [];

        for (
          const project of
            body.projects
        ) {
          if (
            !project ||
            typeof project !==
              "object" ||
            Array.isArray(project)
          ) {
            return res.status(400).json({
              success: false,
              code:
                "INVALID_PROJECT",
              message:
                "Each project must be a valid object.",
            });
          }

          const title =
            normalizeString(
              project.title
            );

          const description =
            normalizeString(
              project.description
            );

          const url =
            normalizeString(
              project.url
            );

          if (!title) {
            return res.status(400).json({
              success: false,
              code:
                "INVALID_PROJECT",
              message:
                "Every project must have a title.",
            });
          }

          if (
            title.length > 150
          ) {
            return res.status(400).json({
              success: false,
              code:
                "INVALID_PROJECT",
              message:
                "Project title must not exceed 150 characters.",
            });
          }

          if (
            description.length >
            2000
          ) {
            return res.status(400).json({
              success: false,
              code:
                "INVALID_PROJECT",
              message:
                "Project description must not exceed 2000 characters.",
            });
          }

          if (
            !isValidUrl(url)
          ) {
            return res.status(400).json({
              success: false,
              code:
                "INVALID_PROJECT_URL",
              message:
                `Invalid project URL for "${title}".`,
            });
          }

          const rawTechnologies =
            Array.isArray(project.technologies)
              ? project.technologies
              : typeof project.technologies === "string"
                ? project.technologies.split(",")
                : [];

          const technologies = [
            ...new Set(
              rawTechnologies
                .map((item) => normalizeString(item))
                .filter(Boolean)
            ),
          ];

          const date = normalizeString(project.date);

          if (date.length > 100) {
            return res.status(400).json({
              success: false,
              code: "INVALID_PROJECT_DATE",
              message: "Project date must not exceed 100 characters.",
            });
          }

          projects.push({
            title,
            description,
            technologies,
            url,
            date,
          });
        }

        updates.projects =
          projects;
      }

      /*
       * ----------------------------------------------
       * EXPERIENCE
       * ----------------------------------------------
       */
      if (body.experience !== undefined) {
        if (!Array.isArray(body.experience)) {
          return res.status(400).json({
            success: false,
            code: "INVALID_EXPERIENCE",
            message: "Experience must be an array.",
          });
        }

        if (body.experience.length > 20) {
          return res.status(400).json({
            success: false,
            code: "TOO_MANY_EXPERIENCE_ITEMS",
            message: "You can add up to 20 experience entries.",
          });
        }

        updates.experience = body.experience.map((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("INVALID_EXPERIENCE_ITEM");
          }

          const title = normalizeString(item.title);
          const company = normalizeString(item.company);
          const description = normalizeString(item.description);
          const period = normalizeString(item.period);

          if (title.length > 150) throw new Error("INVALID_EXPERIENCE_TITLE");
          if (company.length > 200) throw new Error("INVALID_EXPERIENCE_COMPANY");
          if (description.length > 2000) throw new Error("INVALID_EXPERIENCE_DESCRIPTION");
          if (period.length > 100) throw new Error("INVALID_EXPERIENCE_PERIOD");

          return { title, company, description, period };
        });
      }

      /*
       * ----------------------------------------------
       * CERTIFICATIONS
       * ----------------------------------------------
       */
      if (body.certifications !== undefined) {
        if (!Array.isArray(body.certifications)) {
          return res.status(400).json({
            success: false,
            code: "INVALID_CERTIFICATIONS",
            message: "Certifications must be an array.",
          });
        }

        if (body.certifications.length > 30) {
          return res.status(400).json({
            success: false,
            code: "TOO_MANY_CERTIFICATIONS",
            message: "You can add up to 30 certifications.",
          });
        }

        updates.certifications = body.certifications.map((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("INVALID_CERTIFICATION_ITEM");
          }

          const name = normalizeString(item.name);
          const issuer = normalizeString(item.issuer);
          const date = normalizeString(item.date);

          if (name.length > 200) throw new Error("INVALID_CERTIFICATION_NAME");
          if (issuer.length > 200) throw new Error("INVALID_CERTIFICATION_ISSUER");
          if (date.length > 100) throw new Error("INVALID_CERTIFICATION_DATE");

          return { name, issuer, date };
        });
      }

      /*
       * ----------------------------------------------
       * RESUME URL
       * ----------------------------------------------
       */
      if (body.resumeUrl !== undefined) {
        const resumeUrl = normalizeString(body.resumeUrl);

        if (!isValidUrl(resumeUrl) || resumeUrl.length > 1000) {
          return res.status(400).json({
            success: false,
            code: "INVALID_RESUME_URL",
            message: "Please provide a valid resume URL.",
          });
        }

        updates.resumeUrl = resumeUrl;
      }

      /*
       * ----------------------------------------------
       * FIND STUDENT
       * ----------------------------------------------
       */

      const student =
        await Student.findOne({
          user:
            req.user.userId,
        });

      if (!student) {
        return res.status(404).json({
          success: false,
          code:
            "STUDENT_PROFILE_NOT_FOUND",
          message:
            "Student profile not found.",
        });
      }

      /*
       * ----------------------------------------------
       * CAREER RESOLUTION
       * ----------------------------------------------
       *
       * Whenever targetRole changes, resolve it
       * against the CareerProfile system.
       */

      if (
        body.targetRole !==
        undefined
      ) {
        const targetRole =
          normalizeString(
            body.targetRole
          );

        if (!targetRole) {
          return res.status(400).json({
            success: false,
            code:
              "TARGET_ROLE_REQUIRED",
            message:
              "Target career cannot be empty.",
          });
        }

        const careerResult =
          await resolveOrDiscoverCareer(
            targetRole
          );

        if (
          careerResult.status ===
          "invalid"
        ) {
          return res.status(400).json({
            success: false,
            code:
              "INVALID_TARGET_CAREER",
            message:
              "The selected career is not valid.",
          });
        }

        if (
          careerResult.status !==
          "resolved"
        ) {
          return res.status(422).json({
            success: false,
            code:
              "CAREER_RESOLUTION_FAILED",
            message:
              "Unable to determine the target career.",
          });
        }

        updates.targetRole =
          targetRole;

        updates.careerProfile =
          careerResult.career.id;
      }

      /*
       * ----------------------------------------------
       * APPLY UPDATES
       * ----------------------------------------------
       */

      Object.assign(
        student,
        updates
      );

      /*
       * ----------------------------------------------
       * PROFILE COMPLETION
       * ----------------------------------------------
       */

      const profileCompleted =
        isProfileComplete(
          student
        );

      const onboardingStep =
        getOnboardingStep(
          student
        );

      student.profileCompleted =
        profileCompleted;

      student.onboardingStep =
        onboardingStep;

      if (
        profileCompleted
      ) {
        student.profileCompletedAt =
          student.profileCompletedAt ||
          new Date();
      } else {
        student.profileCompletedAt =
          null;
      }

      await student.save();

      /*
       * ----------------------------------------------
       * SYNCHRONIZE USER NAME
       * ----------------------------------------------
       */

      if (
        updates.name !==
        undefined
      ) {
        await User.findByIdAndUpdate(
          req.user.userId,
          {
            $set: {
              name:
                updates.name,
            },
          },
          {
            runValidators:
              true,
          }
        );
      }

      /*
       * ----------------------------------------------
       * RETURN UPDATED PROFILE
       * ----------------------------------------------
       */

      const populatedStudent =
        await Student.findById(
          student._id
        )
          .populate(
            "user",
            "name email username role emailVerified"
          )
          .populate(
            "careerProfile"
          )
          .populate(
            "careerPath"
          );

      return res.status(200).json({
        success: true,

        code: profileCompleted
          ? "PROFILE_COMPLETED"
          : "PROFILE_UPDATED",

        message:
          profileCompleted
            ? "Student profile completed successfully."
            : "Student profile updated successfully.",

        student:
          buildStudentResponse(
            populatedStudent
          ),

        profileCompleted,

        onboardingStep,
      });
    } catch (error) {
      console.error(
        "Update student profile error:",
        error
      );

      const profileEditorErrors = {
        INVALID_EXPERIENCE_ITEM:
          "Each experience entry must be a valid object.",
        INVALID_EXPERIENCE_TITLE:
          "Experience title is too long.",
        INVALID_EXPERIENCE_COMPANY:
          "Experience company name is too long.",
        INVALID_EXPERIENCE_DESCRIPTION:
          "Experience description is too long.",
        INVALID_EXPERIENCE_PERIOD:
          "Experience period is too long.",
        INVALID_CERTIFICATION_ITEM:
          "Each certification must be a valid object.",
        INVALID_CERTIFICATION_NAME:
          "Certification name is too long.",
        INVALID_CERTIFICATION_ISSUER:
          "Certification issuer is too long.",
        INVALID_CERTIFICATION_DATE:
          "Certification date is too long.",
      };

      if (profileEditorErrors[error.message]) {
        return res.status(400).json({
          success: false,
          code: error.message,
          message: profileEditorErrors[error.message],
        });
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          code:
            "PROFILE_VALIDATION_FAILED",
          message:
            "Some profile information is invalid.",
        });
      }

      return res.status(500).json({
        success: false,
        code:
          "PROFILE_UPDATE_FAILED",
        message:
          "Unable to update student profile.",
      });
    }
  };

const uploadResume = async (req, res) => {
  try {
    const { fileName, contentType, data } = req.body || {};

    if (!fileName || !data) {
      return res.status(400).json({ success: false, code: "RESUME_REQUIRED", message: "Please select a resume to upload." });
    }

    if (String(contentType || "").toLowerCase() !== "application/pdf") {
      return res.status(400).json({ success: false, code: "INVALID_RESUME_TYPE", message: "Only PDF resumes are supported." });
    }

    const safeFileName = normalizeString(fileName).replace(/[\\/:*?"<>|]+/g, "_");
    if (!safeFileName || safeFileName.length > 255) {
      return res.status(400).json({ success: false, code: "INVALID_RESUME_NAME", message: "The resume file name is invalid." });
    }

    const base64 = String(data).replace(/^data:application\/pdf;base64,/i, "").trim();
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      return res.status(400).json({ success: false, code: "INVALID_RESUME_DATA", message: "The uploaded resume data is invalid." });
    }

    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length || buffer.length > MAX_RESUME_SIZE) {
      return res.status(400).json({ success: false, code: "RESUME_TOO_LARGE", message: "Resume must be a PDF no larger than 5 MB." });
    }

    if (buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
      return res.status(400).json({ success: false, code: "INVALID_PDF", message: "The selected file is not a valid PDF." });
    }

    const student = await Student.findOne({ user: req.user.userId });
    if (!student) {
      return res.status(404).json({ success: false, code: "STUDENT_PROFILE_NOT_FOUND", message: "Student profile not found." });
    }

    student.resume = {
      data: buffer,
      fileName: safeFileName,
      contentType: "application/pdf",
      size: buffer.length,
      uploadedAt: new Date(),
    };

    await student.save();

    return res.status(200).json({
      success: true,
      code: "RESUME_UPLOADED",
      message: "Resume uploaded successfully.",
      resume: {
        fileName: student.resume.fileName,
        contentType: student.resume.contentType,
        size: student.resume.size,
        uploadedAt: student.resume.uploadedAt,
        url: "/api/student/resume",
      },
    });
  } catch (error) {
    console.error("Upload resume error:", error);
    return res.status(500).json({ success: false, code: "RESUME_UPLOAD_FAILED", message: "Unable to upload your resume." });
  }
};

const getMyResume = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.userId });
    if (!student || !student.resume?.data) {
      return res.status(404).json({ success: false, code: "RESUME_NOT_FOUND", message: "No resume has been uploaded yet." });
    }

    const fileName = String(student.resume.fileName || "Resume.pdf").replace(/"/g, "");
    res.setHeader("Content-Type", student.resume.contentType || "application/pdf");
    res.setHeader("Content-Length", student.resume.data.length);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).send(student.resume.data);
  } catch (error) {
    console.error("Get resume error:", error);
    return res.status(500).json({ success: false, code: "RESUME_FETCH_FAILED", message: "Unable to load your resume." });
  }
};

const deleteMyResume = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.userId });
    if (!student) {
      return res.status(404).json({ success: false, code: "STUDENT_PROFILE_NOT_FOUND", message: "Student profile not found." });
    }
    if (!student.resume?.data) {
      return res.status(404).json({ success: false, code: "RESUME_NOT_FOUND", message: "No resume has been uploaded yet." });
    }

    student.resume = undefined;
    await student.save();
    return res.status(200).json({ success: true, code: "RESUME_DELETED", message: "Resume deleted successfully.", resume: null });
  } catch (error) {
    console.error("Delete resume error:", error);
    return res.status(500).json({ success: false, code: "RESUME_DELETE_FAILED", message: "Unable to delete your resume." });
  }
};

/*
 * ==================================================
 * EXPORTS
 * ==================================================
 */

module.exports = {
  getMyProfile,
  getMyCareerContext,
  updateMyProfile,
  uploadResume,
  getMyResume,
  deleteMyResume,
};