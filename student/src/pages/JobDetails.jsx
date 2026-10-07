import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Monitor,
  Plus,
  Send,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import styles from "./JobDetails.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const normalizeSkill = (skill) =>
  String(
    typeof skill === "object" && skill !== null
      ? skill.name || skill.skill || skill.title || ""
      : skill || ""
  )
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const getSkillName = (skill) => {
  if (typeof skill === "string") return skill;

  if (skill && typeof skill === "object") {
    return skill.name || skill.skill || skill.title || "Skill";
  }

  return "Skill";
};

const normalizeSkills = (skills) =>
  Array.isArray(skills)
    ? skills.map(getSkillName).filter(Boolean)
    : [];

const calculateMatch = (studentSkills, jobSkills) => {
  const student = new Set(
    normalizeSkills(studentSkills).map(normalizeSkill).filter(Boolean)
  );

  const required = normalizeSkills(jobSkills)
    .map(normalizeSkill)
    .filter(Boolean);

  if (!required.length) return 0;

  const matched = required.filter((skill) => student.has(skill));

  return Math.round((matched.length / required.length) * 100);
};

const getMatchedSkills = (studentSkills, jobSkills) => {
  const student = new Set(
    normalizeSkills(studentSkills).map(normalizeSkill).filter(Boolean)
  );

  return normalizeSkills(jobSkills).filter((skill) =>
    student.has(normalizeSkill(skill))
  );
};

const getMissingSkills = (studentSkills, jobSkills) => {
  const student = new Set(
    normalizeSkills(studentSkills).map(normalizeSkill).filter(Boolean)
  );

  return normalizeSkills(jobSkills).filter(
    (skill) => !student.has(normalizeSkill(skill))
  );
};

const formatDate = (date) => {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatPostedDate = (date) => {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  const diff = Date.now() - value.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;

  return `Posted ${formatDate(date)}`;
};

const getCompanyName = (job) =>
  job?.company?.name ||
  job?.companyName ||
  job?.employer?.name ||
  "Company";

const getCompanyLocation = (job) =>
  job?.company?.location ||
  job?.companyLocation ||
  job?.location ||
  "Location not specified";

const getCompanyInitial = (name) =>
  String(name || "C").trim().charAt(0).toUpperCase();

const getLocation = (job) => {
  if (job?.structuredLocation) {
    const parts = [
      job.structuredLocation.city,
      job.structuredLocation.state,
      job.structuredLocation.country,
    ].filter(Boolean);

    if (parts.length) return parts.join(", ");
  }

  return (
    job?.location ||
    job?.city ||
    job?.remoteRegions?.join(", ") ||
    "Location not specified"
  );
};

const getWorkplaceType = (job) =>
  job?.workplaceType ||
  job?.workMode ||
  job?.workPreference ||
  "Not specified";

const formatMoney = (value, currency = "INR") => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) return "";

  if (currency === "INR") {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }

    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }

    if (amount >= 1000) {
      return `₹${Math.round(amount / 1000)}K`;
    }

    return `₹${amount.toLocaleString("en-IN")}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getSalary = (job) => {
  const compensation = job?.compensation || {};

  const currency =
    compensation.currency ||
    job?.salaryCurrency ||
    "INR";

  const period =
    compensation.period ||
    job?.salaryPeriod ||
    "";

  const salaryMin =
    compensation.salaryMin ??
    job?.salaryMin;

  const salaryMax =
    compensation.salaryMax ??
    job?.salaryMax;

  const stipendMin =
    compensation.stipendMin ??
    job?.stipendMin;

  const stipendMax =
    compensation.stipendMax ??
    job?.stipendMax;

  if (salaryMin !== undefined || salaryMax !== undefined) {
    const min = formatMoney(salaryMin, currency);
    const max = formatMoney(salaryMax, currency);

    let value = "";

    if (min && max) {
      value = `${min} – ${max}`;
    } else {
      value = min || max;
    }

    if (period) value += ` / ${period}`;

    return value;
  }

  if (stipendMin !== undefined || stipendMax !== undefined) {
    const min = formatMoney(stipendMin, currency);
    const max = formatMoney(stipendMax, currency);

    let value = "";

    if (min && max) {
      value = `${min} – ${max}`;
    } else {
      value = min || max;
    }

    if (period) value += ` / ${period}`;

    return value;
  }

  if (compensation.isDisclosed === false) {
    return "Not disclosed";
  }

  return "Not specified";
};

const getExperience = (job) => {
  if (
    job?.experienceMinYears !== undefined ||
    job?.experienceMaxYears !== undefined
  ) {
    const min = job.experienceMinYears;
    const max = job.experienceMaxYears;

    if (min !== undefined && max !== undefined) {
      return `${min}–${max} years`;
    }

    if (min !== undefined) return `${min}+ years`;
    if (max !== undefined) return `Up to ${max} years`;
  }

  if (job?.experienceLevel) return job.experienceLevel;

  return "Not specified";
};

const getEducation = (job) => {
  const education = job?.educationRequirements;

  if (!education) {
    return job?.education || "Not specified";
  }

  const values = [];

  if (education.minimumDegree) {
    values.push(education.minimumDegree);
  }

  if (Array.isArray(education.fieldsOfStudy)) {
    values.push(...education.fieldsOfStudy.slice(0, 2));
  }

  return values.length ? values.join(" · ") : "Not specified";
};

const getApplicationMethodLabel = (job) => {
  const method = job?.applicationMethod;

  const labels = {
    Platform: "Apply through StudentPath",
    External: "External application",
    Email: "Apply by email",
    "Company Website": "Company website",
  };

  return labels[method] || method || "Application details";
};

const getCareerName = (career) =>
  typeof career === "string"
    ? career
    : career?.title ||
      career?.name ||
      career?.canonicalTitle ||
      "Career";

const getSkillRequirementName = (item) =>
  typeof item === "string"
    ? item
    : item?.name ||
      item?.skill ||
      item?.title ||
      "Skill";

const getSkillImportance = (item) =>
  typeof item === "object" && item !== null
    ? item.importance || "Required"
    : "Required";

const getBenefits = (job) =>
  Array.isArray(job?.benefits)
    ? job.benefits.filter(Boolean)
    : [];

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [student, setStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/jobs/${id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Unable to load this job."
          );
        }

        const nextJob =
          result?.job ||
          result?.data?.job ||
          result?.data ||
          result;

        if (active) {
          setJob(nextJob);
        }
      } catch (err) {
        console.error("Job details error:", err);

        if (active) {
          setError(
            err.message || "Unable to load this job."
          );
        }
      }
    };

    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [studentResponse, savedResponse, applicationsResponse] =
          await Promise.all([
            fetch(`${API_URL}/student/me`, { headers }),
            fetch(`${API_URL}/saved-jobs/check/${id}`, { headers }),
            fetch(`${API_URL}/applications`, { headers }),
          ]);

        if (studentResponse.status === 401) {
          localStorage.removeItem("token");
          return;
        }

        if (studentResponse.ok) {
          const result = await studentResponse.json();

          const nextStudent =
            result?.student ||
            result?.data?.student ||
            result?.data ||
            result;

          if (active) {
            setStudent(nextStudent);
          }
        }

        if (savedResponse.ok && active) {
          const result = await savedResponse.json();

          setSaved(
            Boolean(
              result?.isSaved ??
                result?.saved ??
                result?.data?.isSaved ??
                result?.data?.saved ??
                result?.data
            )
          );
        }

        if (applicationsResponse.ok && active) {
          const result = await applicationsResponse.json();

          const applications =
            result?.applications ||
            result?.data?.applications ||
            result?.data ||
            [];

          if (Array.isArray(applications)) {
            const found = applications.some((application) => {
              const applicationJob =
                application?.job?._id ||
                application?.job?.id ||
                application?.job;

              return String(applicationJob) === String(id);
            });

            setApplied(found);
          }
        }
      } catch (err) {
        console.error("Job user data error:", err);
      }
    };

    Promise.all([fetchJob(), fetchUserData()]).finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [id]);

  const handleApply = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!job || applied || applying) return;

    try {
      setApplying(true);

      const response = await fetch(
        `${API_URL}/applications/${job._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.status === 409) {
        setApplied(true);
        return;
      }

      if (!response.ok) {
        throw new Error(
          result?.message || "Unable to submit application."
        );
      }

      setApplied(true);
    } catch (err) {
      console.error("Apply job error:", err);
      setError(
        err.message || "Unable to submit application."
      );
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!job || saving) return;

    try {
      setSaving(true);

      if (saved) {
        const response = await fetch(
          `${API_URL}/saved-jobs/${job._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Unable to remove saved job."
          );
        }

        setSaved(false);
      } else {
        const response = await fetch(
          `${API_URL}/saved-jobs/${job._id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          }
        );

        const result = await response.json();

        if (response.status === 409) {
          setSaved(true);
          return;
        }

        if (!response.ok) {
          throw new Error(
            result?.message || "Unable to save this job."
          );
        }

        setSaved(true);
      }
    } catch (err) {
      console.error("Save job error:", err);
      setError(
        err.message || "Unable to update saved job."
      );
    } finally {
      setSaving(false);
    }
  };

  const data = useMemo(() => {
    if (!job) return null;

    const companyName = getCompanyName(job);
    const studentSkills = normalizeSkills(student?.skills);

    const structuredRequirements = Array.isArray(
      job.skillRequirements
    )
      ? job.skillRequirements
      : [];

    const requiredSkillNames =
      structuredRequirements.length > 0
        ? structuredRequirements
            .filter(
              (item) =>
                getSkillImportance(item).toLowerCase() !==
                "preferred"
            )
            .map(getSkillRequirementName)
        : normalizeSkills(job.skills);

    const preferredSkillNames =
      structuredRequirements.length > 0
        ? structuredRequirements
            .filter(
              (item) =>
                getSkillImportance(item).toLowerCase() ===
                "preferred"
            )
            .map(getSkillRequirementName)
        : normalizeSkills(job.preferredSkills);

    const allJobSkills = [
      ...requiredSkillNames,
      ...preferredSkillNames,
    ];

    return {
      companyName,
      companyLocation: getCompanyLocation(job),
      companyInitial: getCompanyInitial(companyName),

      location: getLocation(job),
      workplaceType: getWorkplaceType(job),

      salary: getSalary(job),
      experience: getExperience(job),
      education: getEducation(job),

      postedDate: formatPostedDate(
        job.publishedAt || job.createdAt
      ),

      deadline: job.applicationDeadline
        ? formatDate(job.applicationDeadline)
        : "",

      applicationMethod:
        getApplicationMethodLabel(job),

      jobSkills: requiredSkillNames,
      preferredSkills: preferredSkillNames,

      structuredSkillRequirements:
        structuredRequirements,

      studentSkills,

      matchedSkills: getMatchedSkills(
        studentSkills,
        allJobSkills
      ),

      missingSkills: getMissingSkills(
        studentSkills,
        requiredSkillNames
      ),

      profileMatch: calculateMatch(
        studentSkills,
        requiredSkillNames
      ),

      relatedCareers: Array.isArray(job.careerPaths)
        ? job.careerPaths
        : [],

      benefits: getBenefits(job),
    };
  }, [job, student]);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingOrb} />
        <div className={styles.loadingContent}>
          <div className={styles.spinner} />
          <p>Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (error || !job || !data) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            <BriefcaseBusiness size={24} />
          </div>

          <h2>Unable to open this opportunity</h2>

          <p>
            {error || "The requested job could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className={styles.primaryButton}
          >
            <ArrowLeft size={16} />
            Back to jobs
          </button>
        </div>
      </div>
    );
  }

  const matchScore = Math.min(
    Math.max(data.profileMatch, 0),
    100
  );

  const applicationDeadlinePassed =
    job.applicationDeadline &&
    new Date(job.applicationDeadline).getTime() < Date.now();

  return (
    <div className={styles.page}>
      <div className={styles.backgroundShapeOne} />
      <div className={styles.backgroundShapeTwo} />

      <div className={styles.container}>
        <div className={styles.topbar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/jobs")}
          >
            <ArrowLeft size={17} />
            <span>Back to jobs</span>
          </button>

          <div className={styles.topbarRight}>
            {job.isFeatured && (
              <span className={styles.featuredMini}>
                <Sparkles size={13} />
                Featured
              </span>
            )}

            <span className={styles.jobId}>
              Opportunity
            </span>
          </div>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroGrid} />

          <div className={styles.heroTop}>
            <div className={styles.companyBlock}>
              <div className={styles.companyLogo}>
                {job.company?.logo ? (
                  <img
                    src={job.company.logo}
                    alt={`${data.companyName} logo`}
                  />
                ) : (
                  <span>{data.companyInitial}</span>
                )}
              </div>

              <div className={styles.companyInfo}>
                <div className={styles.companyNameRow}>
                  <strong>{data.companyName}</strong>

                  {job.company?.verified && (
                    <span className={styles.verified}>
                      <Check size={11} />
                    </span>
                  )}
                </div>

                <span>
                  <MapPin size={13} />
                  {data.companyLocation}
                </span>
              </div>
            </div>

            <div className={styles.heroMeta}>
              {data.postedDate && (
                <span>
                  <Clock3 size={13} />
                  {data.postedDate}
                </span>
              )}

              {job.industry && (
                <span>{job.industry}</span>
              )}
            </div>
          </div>

          <div className={styles.heroMain}>
            <div className={styles.heroCopy}>
              <div className={styles.heroBadges}>
                {job.jobType && (
                  <span className={styles.heroBadge}>
                    {job.jobType}
                  </span>
                )}

                {job.experienceLevel && (
                  <span className={styles.heroBadge}>
                    {job.experienceLevel}
                  </span>
                )}

                {data.workplaceType && (
                  <span className={styles.heroBadge}>
                    {data.workplaceType}
                  </span>
                )}
              </div>

              <h1>{job.title || "Untitled opportunity"}</h1>

              {job.summary && (
                <p className={styles.heroSummary}>
                  {job.summary}
                </p>
              )}
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.heroApplyButton}
                onClick={handleApply}
                disabled={
                  applying ||
                  applied ||
                  applicationDeadlinePassed
                }
              >
                {applied ? (
                  <>
                    <CheckCircle2 size={17} />
                    Application submitted
                  </>
                ) : applying ? (
                  <>
                    <span className={styles.buttonSpinner} />
                    Applying...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Apply now
                  </>
                )}
              </button>

              <button
                type="button"
                className={`${styles.saveButton} ${
                  saved ? styles.savedButton : ""
                }`}
                onClick={handleSave}
                disabled={saving}
                aria-label={
                  saved ? "Remove saved job" : "Save job"
                }
              >
                {saved ? (
                  <BookmarkCheck size={18} />
                ) : (
                  <Bookmark size={18} />
                )}

                <span>{saved ? "Saved" : "Save"}</span>
              </button>

              {job.applicationUrl && (
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.externalButton}
                  aria-label="Open external application"
                >
                  <ExternalLink size={17} />
                </a>
              )}
            </div>
          </div>

          <div className={styles.quickFacts}>
            <div className={styles.quickFact}>
              <div className={`${styles.quickFactIcon} ${styles.green}`}>
                <MapPin size={16} />
              </div>

              <div>
                <span>Location</span>
                <strong>{data.location}</strong>
              </div>
            </div>

            <div className={styles.quickFact}>
              <div className={`${styles.quickFactIcon} ${styles.blue}`}>
                <Monitor size={16} />
              </div>

              <div>
                <span>Workplace</span>
                <strong>{data.workplaceType}</strong>
              </div>
            </div>

            <div className={styles.quickFact}>
              <div className={`${styles.quickFactIcon} ${styles.orange}`}>
                <Wallet size={16} />
              </div>

              <div>
                <span>Compensation</span>
                <strong>{data.salary}</strong>
              </div>
            </div>

            <div className={styles.quickFact}>
              <div className={`${styles.quickFactIcon} ${styles.purple}`}>
                <BriefcaseBusiness size={16} />
              </div>

              <div>
                <span>Experience</span>
                <strong>{data.experience}</strong>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <main className={styles.mainColumn}>
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <div className={`${styles.sectionIcon} ${styles.iconGreen}`}>
                  <BriefcaseBusiness size={17} />
                </div>

                <div>
                  <span>Opportunity</span>
                  <h2>About this role</h2>
                </div>
              </div>

              <div className={styles.description}>
                {job.description ? (
                  <p>{job.description}</p>
                ) : (
                  <p className={styles.muted}>
                    No detailed description has been provided.
                  </p>
                )}
              </div>
            </section>

            {Array.isArray(job.responsibilities) &&
              job.responsibilities.length > 0 && (
                <section className={styles.card}>
                  <div className={styles.sectionHeading}>
                    <div className={`${styles.sectionIcon} ${styles.iconBlue}`}>
                      <CheckCircle2 size={17} />
                    </div>

                    <div>
                      <span>What you will do</span>
                      <h2>Responsibilities</h2>
                    </div>
                  </div>

                  <ul className={styles.cleanList}>
                    {job.responsibilities.map(
                      (item, index) => (
                        <li key={`${item}-${index}`}>
                          <span className={styles.listMarker}>
                            <Check size={12} />
                          </span>

                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </section>
              )}

            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <div className={`${styles.sectionIcon} ${styles.iconPurple}`}>
                  <Code2 size={17} />
                </div>

                <div>
                  <span>What you need</span>
                  <h2>Requirements & skills</h2>
                </div>
              </div>

              {Array.isArray(job.qualifications) &&
                job.qualifications.length > 0 && (
                  <div className={styles.requirementBlock}>
                    <h3>Required qualifications</h3>

                    <ul className={styles.cleanList}>
                      {job.qualifications.map(
                        (item, index) => (
                          <li key={`${item}-${index}`}>
                            <span
                              className={
                                styles.listMarker
                              }
                            >
                              <Check size={12} />
                            </span>

                            <span>{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {Array.isArray(
                job.preferredQualifications
              ) &&
                job.preferredQualifications.length > 0 && (
                  <div className={styles.requirementBlock}>
                    <h3>Preferred qualifications</h3>

                    <ul className={styles.cleanList}>
                      {job.preferredQualifications.map(
                        (item, index) => (
                          <li key={`${item}-${index}`}>
                            <span
                              className={`${styles.listMarker} ${styles.preferredMarker}`}
                            >
                              <Plus size={12} />
                            </span>

                            <span>{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              <div className={styles.skillsSection}>
                <div className={styles.subHeading}>
                  <h3>Technical & professional skills</h3>

                  <span>
                    {data.jobSkills.length} required
                  </span>
                </div>

                {data.structuredSkillRequirements.length >
                0 ? (
                  <div className={styles.requirementGrid}>
                    {data.structuredSkillRequirements.map(
                      (item, index) => {
                        const name =
                          getSkillRequirementName(item);

                        const importance =
                          getSkillImportance(item);

                        const matched = data.matchedSkills.some(
                          (skill) =>
                            normalizeSkill(skill) ===
                            normalizeSkill(name)
                        );

                        return (
                          <div
                            className={`${styles.requirementCard} ${
                              matched
                                ? styles.requirementMatched
                                : ""
                            }`}
                            key={`${name}-${index}`}
                          >
                            <div>
                              <strong>{name}</strong>

                              <span>
                                {importance}
                              </span>
                            </div>

                            {matched && (
                              <CheckCircle2
                                size={15}
                              />
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className={styles.skillCloud}>
                    {data.jobSkills.map(
                      (skill, index) => {
                        const matched =
                          data.matchedSkills.some(
                            (item) =>
                              normalizeSkill(item) ===
                              normalizeSkill(skill)
                          );

                        return (
                          <span
                            key={`${skill}-${index}`}
                            className={
                              matched
                                ? styles.skillMatched
                                : styles.skillChip
                            }
                          >
                            {matched && (
                              <Check size={11} />
                            )}
                            {skill}
                          </span>
                        );
                      }
                    )}

                    {data.preferredSkills.map(
                      (skill, index) => (
                        <span
                          key={`preferred-${skill}-${index}`}
                          className={styles.skillPreferred}
                        >
                          <Plus size={11} />
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>

            {job.educationRequirements && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <div className={`${styles.sectionIcon} ${styles.iconOrange}`}>
                    <GraduationCap size={17} />
                  </div>

                  <div>
                    <span>Academic background</span>
                    <h2>Education</h2>
                  </div>
                </div>

                <div className={styles.educationGrid}>
                  <div className={styles.infoTile}>
                    <span>Minimum degree</span>
                    <strong>
                      {job.educationRequirements
                        .minimumDegree ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div className={styles.infoTile}>
                    <span>Field of study</span>
                    <strong>
                      {Array.isArray(
                        job.educationRequirements
                          .fieldsOfStudy
                      ) &&
                      job.educationRequirements.fieldsOfStudy
                        .length
                        ? job.educationRequirements.fieldsOfStudy.join(
                            ", "
                          )
                        : "Any relevant field"}
                    </strong>
                  </div>

                  <div className={styles.infoTile}>
                    <span>Graduation range</span>
                    <strong>
                      {job.educationRequirements
                        .graduationYearMin ||
                      job.educationRequirements
                        .graduationYearMax
                        ? `${
                            job.educationRequirements
                              .graduationYearMin ||
                            "—"
                          } – ${
                            job.educationRequirements
                              .graduationYearMax ||
                            "—"
                          }`
                        : "Not specified"}
                    </strong>
                  </div>

                  <div className={styles.infoTile}>
                    <span>Certifications</span>
                    <strong>
                      {Array.isArray(
                        job.educationRequirements
                          .certifications
                      ) &&
                      job.educationRequirements.certifications
                        .length
                        ? job.educationRequirements.certifications.join(
                            ", "
                          )
                        : "Not required"}
                    </strong>
                  </div>
                </div>
              </section>
            )}

            {data.benefits.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <div className={`${styles.sectionIcon} ${styles.iconGreen}`}>
                    <Sparkles size={17} />
                  </div>

                  <div>
                    <span>What you get</span>
                    <h2>Benefits</h2>
                  </div>
                </div>

                <div className={styles.benefitGrid}>
                  {data.benefits.map(
                    (benefit, index) => (
                      <div
                        className={styles.benefitItem}
                        key={`${benefit}-${index}`}
                      >
                        <span className={styles.benefitIcon}>
                          <Check size={13} />
                        </span>

                        <span>{benefit}</span>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            <section className={`${styles.card} ${styles.matchCard}`}>
              <div className={styles.matchHeader}>
                <div className={styles.sectionHeading}>
                  <div
                    className={`${styles.sectionIcon} ${styles.iconBlue}`}
                  >
                    <Sparkles size={17} />
                  </div>

                  <div>
                    <span>Personalized analysis</span>
                    <h2>Your profile fit</h2>
                  </div>
                </div>

                <Link
                  to="/skill-gap"
                  className={styles.smallAction}
                >
                  Improve match
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className={styles.matchOverview}>
                <div
                  className={styles.matchRing}
                  style={{
                    "--match": `${matchScore}%`,
                  }}
                >
                  <div className={styles.matchRingInner}>
                    <strong>{matchScore}%</strong>
                    <span>match</span>
                  </div>
                </div>

                <div className={styles.matchCopy}>
                  <strong>
                    {matchScore >= 80
                      ? "Strong match"
                      : matchScore >= 60
                        ? "Good starting match"
                        : matchScore >= 40
                          ? "Some skills align"
                          : "Skills gap to work on"}
                  </strong>

                  <p>
                    Your match is calculated from the skills
                    currently present in your StudentPath
                    profile.
                  </p>

                  <div className={styles.matchStats}>
                    <span>
                      <b>{data.matchedSkills.length}</b>
                      matched
                    </span>

                    <span>
                      <b>{data.missingSkills.length}</b>
                      missing
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.matchColumns}>
                <div>
                  <div className={styles.matchColumnTitle}>
                    <span className={styles.dotGreen} />
                    Matching skills
                  </div>

                  <div className={styles.matchSkillList}>
                    {data.matchedSkills.length > 0 ? (
                      data.matchedSkills.map(
                        (skill, index) => (
                          <span
                            className={styles.matchSkill}
                            key={`${skill}-${index}`}
                          >
                            <Check size={11} />
                            {skill}
                          </span>
                        )
                      )
                    ) : (
                      <span className={styles.emptyMatch}>
                        No matching skills yet.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className={styles.matchColumnTitle}>
                    <span className={styles.dotRed} />
                    Missing required skills
                  </div>

                  <div className={styles.matchSkillList}>
                    {data.missingSkills.length > 0 ? (
                      data.missingSkills.map(
                        (skill, index) => (
                          <span
                            className={styles.missingSkill}
                            key={`${skill}-${index}`}
                          >
                            {skill}
                          </span>
                        )
                      )
                    ) : (
                      <span className={styles.emptyMatch}>
                        No required skills missing.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {data.relatedCareers.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <div className={`${styles.sectionIcon} ${styles.iconPurple}`}>
                    <Users size={17} />
                  </div>

                  <div>
                    <span>Explore more</span>
                    <h2>Related career paths</h2>
                  </div>
                </div>

                <div className={styles.careerGrid}>
                  {data.relatedCareers.map(
                    (career, index) => {
                      const careerId =
                        career?._id ||
                        career?.id;

                      if (!careerId) {
                        return (
                          <div
                            className={styles.careerCard}
                            key={`${getCareerName(
                              career
                            )}-${index}`}
                          >
                            <span>
                              {getCareerName(career)}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Link
                          to={`/careers/${careerId}`}
                          className={styles.careerCard}
                          key={careerId}
                        >
                          <span>
                            {getCareerName(career)}
                          </span>

                          <ArrowUpRight size={15} />
                        </Link>
                      );
                    }
                  )}
                </div>
              </section>
            )}
          </main>

          <aside className={styles.sidebar}>
            <section className={styles.applicationCard}>
              <div className={styles.applicationAccent} />

              <div className={styles.applicationTop}>
                <div>
                  <span>Application</span>
                  <h3>Ready to apply?</h3>
                </div>

                <div className={styles.applicationIcon}>
                  <Send size={17} />
                </div>
              </div>

              <p>
                {applied
                  ? "Your application has already been submitted for this opportunity."
                  : "Review your profile and apply when you are ready."}
              </p>

              <button
                type="button"
                className={styles.sidebarApply}
                onClick={handleApply}
                disabled={
                  applying ||
                  applied ||
                  applicationDeadlinePassed
                }
              >
                {applied ? (
                  <>
                    <CheckCircle2 size={16} />
                    Applied
                  </>
                ) : applying ? (
                  <>
                    <span className={styles.buttonSpinner} />
                    Applying...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Apply now
                  </>
                )}
              </button>

              <div className={styles.applicationDetails}>
                {data.deadline && (
                  <div>
                    <CalendarDays size={15} />
                    <span>
                      <small>Deadline</small>
                      <strong>{data.deadline}</strong>
                    </span>
                  </div>
                )}

                <div>
                  <ExternalLink size={15} />
                  <span>
                    <small>Application</small>
                    <strong>
                      {data.applicationMethod}
                    </strong>
                  </span>
                </div>
              </div>

              {job.applicationUrl && (
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.externalLink}
                >
                  Open external application
                  <ArrowUpRight size={14} />
                </a>
              )}
            </section>

            <section className={styles.sidebarCard}>
              <div className={styles.sidebarHeading}>
                <span className={styles.sidebarHeadingIcon}>
                  <BriefcaseBusiness size={15} />
                </span>

                <h3>Job overview</h3>
              </div>

              <div className={styles.overviewList}>
                <div>
                  <span>Job type</span>
                  <strong>
                    {job.jobType || "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>Workplace</span>
                  <strong>{data.workplaceType}</strong>
                </div>

                <div>
                  <span>Compensation</span>
                  <strong>{data.salary}</strong>
                </div>

                <div>
                  <span>Experience</span>
                  <strong>{data.experience}</strong>
                </div>

                <div>
                  <span>Education</span>
                  <strong>{data.education}</strong>
                </div>

                {job.openings !== undefined && (
                  <div>
                    <span>Openings</span>
                    <strong>{job.openings}</strong>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.sidebarCard}>
              <div className={styles.sidebarHeading}>
                <span
                  className={`${styles.sidebarHeadingIcon} ${styles.locationIcon}`}
                >
                  <MapPin size={15} />
                </span>

                <h3>Location</h3>
              </div>

              <div className={styles.locationBox}>
                <strong>{data.location}</strong>

                <span>{data.workplaceType}</span>
              </div>

              {Array.isArray(job.remoteRegions) &&
                job.remoteRegions.length > 0 && (
                  <div className={styles.sidebarNote}>
                    <span>Remote regions</span>
                    <p>
                      {job.remoteRegions.join(", ")}
                    </p>
                  </div>
                )}

              {(job.relocationAssistance ||
                job.visaSponsorship) && (
                <div className={styles.supportList}>
                  {job.relocationAssistance && (
                    <span>
                      <Check size={12} />
                      Relocation assistance
                    </span>
                  )}

                  {job.visaSponsorship && (
                    <span>
                      <Check size={12} />
                      Visa sponsorship
                    </span>
                  )}
                </div>
              )}
            </section>

            <section className={styles.companyCard}>
              <div className={styles.companyCardTop}>
                <div className={styles.companyCardLogo}>
                  {job.company?.logo ? (
                    <img
                      src={job.company.logo}
                      alt=""
                    />
                  ) : (
                    data.companyInitial
                  )}
                </div>

                <div>
                  <span>Company</span>
                  <h3>{data.companyName}</h3>
                </div>
              </div>

              <div className={styles.companyMeta}>
                <span>
                  <MapPin size={13} />
                  {data.companyLocation}
                </span>

                {job.industry && (
                  <span>
                    <BriefcaseBusiness size={13} />
                    {job.industry}
                  </span>
                )}
              </div>

              {job.company?.description && (
                <p>{job.company.description}</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;