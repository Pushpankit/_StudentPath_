import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import styles from "./CompanyOnboarding.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const STEPS = [
  {
    number: 1,
    label: "Company identity",
    shortLabel: "Identity",
  },
  {
    number: 2,
    label: "Company profile",
    shortLabel: "Profile",
  },
  {
    number: 3,
    label: "Hiring & contact",
    shortLabel: "Hiring",
  },
  {
    number: 4,
    label: "Review",
    shortLabel: "Review",
  },
];

const INDUSTRIES = [
  "Technology",
  "Software & IT",
  "Finance",
  "Healthcare",
  "Education",
  "E-commerce",
  "Marketing",
  "Media",
  "Consulting",
  "Manufacturing",
  "Real Estate",
  "Travel & Hospitality",
  "Telecommunications",
  "Automotive",
  "Other",
];

const COMPANY_TYPES = [
  "Startup",
  "Small Business",
  "Medium Business",
  "Enterprise",
  "MNC",
  "Non-Profit",
  "Government",
  "Educational Institution",
  "Agency",
  "Consulting Firm",
  "Other",
];

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10000+",
];

const COMPANY_STAGES = [
  "Bootstrapped",
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Established",
];

const WORK_MODES = [
  "On-site",
  "Hybrid",
  "Remote",
];

function CompanyOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    companyName: "",
    legalName: "",
    companyType: "",
    companyStage: "",
    companySize: "",
    industry: "",
    foundedYear: "",
    website: "",
    linkedinUrl: "",
    headquarters: "",
    locations: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    hiringRoles: "",
    hiringLocations: "",
    hiringWorkModes: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const progress = step * 25;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleWorkModeToggle = (mode) => {
    setForm((previous) => {
      const exists =
        previous.hiringWorkModes.includes(mode);

      return {
        ...previous,
        hiringWorkModes: exists
          ? previous.hiringWorkModes.filter(
              (item) => item !== mode
            )
          : [...previous.hiringWorkModes, mode],
      };
    });

    if (error) {
      setError("");
    }
  };

  const validateStep = (currentStep) => {
    setError("");

    if (currentStep === 1) {
      if (!form.companyName.trim()) {
        setError("Please enter your company name.");
        return false;
      }

      if (form.companyName.trim().length < 2) {
        setError(
          "Company name must be at least 2 characters."
        );
        return false;
      }

      if (!form.industry.trim()) {
        setError("Please select your industry.");
        return false;
      }

      if (!form.companySize.trim()) {
        setError("Please select your company size.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!form.headquarters.trim()) {
        setError(
          "Please enter your company headquarters."
        );
        return false;
      }

      if (!form.description.trim()) {
        setError(
          "Please provide a description of your company."
        );
        return false;
      }

      if (form.description.trim().length < 30) {
        setError(
          "Company description should contain at least 30 characters."
        );
        return false;
      }

      if (form.description.trim().length > 3000) {
        setError(
          "Company description cannot exceed 3000 characters."
        );
        return false;
      }

      if (
        form.website.trim() &&
        !/^https?:\/\/.+/i.test(
          form.website.trim()
        )
      ) {
        setError(
          "Website must start with http:// or https://."
        );
        return false;
      }

      if (
        form.linkedinUrl.trim() &&
        !/^https?:\/\/.+/i.test(
          form.linkedinUrl.trim()
        )
      ) {
        setError(
          "LinkedIn URL must start with http:// or https://."
        );
        return false;
      }
    }

    if (currentStep === 3) {
      if (!form.contactEmail.trim()) {
        setError(
          "Please enter a contact email."
        );
        return false;
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          form.contactEmail.trim()
        )
      ) {
        setError(
          "Please enter a valid contact email."
        );
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return;
    }

    setStep((previous) =>
      Math.min(previous + 1, 4)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleBack = () => {
    setError("");

    setStep((previous) =>
      Math.max(previous - 1, 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setStep(3);
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const locations = form.locations
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const hiringRoles = form.hiringRoles
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const hiringLocations =
        form.hiringLocations
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

      const response = await fetch(
        `${API_URL}/company/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            companyName:
              form.companyName.trim(),

            legalName:
              form.legalName.trim(),

            companyType:
              form.companyType.trim(),

            companyStage:
              form.companyStage.trim(),

            companySize:
              form.companySize.trim(),

            industry:
              form.industry.trim(),

            foundedYear:
              form.foundedYear
                ? Number(form.foundedYear)
                : null,

            website:
              form.website.trim(),

            linkedinUrl:
              form.linkedinUrl.trim(),

            headquarters:
              form.headquarters.trim(),

            locations,

            description:
              form.description.trim(),

            contactEmail:
              form.contactEmail
                .trim()
                .toLowerCase(),

            contactPhone:
              form.contactPhone.trim(),

            hiringRoles,

            hiringLocations,

            hiringWorkModes:
              form.hiringWorkModes,
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to submit company profile."
        );
      }

      navigate(
        "/company/",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Company onboarding error:",
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

  const completedSteps = useMemo(() => {
    return STEPS.map((item) => ({
      ...item,
      completed: item.number < step,
      active: item.number === step,
    }));
  }, [step]);

  const formatSize = (value) => {
    if (!value) {
      return "Not selected";
    }

    return `${value} employees`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.backgroundGlowOne} />
      <div className={styles.backgroundGlowTwo} />

      <header className={styles.topbar}>
        <div
          className={styles.brand}
          onClick={() =>
            navigate("/")
          }
        >
          <div className={styles.brandMark}>
            <span />
          </div>

          <span className={styles.brandText}>
            Student<span>Path</span>
          </span>
        </div>

        <div className={styles.topProgress}>
          <span>Company setup</span>
          <span className={styles.dot}>•</span>
          <strong>
            {step} / {STEPS.length}
          </strong>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <aside className={styles.stepCard}>
            <div className={styles.stepCardTop}>
              <div>
                <span className={styles.kicker}>
                  GET STARTED
                </span>

                <h2>
                  Build your
                  <br />
                  company profile
                </h2>
              </div>

              <div className={styles.progressCircle}>
                <span>{progress}%</span>
              </div>
            </div>

            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className={styles.steps}>
              {completedSteps.map(
                (item) => (
                  <div
                    key={item.number}
                    className={`${styles.stepItem} ${
                      item.active
                        ? styles.stepItemActive
                        : ""
                    } ${
                      item.completed
                        ? styles.stepItemCompleted
                        : ""
                    }`}
                  >
                    <div
                      className={`${styles.stepNumber} ${
                        item.completed
                          ? styles.stepNumberCompleted
                          : ""
                      } ${
                        item.active
                          ? styles.stepNumberActive
                          : ""
                      }`}
                    >
                      {item.completed ? (
                        <Check
                          size={13}
                          strokeWidth={3}
                        />
                      ) : (
                        item.number
                      )}
                    </div>

                    <div
                      className={
                        styles.stepInfo
                      }
                    >
                      <strong>
                        {item.label}
                      </strong>

                      <span>
                        {item.number === 1 &&
                          "Basic company details"}

                        {item.number === 2 &&
                          "Public profile"}

                        {item.number === 3 &&
                          "Contact & hiring"}

                        {item.number === 4 &&
                          "Final submission"}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className={styles.trustCard}>
              <div className={styles.trustIcon}>
                <ShieldCheck
                  size={17}
                />
              </div>

              <div>
                <strong>
                  Built for trust
                </strong>

                <p>
                  Your company is reviewed
                  before publishing jobs.
                </p>
              </div>
            </div>
          </aside>

          <section
            className={
              styles.contentCard
            }
          >
            <div
              className={
                styles.contentAccent
              }
            />

            {step === 1 && (
              <div
                className={
                  styles.stepContent
                }
              >
                <div
                  className={styles.eyebrow}
                >
                  STEP 01 · IDENTITY
                </div>

                <h1>
                  Tell students
                  <br />
                  who you are.
                </h1>

                <p
                  className={
                    styles.subtitle
                  }
                >
                  Start with the essentials.
                  These details help students
                  understand your company at a
                  glance.
                </p>

                <div
                  className={
                    styles.formArea
                  }
                >
                  <div
                    className={
                      styles.formGrid
                    }
                  >
                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="companyName">
                        Company name
                        <span>*</span>
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <Building2
                          size={17}
                        />

                        <input
                          id="companyName"
                          name="companyName"
                          type="text"
                          placeholder="e.g. Acme Technologies"
                          value={
                            form.companyName
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="legalName">
                        Legal name
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <Building2
                          size={17}
                        />

                        <input
                          id="legalName"
                          name="legalName"
                          type="text"
                          placeholder="Registered legal name"
                          value={
                            form.legalName
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="industry">
                        Industry
                        <span>*</span>
                      </label>

                      <select
                        id="industry"
                        name="industry"
                        value={
                          form.industry
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          loading
                        }
                      >
                        <option value="">
                          Select industry
                        </option>

                        {INDUSTRIES.map(
                          (industry) => (
                            <option
                              key={industry}
                              value={
                                industry
                              }
                            >
                              {industry}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="companyType">
                        Company type
                      </label>

                      <select
                        id="companyType"
                        name="companyType"
                        value={
                          form.companyType
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          loading
                        }
                      >
                        <option value="">
                          Select type
                        </option>

                        {COMPANY_TYPES.map(
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
                        styles.field
                      }
                    >
                      <label htmlFor="companySize">
                        Company size
                        <span>*</span>
                      </label>

                      <select
                        id="companySize"
                        name="companySize"
                        value={
                          form.companySize
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          loading
                        }
                      >
                        <option value="">
                          Select size
                        </option>

                        {COMPANY_SIZES.map(
                          (size) => (
                            <option
                              key={size}
                              value={size}
                            >
                              {formatSize(
                                size
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="companyStage">
                        Company stage
                      </label>

                      <select
                        id="companyStage"
                        name="companyStage"
                        value={
                          form.companyStage
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          loading
                        }
                      >
                        <option value="">
                          Select stage
                        </option>

                        {COMPANY_STAGES.map(
                          (stageName) => (
                            <option
                              key={stageName}
                              value={
                                stageName
                              }
                            >
                              {stageName}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="foundedYear">
                        Founded year
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <Sparkles
                          size={17}
                        />

                        <input
                          id="foundedYear"
                          name="foundedYear"
                          type="number"
                          min="1800"
                          max={
                            new Date().getFullYear()
                          }
                          placeholder="e.g. 2020"
                          value={
                            form.foundedYear
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div
                    className={
                      styles.error
                    }
                  >
                    {error}
                  </div>
                )}

                <div
                  className={
                    styles.actions
                  }
                >
                  <span />

                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={
                      handleNext
                    }
                    disabled={
                      loading
                    }
                  >
                    Continue
                    <ArrowRight
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div
                className={
                  styles.stepContent
                }
              >
                <div
                  className={styles.eyebrow}
                >
                  STEP 02 · PROFILE
                </div>

                <h1>
                  Give students
                  <br />
                  the bigger picture.
                </h1>

                <p
                  className={
                    styles.subtitle
                  }
                >
                  Explain what your company
                  does and give students enough
                  context to decide if they want
                  to explore your opportunities.
                </p>

                <div
                  className={
                    styles.formArea
                  }
                >
                  <div
                    className={
                      styles.formGrid
                    }
                  >
                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="headquarters">
                        Headquarters
                        <span>*</span>
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <MapPin
                          size={17}
                        />

                        <input
                          id="headquarters"
                          name="headquarters"
                          type="text"
                          placeholder="City, State, Country"
                          value={
                            form.headquarters
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="locations">
                        Other locations
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <MapPin
                          size={17}
                        />

                        <input
                          id="locations"
                          name="locations"
                          type="text"
                          placeholder="Delhi, Bengaluru, Mumbai"
                          value={
                            form.locations
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>

                      <small>
                        Separate multiple
                        locations with commas.
                      </small>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="website">
                        Website
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <Globe2
                          size={17}
                        />

                        <input
                          id="website"
                          name="website"
                          type="url"
                          placeholder="https://company.com"
                          value={
                            form.website
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="linkedinUrl">
                        LinkedIn
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <Globe2
                          size={17}
                        />

                        <input
                          id="linkedinUrl"
                          name="linkedinUrl"
                          type="url"
                          placeholder="https://linkedin.com/company/..."
                          value={
                            form.linkedinUrl
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <div
                      className={
                        styles.labelRow
                      }
                    >
                      <label htmlFor="description">
                        About the company
                        <span>*</span>
                      </label>

                      <span
                        className={
                          styles.counter
                        }
                      >
                        {
                          form.description
                            .length
                        }{" "}
                        / 3000
                      </span>
                    </div>

                    <textarea
                      id="description"
                      name="description"
                      rows={7}
                      maxLength={3000}
                      placeholder="Tell students what your company does, what you build, who you serve, and what makes your team interesting."
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        loading
                      }
                    />

                    <small>
                      Write for students, not
                      just for investors or
                      customers.
                    </small>
                  </div>

                  <div
                    className={
                      styles.infoBanner
                    }
                  >
                    <div
                      className={
                        styles.infoIcon
                      }
                    >
                      <Sparkles
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        Make it useful
                      </strong>

                      <p>
                        A clear company
                        description can help
                        students understand
                        whether your opportunities
                        are relevant to them.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div
                    className={
                      styles.error
                    }
                  >
                    {error}
                  </div>
                )}

                <div
                  className={
                    styles.actions
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      handleBack
                    }
                    disabled={
                      loading
                    }
                  >
                    <ArrowLeft
                      size={16}
                    />
                    Back
                  </button>

                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={
                      handleNext
                    }
                    disabled={
                      loading
                    }
                  >
                    Continue
                    <ArrowRight
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div
                className={
                  styles.stepContent
                }
              >
                <div
                  className={styles.eyebrow}
                >
                  STEP 03 · HIRING
                </div>

                <h1>
                  Tell us how
                  <br />
                  you hire.
                </h1>

                <p
                  className={
                    styles.subtitle
                  }
                >
                  These details help students
                  understand where and how your
                  company typically hires.
                </p>

                <div
                  className={
                    styles.formArea
                  }
                >
                  <div
                    className={
                      styles.sectionTitle
                    }
                  >
                    <Users
                      size={17}
                    />

                    <span>
                      Hiring preferences
                    </span>
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label>
                      Work modes
                    </label>

                    <div
                      className={
                        styles.modeGrid
                      }
                    >
                      {WORK_MODES.map(
                        (mode) => {
                          const selected =
                            form.hiringWorkModes.includes(
                              mode
                            );

                          return (
                            <button
                              key={mode}
                              type="button"
                              className={`${styles.modeCard} ${
                                selected
                                  ? styles.modeCardActive
                                  : ""
                              }`}
                              onClick={() =>
                                handleWorkModeToggle(
                                  mode
                                )
                              }
                              disabled={
                                loading
                              }
                            >
                              <span
                                className={
                                  styles.modeCheck
                                }
                              >
                                {selected && (
                                  <Check
                                    size={
                                      13
                                    }
                                    strokeWidth={
                                      3
                                    }
                                  />
                                )}
                              </span>

                              <span>
                                {mode}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div
                    className={
                      styles.formGrid
                    }
                  >
                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="hiringRoles">
                        Roles you hire for
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <Users
                          size={17}
                        />

                        <input
                          id="hiringRoles"
                          name="hiringRoles"
                          type="text"
                          placeholder="Frontend Developer, Designer, Analyst"
                          value={
                            form.hiringRoles
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>

                      <small>
                        Separate roles with
                        commas.
                      </small>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="hiringLocations">
                        Hiring locations
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <MapPin
                          size={17}
                        />

                        <input
                          id="hiringLocations"
                          name="hiringLocations"
                          type="text"
                          placeholder="Noida, Delhi, Remote"
                          value={
                            form.hiringLocations
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>

                      <small>
                        Separate locations with
                        commas.
                      </small>
                    </div>
                  </div>

                  <div
                    className={
                      styles.sectionDivider
                    }
                  />

                  <div
                    className={
                      styles.sectionTitle
                    }
                  >
                    <ShieldCheck
                      size={17}
                    />

                    <span>
                      Verification contact
                    </span>
                  </div>

                  <div
                    className={
                      styles.formGrid
                    }
                  >
                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="contactEmail">
                        Contact email
                        <span>*</span>
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <Mail
                          size={17}
                        />

                        <input
                          id="contactEmail"
                          name="contactEmail"
                          type="email"
                          placeholder="hr@company.com"
                          value={
                            form.contactEmail
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>

                      <small>
                        This will be used for
                        company verification.
                      </small>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label htmlFor="contactPhone">
                        Contact phone
                      </label>

                      <div
                        className={
                          styles.inputWrap
                        }
                      >
                        <Phone
                          size={17}
                        />

                        <input
                          id="contactPhone"
                          name="contactPhone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={
                            form.contactPhone
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div
                    className={
                      styles.error
                    }
                  >
                    {error}
                  </div>
                )}

                <div
                  className={
                    styles.actions
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      handleBack
                    }
                    disabled={
                      loading
                    }
                  >
                    <ArrowLeft
                      size={16}
                    />
                    Back
                  </button>

                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={
                      handleNext
                    }
                    disabled={
                      loading
                    }
                  >
                    Review profile
                    <ArrowRight
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div
                className={
                  styles.stepContent
                }
              >
                <div
                  className={styles.eyebrow}
                >
                  STEP 04 · REVIEW
                </div>

                <h1>
                  Everything looks
                  <br />
                  ready.
                </h1>

                <p
                  className={
                    styles.subtitle
                  }
                >
                  Review your information before
                  submitting your company profile
                  for verification.
                </p>

                <div
                  className={
                    styles.reviewHero
                  }
                >
                  <div
                    className={
                      styles.reviewHeroIcon
                    }
                  >
                    <CheckCircle2
                      size={25}
                    />
                  </div>

                  <div>
                    <strong>
                      Profile ready for
                      verification
                    </strong>

                    <p>
                      Once submitted, the
                      StudentPath team can review
                      your company information.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.reviewGrid
                  }
                >
                  <div
                    className={
                      styles.reviewSection
                    }
                  >
                    <div
                      className={
                        styles.reviewSectionHead
                      }
                    >
                      <Building2
                        size={16}
                      />

                      <span>
                        Company
                      </span>
                    </div>

                    <div
                      className={
                        styles.reviewRows
                      }
                    >
                      <div>
                        <span>
                          Company name
                        </span>

                        <strong>
                          {form.companyName ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Industry
                        </span>

                        <strong>
                          {form.industry ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Type
                        </span>

                        <strong>
                          {form.companyType ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Size
                        </span>

                        <strong>
                          {formatSize(
                            form.companySize
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Stage
                        </span>

                        <strong>
                          {form.companyStage ||
                            "Not provided"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      styles.reviewSection
                    }
                  >
                    <div
                      className={
                        styles.reviewSectionHead
                      }
                    >
                      <Globe2
                        size={16}
                      />

                      <span>
                        Profile
                      </span>
                    </div>

                    <div
                      className={
                        styles.reviewRows
                      }
                    >
                      <div>
                        <span>
                          Headquarters
                        </span>

                        <strong>
                          {form.headquarters ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Website
                        </span>

                        <strong>
                          {form.website ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          LinkedIn
                        </span>

                        <strong>
                          {form.linkedinUrl ||
                            "Not provided"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      styles.reviewSection
                    }
                  >
                    <div
                      className={
                        styles.reviewSectionHead
                      }
                    >
                      <Users
                        size={16}
                      />

                      <span>
                        Hiring
                      </span>
                    </div>

                    <div
                      className={
                        styles.reviewRows
                      }
                    >
                      <div>
                        <span>
                          Work modes
                        </span>

                        <strong>
                          {form.hiringWorkModes
                            .length
                            ? form.hiringWorkModes.join(
                                ", "
                              )
                            : "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Hiring roles
                        </span>

                        <strong>
                          {form.hiringRoles ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Hiring locations
                        </span>

                        <strong>
                          {form.hiringLocations ||
                            "Not provided"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      styles.reviewSection
                    }
                  >
                    <div
                      className={
                        styles.reviewSectionHead
                      }
                    >
                      <ShieldCheck
                        size={16}
                      />

                      <span>
                        Contact
                      </span>
                    </div>

                    <div
                      className={
                        styles.reviewRows
                      }
                    >
                      <div>
                        <span>
                          Email
                        </span>

                        <strong>
                          {form.contactEmail ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Phone
                        </span>

                        <strong>
                          {form.contactPhone ||
                            "Not provided"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div
                    className={
                      styles.error
                    }
                  >
                    {error}
                  </div>
                )}

                <div
                  className={
                    styles.actions
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      handleBack
                    }
                    disabled={
                      loading
                    }
                  >
                    <ArrowLeft
                      size={16}
                    />
                    Back
                  </button>

                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={
                      handleSubmit
                    }
                    disabled={
                      loading
                    }
                  >
                    {loading
                      ? "Submitting..."
                      : "Submit for verification"}

                    {!loading && (
                      <ArrowRight
                        size={16}
                      />
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default CompanyOnboarding;