import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Onboarding.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL
).replace(/\/+$/, "");

const initialForm = {
  college: "",
  degree: "",
  branch: "",
  graduationYear: "",
  city: "",
  targetRole: "",
  opportunityType: "Both",
  workMode: "Any",
  preferredLocation: "",
  skills: "",
  projects: "",
};

function Onboarding() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] =
    useState(true);

  const [error, setError] = useState("");

  /*
   * ----------------------------------------------
   * Load existing profile
   * ----------------------------------------------
   */

  useEffect(() => {
    const loadProfile = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/student/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (response.status === 401) {
          localStorage.removeItem("token");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load your profile."
          );
        }

        const student =
          data.student || {};

        /*
         * If the profile is already completed,
         * there is no reason to show onboarding again.
         */
        if (
          data.profileCompleted === true
        ) {
          navigate("/dashboard", {
            replace: true,
          });

          return;
        }

        /*
         * Convert existing structured projects
         * back into one project per line for the
         * simple onboarding UI.
         */
        const existingProjects =
          Array.isArray(student.projects)
            ? student.projects
                .map(
                  (project) =>
                    project?.title || ""
                )
                .filter(Boolean)
                .join("\n")
            : "";

        setForm({
          college:
            student.college || "",

          degree:
            student.degree || "",

          branch:
            student.branch || "",

          graduationYear:
            student.graduationYear
              ? String(
                  student.graduationYear
                )
              : "",

          city:
            student.city || "",

          targetRole:
            student.targetRole || "",

          opportunityType:
            student.opportunityType ||
            "Both",

          workMode:
            student.workMode || "Any",

          preferredLocation:
            student.preferredLocation ||
            "",

          skills: Array.isArray(
            student.skills
          )
            ? student.skills.join(", ")
            : "",

          projects:
            existingProjects,
        });
      } catch (err) {
        console.error(
          "Load onboarding profile error:",
          err
        );

        setError(
          err.message ||
            "Unable to load your profile."
        );
      } finally {
        setPageLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  /*
   * ----------------------------------------------
   * Change handler
   * ----------------------------------------------
   */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  /*
   * ----------------------------------------------
   * Validation
   * ----------------------------------------------
   */

  const validateForm = () => {
    if (!form.college.trim()) {
      return "Please enter your college or university.";
    }

    if (!form.degree.trim()) {
      return "Please enter your degree.";
    }

    if (!form.branch.trim()) {
      return "Please enter your branch or specialization.";
    }

    const graduationYear = Number(
      form.graduationYear
    );

    if (
      !Number.isInteger(
        graduationYear
      ) ||
      graduationYear < 1950 ||
      graduationYear > 2100
    ) {
      return "Please enter a valid graduation year.";
    }

    if (!form.city.trim()) {
      return "Please enter your current city.";
    }

    if (!form.targetRole.trim()) {
      return "Please enter your target career.";
    }

    if (!form.preferredLocation.trim()) {
      return "Please enter your preferred job location.";
    }

    if (!form.skills.trim()) {
      return "Please add at least one skill.";
    }

    if (
      ![
        "Internship",
        "Full-time",
        "Both",
      ].includes(
        form.opportunityType
      )
    ) {
      return "Please select a valid opportunity type.";
    }

    if (
      ![
        "On-site",
        "Hybrid",
        "Remote",
        "Any",
      ].includes(form.workMode)
    ) {
      return "Please select a valid work mode.";
    }

    return null;
  };

  /*
   * ----------------------------------------------
   * Submit
   * ----------------------------------------------
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setLoading(true);

      const skills = [
        ...new Set(
          form.skills
            .split(",")
            .map((skill) =>
              skill.trim()
            )
            .filter(Boolean)
        ),
      ];

      /*
       * The onboarding UI keeps projects simple:
       * one project per line.
       *
       * The backend stores them as structured
       * project objects.
       */
      const projects = form.projects
        .split("\n")
        .map((project) =>
          project.trim()
        )
        .filter(Boolean)
        .map((title) => ({
          title,
          description: "",
          technologies: [],
          url: "",
        }));

      const response = await fetch(
        `${API_URL}/student/me`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            college:
              form.college.trim(),

            degree:
              form.degree.trim(),

            branch:
              form.branch.trim(),

            graduationYear:
              Number(
                form.graduationYear
              ),

            city:
              form.city.trim(),

            targetRole:
              form.targetRole.trim(),

            opportunityType:
              form.opportunityType,

            workMode:
              form.workMode,

            preferredLocation:
              form.preferredLocation.trim(),

            skills,

            projects,
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save your profile."
        );
      }

      if (
        data.profileCompleted !== true
      ) {
        throw new Error(
          "Your profile is still incomplete. Please check the required information."
        );
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Onboarding error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  /*
   * ----------------------------------------------
   * Loading state
   * ----------------------------------------------
   */

  if (pageLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            Loading your profile...
          </div>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------
   * UI
   * ----------------------------------------------
   */

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span
              className={styles.logoMark}
            >
              S
            </span>

            <span>
              StudentPath
            </span>
          </div>

          <div className={styles.progress}>
            <div
              className={
                styles.progressTrack
              }
            >
              <div
                className={
                  styles.progressFill
                }
              />
            </div>

            <span>
              Profile setup
            </span>
          </div>

          <h1>
            Build your student profile
          </h1>

          <p>
            Tell us where you are now and
            what kind of opportunity you
            are looking for. We will use
            this information to match you
            with relevant careers and jobs.
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          {/* -------------------------------- */}
          {/* Education */}
          {/* -------------------------------- */}

          <section
            className={styles.section}
          >
            <div
              className={
                styles.sectionHeader
              }
            >
              <h2>
                Education
              </h2>

              <p>
                Tell us about your current
                education.
              </p>
            </div>

            <div className={styles.grid}>
              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="college">
                  College / University{" "}
                  <span>*</span>
                </label>

                <input
                  id="college"
                  name="college"
                  type="text"
                  placeholder="e.g. RIMT University"
                  value={form.college}
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />
              </div>

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="degree">
                  Degree{" "}
                  <span>*</span>
                </label>

                <input
                  id="degree"
                  name="degree"
                  type="text"
                  placeholder="e.g. B.Tech"
                  value={form.degree}
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />
              </div>

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="branch">
                  Branch / Specialization{" "}
                  <span>*</span>
                </label>

                <input
                  id="branch"
                  name="branch"
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={form.branch}
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />
              </div>

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="graduationYear">
                  Graduation year{" "}
                  <span>*</span>
                </label>

                <input
                  id="graduationYear"
                  name="graduationYear"
                  type="number"
                  min="1950"
                  max="2100"
                  placeholder="e.g. 2027"
                  value={
                    form.graduationYear
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {/* -------------------------------- */}
          {/* Location */}
          {/* -------------------------------- */}

          <section
            className={styles.section}
          >
            <div
              className={
                styles.sectionHeader
              }
            >
              <h2>
                Location and preferences
              </h2>

              <p>
                This helps us filter
                opportunities that make
                sense for you.
              </p>
            </div>

            <div className={styles.grid}>
              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="city">
                  Current city{" "}
                  <span>*</span>
                </label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="e.g. Noida"
                  value={form.city}
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />
              </div>

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="preferredLocation">
                  Preferred job location{" "}
                  <span>*</span>
                </label>

                <input
                  id="preferredLocation"
                  name="preferredLocation"
                  type="text"
                  placeholder="e.g. Noida, Delhi NCR"
                  value={
                    form.preferredLocation
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />
              </div>

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="opportunityType">
                  Looking for{" "}
                  <span>*</span>
                </label>

                <select
                  id="opportunityType"
                  name="opportunityType"
                  value={
                    form.opportunityType
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                >
                  <option value="Both">
                    Internship or Full-time
                  </option>

                  <option value="Internship">
                    Internship
                  </option>

                  <option value="Full-time">
                    Full-time
                  </option>
                </select>
              </div>

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="workMode">
                  Preferred work mode{" "}
                  <span>*</span>
                </label>

                <select
                  id="workMode"
                  name="workMode"
                  value={
                    form.workMode
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                >
                  <option value="Any">
                    Any
                  </option>

                  <option value="On-site">
                    On-site
                  </option>

                  <option value="Hybrid">
                    Hybrid
                  </option>

                  <option value="Remote">
                    Remote
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* -------------------------------- */}
          {/* Career */}
          {/* -------------------------------- */}

          <section
            className={styles.section}
          >
            <div
              className={
                styles.sectionHeader
              }
            >
              <h2>
                Career goal
              </h2>

              <p>
                This is used to determine
                your career profile and
                identify relevant
                opportunities.
              </p>
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="targetRole">
                Target career{" "}
                <span>*</span>
              </label>

              <input
                id="targetRole"
                name="targetRole"
                type="text"
                placeholder="e.g. Frontend Developer"
                value={
                  form.targetRole
                }
                onChange={
                  handleChange
                }
                disabled={loading}
              />

              <small>
                You can use your own wording,
                such as "React Developer",
                "Web Developer", or "AI
                Engineer".
              </small>
            </div>
          </section>

          {/* -------------------------------- */}
          {/* Skills */}
          {/* -------------------------------- */}

          <section
            className={styles.section}
          >
            <div
              className={
                styles.sectionHeader
              }
            >
              <h2>
                Skills
              </h2>

              <p>
                Add the technologies and
                skills you currently know.
              </p>
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="skills">
                Your skills{" "}
                <span>*</span>
              </label>

              <input
                id="skills"
                name="skills"
                type="text"
                placeholder="e.g. React, JavaScript, HTML, CSS, MongoDB"
                value={form.skills}
                onChange={
                  handleChange
                }
                disabled={loading}
              />

              <small>
                Separate each skill with a
                comma.
              </small>
            </div>
          </section>

          {/* -------------------------------- */}
          {/* Projects */}
          {/* -------------------------------- */}

          <section
            className={styles.section}
          >
            <div
              className={
                styles.sectionHeader
              }
            >
              <h2>
                Projects
              </h2>

              <p>
                Projects are optional, but
                they help us understand what
                you can actually build.
              </p>
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="projects">
                Your projects
              </label>

              <textarea
                id="projects"
                name="projects"
                placeholder={
                  "Add one project per line.\nExample: E-commerce website using React and Node.js\nExample: Student career platform using MERN"
                }
                value={form.projects}
                onChange={
                  handleChange
                }
                rows={5}
                disabled={loading}
              />

              <small>
                You can add academic,
                personal, or internship
                projects.
              </small>
            </div>
          </section>

          {/* -------------------------------- */}
          {/* Error */}
          {/* -------------------------------- */}

          {error && (
            <div
              className={styles.error}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* -------------------------------- */}
          {/* Actions */}
          {/* -------------------------------- */}

          <div
            className={styles.actions}
          >
            <button
              type="submit"
              className={
                styles.continueButton
              }
              disabled={loading}
            >
              {loading
                ? "Saving profile..."
                : "Complete profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;