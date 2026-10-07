import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  MapPin,
  Plus,
  X,
} from "lucide-react";

import CompanySidebar from "../components/CompanySidebar";
import styles from "./CreateJob.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const JOB_TYPES = [
  "Internship",
  "Full-time",
  "Part-time",
  "Contract",
];

const EXPERIENCE_LEVELS = [
  {
    value: "Fresher",
    label: "No experience required",
  },
  {
    value: "0-1 years",
    label: "0–1 years",
  },
  {
    value: "1-2 years",
    label: "1–2 years",
  },
  {
    value: "2-3 years",
    label: "2–3 years",
  },
  {
    value: "3+ years",
    label: "3+ years",
  },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  location: "",
  jobType: "",
  experienceLevel: "",
  salaryMin: "",
  salaryMax: "",
  skills: "",
  careerPaths: [],
};

function CreateJobs() {
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [careers, setCareers] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  /*
   * ==================================================
   * AUTH + INITIAL DATA
   * ==================================================
   */

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [companyResponse, careersResponse] =
        await Promise.all([
          fetch(`${API_URL}/company/me`, {
            headers,
          }),

          fetch(`${API_URL}/careers`, {
            headers,
          }),
        ]);

      if (
        companyResponse.status === 401 ||
        companyResponse.status === 403
      ) {
        localStorage.removeItem("token");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      const companyData =
        await companyResponse.json();

      if (!companyResponse.ok) {
        throw new Error(
          companyData.message ||
            "Unable to load company profile."
        );
      }

      setCompany(companyData.company);

      /*
       * Careers are useful for matching the job
       * with StudentPath career paths.
       *
       * If the career endpoint fails, the company
       * page can still load. The user simply won't
       * have career paths to select.
       */
      if (careersResponse.ok) {
        const careersData =
          await careersResponse.json();

        setCareers(
          Array.isArray(careersData.careers)
            ? careersData.careers
            : []
        );
      }
    } catch (err) {
      console.error(
        "Create job initial data error:",
        err
      );

      setError(
        err.message ||
          "Unable to load the job creation page."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==================================================
   * FORM CHANGE
   * ==================================================
   */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  /*
   * ==================================================
   * CAREER SELECTION
   * ==================================================
   */

  const handleCareerToggle = (careerId) => {
    setForm((previous) => {
      const selected =
        previous.careerPaths.includes(careerId);

      return {
        ...previous,

        careerPaths: selected
          ? previous.careerPaths.filter(
              (id) => id !== careerId
            )
          : [
              ...previous.careerPaths,
              careerId,
            ],
      };
    });

    if (error) {
      setError("");
    }
  };

  /*
   * ==================================================
   * SUBMIT JOB
   * ==================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSuccess("");

    /*
     * ----------------------------------------------
     * CLEAN FORM VALUES
     * ----------------------------------------------
     */

    const title = form.title.trim();

    const description =
      form.description.trim();

    const location =
      form.location.trim();

    const skills = form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    /*
     * ----------------------------------------------
     * FRONTEND VALIDATION
     * ----------------------------------------------
     */

    if (!title) {
      setError("Please enter a job title.");
      return;
    }

    if (title.length < 2) {
      setError(
        "Job title must be at least 2 characters."
      );
      return;
    }

    if (title.length > 200) {
      setError(
        "Job title cannot exceed 200 characters."
      );
      return;
    }

    if (!description) {
      setError(
        "Please provide a job description."
      );
      return;
    }

    if (description.length < 20) {
      setError(
        "Job description must be at least 20 characters."
      );
      return;
    }

    if (description.length > 10000) {
      setError(
        "Job description cannot exceed 10000 characters."
      );
      return;
    }

    if (!location) {
      setError(
        "Please enter the job location."
      );
      return;
    }

    if (!form.jobType) {
      setError(
        "Please select a job type."
      );
      return;
    }

    if (!form.experienceLevel) {
      setError(
        "Please select an experience level."
      );
      return;
    }

    if (skills.length === 0) {
      setError(
        "Please add at least one required skill."
      );
      return;
    }

    if (skills.length > 50) {
      setError(
        "A job cannot have more than 50 skills."
      );
      return;
    }

    const hasInvalidSkill = skills.some(
      (skill) => skill.length > 100
    );

    if (hasInvalidSkill) {
      setError(
        "Each skill cannot exceed 100 characters."
      );
      return;
    }

    /*
     * ----------------------------------------------
     * SALARY
     * ----------------------------------------------
     *
     * HTML number inputs return strings.
     *
     * Backend expects actual numbers or null.
     */

    const salaryMin =
      form.salaryMin !== ""
        ? Number(form.salaryMin)
        : null;

    const salaryMax =
      form.salaryMax !== ""
        ? Number(form.salaryMax)
        : null;

    if (
      salaryMin !== null &&
      (!Number.isFinite(salaryMin) ||
        salaryMin < 0)
    ) {
      setError(
        "Minimum salary must be a valid non-negative number."
      );
      return;
    }

    if (
      salaryMax !== null &&
      (!Number.isFinite(salaryMax) ||
        salaryMax < 0)
    ) {
      setError(
        "Maximum salary must be a valid non-negative number."
      );
      return;
    }

    if (
      salaryMin !== null &&
      salaryMax !== null &&
      salaryMin > salaryMax
    ) {
      setError(
        "Minimum salary cannot be greater than maximum salary."
      );
      return;
    }

    /*
     * ----------------------------------------------
     * API REQUEST
     * ----------------------------------------------
     */

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/company/jobs`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title,
            description,
            location,
            jobType: form.jobType,
            experienceLevel:
              form.experienceLevel,

            salaryMin,
            salaryMax,

            skills,

            careerPaths:
              form.careerPaths,
          }),
        }
      );

      const data =
        await response.json();

      /*
       * ----------------------------------------------
       * AUTH ERROR
       * ----------------------------------------------
       */

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        /*
         * 403 can also mean the company is not
         * verified. Handle that separately.
         */

        if (
          response.status === 403 &&
          data.code === "COMPANY_NOT_VERIFIED"
        ) {
          setError(
            data.message ||
              "Your company must be verified before creating jobs."
          );

          return;
        }

        localStorage.removeItem("token");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      /*
       * ----------------------------------------------
       * BACKEND VALIDATION ERROR
       * ----------------------------------------------
       */

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create job."
        );
      }

      /*
       * ----------------------------------------------
       * SUCCESS
       * ----------------------------------------------
       */

      setSuccess(
        data.message ||
          "Job submitted for admin approval."
      );

      setForm({
        ...INITIAL_FORM,
      });

      /*
       * Give the user enough time to see the
       * successful submission message.
       */

      setTimeout(() => {
        navigate("/company", {
          replace: true,
        });
      }, 1400);
    } catch (err) {
      console.error(
        "Create job error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while creating the job."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ==================================================
   * VERIFICATION
   * ==================================================
   */

  const verificationStatus =
    String(
      company?.verificationStatus || ""
    ).toLowerCase();

  const isVerified =
    verificationStatus === "verified";

  /*
   * ==================================================
   * LOADING
   * ==================================================
   */

  if (loading) {
    return (
      <div className={styles.page}>
        <CompanySidebar />

        <main className={styles.main}>
          <div className={styles.loading}>
            <Loader2
              size={22}
              className={styles.spinner}
            />

            <span>
              Loading job creation...
            </span>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ==================================================
   * COMPANY NOT VERIFIED
   * ==================================================
   */

  if (company && !isVerified) {
    const rejected =
      verificationStatus === "rejected";

    return (
      <div className={styles.page}>
        <CompanySidebar />

        <main className={styles.main}>
          <header className={styles.topbar}>
            <div className={styles.breadcrumb}>
              <span>Company</span>

              <span className={styles.slash}>
                /
              </span>

              <strong>
                Post a Job
              </strong>
            </div>

            <div className={styles.topbarRight}>
              <div className={styles.companyAvatar}>
                {(
                  company?.companyName ||
                  "C"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className={styles.companyIdentity}>
                <strong>
                  {company?.companyName ||
                    "Company"}
                </strong>

                <span>
                  Company
                </span>
              </div>
            </div>
          </header>

          <section
            className={styles.restrictedPage}
          >
            <div
              className={
                styles.restrictedCard
              }
            >
              <div
                className={
                  styles.restrictedIcon
                }
              >
                <Building2
                  size={26}
                />
              </div>

              <span
                className={`${styles.restrictedStatus} ${
                  rejected
                    ? styles.rejectedStatus
                    : styles.pendingStatus
                }`}
              >
                {rejected
                  ? "Verification rejected"
                  : "Verification pending"}
              </span>

              <h1>
                Job posting is unavailable
              </h1>

              <p>
                Your company must be
                verified before you can
                publish job opportunities
                to students.
              </p>

              <Link
                to="/company"
                className={
                  styles.primaryButton
                }
              >
                Back to dashboard
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /*
   * ==================================================
   * MAIN PAGE
   * ==================================================
   */

  return (
    <div className={styles.page}>
      <CompanySidebar />

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>Company</span>

            <span className={styles.slash}>
              /
            </span>

            <strong>
              Post a Job
            </strong>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.companyAvatar}>
              {(
                company?.companyName ||
                "C"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className={styles.companyIdentity}>
              <strong>
                {company?.companyName ||
                  "Company"}
              </strong>

              <span>
                Company
              </span>
            </div>

            <ChevronDown
              size={16}
              className={styles.chevron}
            />
          </div>
        </header>

        <div className={styles.content}>
          {/* ==========================================
              PAGE HEADER
          ========================================== */}

          <div className={styles.pageHeader}>
            <div>
              <Link
                to="/company"
                className={styles.backLink}
              >
                <ArrowLeft size={15} />

                Back to dashboard
              </Link>

              <p className={styles.eyebrow}>
                CREATE OPPORTUNITY
              </p>

              <h1>
                Post a new job
              </h1>

              <p
                className={
                  styles.pageDescription
                }
              >
                Add the details students need
                to understand the opportunity
                and decide whether it is right
                for them.
              </p>
            </div>
          </div>

          {/* ==========================================
              ERROR
          ========================================== */}

          {error && (
            <div
              className={styles.alertError}
              role="alert"
            >
              <div
                className={
                  styles.alertIcon
                }
              >
                <X size={16} />
              </div>

              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                aria-label="Close error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ==========================================
              SUCCESS
          ========================================== */}

          {success && (
            <div
              className={styles.alertSuccess}
              role="status"
            >
              <div
                className={
                  styles.alertIcon
                }
              >
                <CheckCircle2
                  size={16}
                />
              </div>

              <span>{success}</span>
            </div>
          )}

          <form
            className={styles.layout}
            onSubmit={handleSubmit}
          >
            {/* ========================================
                LEFT FORM
            ======================================== */}

            <div className={styles.formColumn}>
              {/* ======================================
                  01 OPPORTUNITY BASICS
              ====================================== */}

              <section
                className={styles.card}
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div
                    className={
                      styles.sectionNumber
                    }
                  >
                    01
                  </div>

                  <div>
                    <h2>
                      Opportunity basics
                    </h2>

                    <p>
                      Start with the basic
                      information about this
                      opportunity.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.formGroup
                  }
                >
                  <label htmlFor="title">
                    Job title
                    <span>*</span>
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Frontend Developer Intern"
                    disabled={submitting}
                  />
                </div>

                <div
                  className={
                    styles.twoColumns
                  }
                >
                  <div
                    className={
                      styles.formGroup
                    }
                  >
                    <label htmlFor="jobType">
                      Job type
                      <span>*</span>
                    </label>

                    <select
                      id="jobType"
                      name="jobType"
                      value={
                        form.jobType
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitting
                      }
                    >
                      <option value="">
                        Select job type
                      </option>

                      {JOB_TYPES.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className={
                      styles.formGroup
                    }
                  >
                    <label htmlFor="experienceLevel">
                      Experience
                      <span>*</span>
                    </label>

                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      value={
                        form.experienceLevel
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitting
                      }
                    >
                      <option value="">
                        Select experience
                      </option>

                      {EXPERIENCE_LEVELS.map(
                        (level) => (
                          <option
                            key={
                              level.value
                            }
                            value={
                              level.value
                            }
                          >
                            {level.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div
                  className={
                    styles.twoColumns
                  }
                >
                  <div
                    className={
                      styles.formGroup
                    }
                  >
                    <label htmlFor="location">
                      Location
                      <span>*</span>
                    </label>

                    <div
                      className={
                        styles.inputWithIcon
                      }
                    >
                      <MapPin
                        size={16}
                      />

                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={
                          form.location
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="e.g. Noida, Uttar Pradesh"
                        disabled={
                          submitting
                        }
                      />
                    </div>
                  </div>

                  <div
                    className={
                      styles.salaryHint
                    }
                  >
                    <div
                      className={
                        styles.smallLabel
                      }
                    >
                      COMPENSATION
                    </div>

                    <p>
                      Add a salary range
                      if you want students
                      to see it.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.twoColumns
                  }
                >
                  <div
                    className={
                      styles.formGroup
                    }
                  >
                    <label htmlFor="salaryMin">
                      Minimum salary
                    </label>

                    <div
                      className={
                        styles.currencyInput
                      }
                    >
                      <span>₹</span>

                      <input
                        id="salaryMin"
                        name="salaryMin"
                        type="number"
                        min="0"
                        value={
                          form.salaryMin
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="15,000"
                        disabled={
                          submitting
                        }
                      />
                    </div>
                  </div>

                  <div
                    className={
                      styles.formGroup
                    }
                  >
                    <label htmlFor="salaryMax">
                      Maximum salary
                    </label>

                    <div
                      className={
                        styles.currencyInput
                      }
                    >
                      <span>₹</span>

                      <input
                        id="salaryMax"
                        name="salaryMax"
                        type="number"
                        min="0"
                        value={
                          form.salaryMax
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="25,000"
                        disabled={
                          submitting
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* ======================================
                  02 ABOUT ROLE
              ====================================== */}

              <section
                className={styles.card}
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div
                    className={
                      styles.sectionNumber
                    }
                  >
                    02
                  </div>

                  <div>
                    <h2>
                      About the role
                    </h2>

                    <p>
                      Describe the work and
                      what makes this
                      opportunity meaningful.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.formGroup
                  }
                >
                  <label htmlFor="description">
                    Job description
                    <span>*</span>
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={8}
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Describe the opportunity, responsibilities, projects, team and what the student will learn..."
                    disabled={
                      submitting
                    }
                  />

                  <small>
                    Minimum 20 characters.
                    Keep the description
                    clear and specific.
                  </small>
                </div>
              </section>

              {/* ======================================
                  03 REQUIREMENTS
              ====================================== */}

              <section
                className={styles.card}
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div
                    className={
                      styles.sectionNumber
                    }
                  >
                    03
                  </div>

                  <div>
                    <h2>
                      Requirements
                    </h2>

                    <p>
                      Focus on skills that are
                      actually needed for the
                      role.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.formGroup
                  }
                >
                  <label htmlFor="skills">
                    Required skills
                    <span>*</span>
                  </label>

                  <input
                    id="skills"
                    name="skills"
                    type="text"
                    value={form.skills}
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. React, JavaScript, HTML, CSS"
                    disabled={
                      submitting
                    }
                  />

                  <small>
                    Separate skills with
                    commas. These skills are
                    used for student-job
                    matching.
                  </small>
                </div>
              </section>

              {/* ======================================
                  04 CAREER MATCHING
              ====================================== */}

              <section
                className={styles.card}
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div
                    className={
                      styles.sectionNumber
                    }
                  >
                    04
                  </div>

                  <div>
                    <h2>
                      Career matching
                    </h2>

                    <p>
                      Connect this opportunity
                      with relevant career paths
                      on StudentPath.
                    </p>
                  </div>
                </div>

                {careers.length === 0 ? (
                  <div
                    className={
                      styles.emptyCareers
                    }
                  >
                    <BriefcaseBusiness
                      size={18}
                    />

                    <span>
                      No career paths are
                      currently available.
                    </span>
                  </div>
                ) : (
                  <div
                    className={
                      styles.careerGrid
                    }
                  >
                    {careers.map(
                      (career) => {
                        const id =
                          career._id;

                        const selected =
                          form.careerPaths.includes(
                            id
                          );

                        return (
                          <button
                            key={id}
                            type="button"
                            className={
                              selected
                                ? styles.careerSelected
                                : styles.careerButton
                            }
                            onClick={() =>
                              handleCareerToggle(
                                id
                              )
                            }
                            disabled={
                              submitting
                            }
                          >
                            <span
                              className={
                                styles.careerCheck
                              }
                            >
                              {selected && (
                                <Check
                                  size={
                                    13
                                  }
                                />
                              )}
                            </span>

                            <span
                              className={
                                styles.careerText
                              }
                            >
                              {career.title}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              {/* ======================================
                  MOBILE ACTIONS
              ====================================== */}

              <div
                className={
                  styles.mobileActions
                }
              >
                <Link
                  to="/company"
                  className={
                    styles.cancelButton
                  }
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className={
                    styles.primaryButton
                  }
                  disabled={
                    submitting
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={16}
                        className={
                          styles.spinner
                        }
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />

                      Create job
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ========================================
                RIGHT SUMMARY
            ======================================== */}

            <aside
              className={
                styles.summaryColumn
              }
            >
              <div
                className={
                  styles.summaryCard
                }
              >
                <div
                  className={
                    styles.summaryHeader
                  }
                >
                  <div>
                    <span>
                      READY TO POST?
                    </span>

                    <h3>
                      Publish job
                    </h3>
                  </div>

                  <div
                    className={
                      styles.summaryIcon
                    }
                  >
                    <BriefcaseBusiness
                      size={19}
                    />
                  </div>
                </div>

                <div
                  className={
                    styles.previewCompany
                  }
                >
                  <div
                    className={
                      styles.previewAvatar
                    }
                  >
                    {(
                      company?.companyName ||
                      "C"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {company?.companyName ||
                        "Your company"}
                    </strong>

                    <span>
                      {company?.industry ||
                        "Company"}
                    </span>
                  </div>
                </div>

                <div
                  className={
                    styles.summaryDivider
                  }
                />

                <div
                  className={
                    styles.checkList
                  }
                >
                  <div
                    className={
                      styles.checkItem
                    }
                  >
                    <span>
                      <Check size={13} />
                    </span>

                    <p>
                      Company verified
                    </p>
                  </div>

                  <div
                    className={
                      form.title.trim()
                        ? styles.checkItem
                        : styles.checkItemMuted
                    }
                  >
                    <span>
                      {form.title.trim() ? (
                        <Check
                          size={13}
                        />
                      ) : (
                        "2"
                      )}
                    </span>

                    <p>
                      Job title added
                    </p>
                  </div>

                  <div
                    className={
                      form.description.trim()
                        ? styles.checkItem
                        : styles.checkItemMuted
                    }
                  >
                    <span>
                      {form.description.trim() ? (
                        <Check
                          size={13}
                        />
                      ) : (
                        "3"
                      )}
                    </span>

                    <p>
                      Description added
                    </p>
                  </div>

                  <div
                    className={
                      form.skills.trim()
                        ? styles.checkItem
                        : styles.checkItemMuted
                    }
                  >
                    <span>
                      {form.skills.trim() ? (
                        <Check
                          size={13}
                        />
                      ) : (
                        "4"
                      )}
                    </span>

                    <p>
                      Required skills added
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className={
                    styles.publishButton
                  }
                  disabled={
                    submitting
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={16}
                        className={
                          styles.spinner
                        }
                      />

                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish job

                      <ArrowRight
                        size={16}
                      />
                    </>
                  )}
                </button>

                <p
                  className={
                    styles.publishNote
                  }
                >
                  Your job will be submitted
                  for StudentPath admin review
                  before becoming visible to
                  students.
                </p>
              </div>

              {/* ======================================
                  COMPANY STATUS
              ====================================== */}

              <div
                className={
                  styles.statusCard
                }
              >
                <div
                  className={
                    styles.statusIcon
                  }
                >
                  <CheckCircle2
                    size={17}
                  />
                </div>

                <div>
                  <strong>
                    Company verified
                  </strong>

                  <p>
                    Your company is eligible
                    to create opportunities.
                  </p>
                </div>
              </div>

              {/* ======================================
                  QUICK TIP
              ====================================== */}

              <div
                className={
                  styles.tipCard
                }
              >
                <Clock3 size={17} />

                <div>
                  <strong>
                    Before publishing
                  </strong>

                  <p>
                    Check that the role,
                    required skills and
                    location are accurate.
                  </p>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateJobs;