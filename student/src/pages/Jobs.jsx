import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  BriefcaseBusiness,
  Clock3,
  GraduationCap,
  IndianRupee,
  CalendarDays,
  Users,
  ArrowRight,
  X,
  Building2,
  Sparkles,
  Check,
  ChevronDown,
} from "lucide-react";
import styles from "./Jobs.module.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* =========================================================
   HELPERS
   ========================================================= */

const getSkillName = (skill) => {
  if (typeof skill === "string") return skill;

  if (skill && typeof skill === "object") {
    return (
      skill.name ||
      skill.skill ||
      skill.title ||
      skill.label ||
      ""
    );
  }

  return "";
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];

  return skills
    .map(getSkillName)
    .map((skill) => String(skill).trim())
    .filter(Boolean);
};

const getCompanyName = (job) => {
  if (!job?.company) return "Company";

  if (typeof job.company === "string") {
    return job.company;
  }

  return (
    job.company.name ||
    job.company.companyName ||
    job.company.title ||
    "Company"
  );
};

const getCompanyInitial = (name) => {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "CO";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const getJobType = (job) => {
  return job?.jobType || job?.opportunityType || "Not specified";
};

const getWorkplaceType = (job) => {
  return (
    job?.workplaceType ||
    job?.workMode ||
    "Not specified"
  );
};

const getLocationLabel = (job) => {
  if (job?.location) {
    if (typeof job.location === "string") {
      return job.location;
    }

    const location = job.location;

    return [
      location.city,
      location.state,
      location.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  if (job?.structuredLocation) {
    const location = job.structuredLocation;

    return [
      location.city,
      location.state,
      location.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  if (
    Array.isArray(job?.remoteRegions) &&
    job.remoteRegions.length
  ) {
    return job.remoteRegions.join(", ");
  }

  return "Location not specified";
};

const formatMoney = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  if (number >= 10000000) {
    return `₹${(number / 10000000).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `₹${Math.round(number / 1000)}K`;
  }

  return `₹${number}`;
};

const getSalaryInfo = (job) => {
  const compensation = job?.compensation || {};

  const min =
    compensation.salaryMin ??
    job?.salaryMin;

  const max =
    compensation.salaryMax ??
    job?.salaryMax;

  const currency =
    compensation.currency ||
    job?.salaryCurrency ||
    "INR";

  if (
    min !== undefined &&
    min !== null &&
    max !== undefined &&
    max !== null
  ) {
    const formattedMin =
      currency === "INR"
        ? formatMoney(min)
        : `${currency} ${Number(min).toLocaleString()}`;

    const formattedMax =
      currency === "INR"
        ? formatMoney(max)
        : `${currency} ${Number(max).toLocaleString()}`;

    return {
      label: `${formattedMin}–${formattedMax}`,
      value: Math.max(
        Number(min) || 0,
        Number(max) || 0
      ),
    };
  }

  if (min !== undefined && min !== null) {
    const formatted =
      currency === "INR"
        ? formatMoney(min)
        : `${currency} ${Number(min).toLocaleString()}`;

    return {
      label: `From ${formatted}`,
      value: Number(min) || 0,
    };
  }

  if (max !== undefined && max !== null) {
    const formatted =
      currency === "INR"
        ? formatMoney(max)
        : `${currency} ${Number(max).toLocaleString()}`;

    return {
      label: `Up to ${formatted}`,
      value: Number(max) || 0,
    };
  }

  const stipendMin = compensation.stipendMin;
  const stipendMax = compensation.stipendMax;

  if (
    stipendMin !== undefined &&
    stipendMin !== null &&
    stipendMax !== undefined &&
    stipendMax !== null
  ) {
    return {
      label: `₹${Number(
        stipendMin
      ).toLocaleString()}–₹${Number(
        stipendMax
      ).toLocaleString()} stipend`,
      value: Number(stipendMax) || 0,
    };
  }

  if (job?.salary) {
    return {
      label: String(job.salary),
      value: 0,
    };
  }

  return {
    label: "Salary not disclosed",
    value: 0,
  };
};

const getExperience = (job) => {
  if (
    job?.experienceMinYears !== undefined ||
    job?.experienceMaxYears !== undefined
  ) {
    const min = job.experienceMinYears;
    const max = job.experienceMaxYears;

    if (
      min !== undefined &&
      max !== undefined
    ) {
      return `${min}–${max} yrs`;
    }

    if (min !== undefined) {
      return `${min}+ yrs`;
    }

    if (max !== undefined) {
      return `Up to ${max} yrs`;
    }
  }

  return job?.experienceLevel || "Not specified";
};

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDeadline = (job) => {
  return formatDate(
    job?.applicationDeadline ||
    job?.expiresAt
  );
};

const getJobSummary = (job) => {
  return (
    job?.summary ||
    job?.description ||
    job?.responsibilities?.[0] ||
    ""
  );
};

const getBenefits = (job) => {
  if (!Array.isArray(job?.benefits)) {
    return [];
  }

  return job.benefits
    .map((benefit) => {
      if (typeof benefit === "string") {
        return benefit;
      }

      if (benefit && typeof benefit === "object") {
        return (
          benefit.name ||
          benefit.title ||
          benefit.label ||
          ""
        );
      }

      return "";
    })
    .filter(Boolean);
};

const calculateProfileMatch = (student, job) => {
  const studentSkills = normalizeSkills(
    student?.skills
  );

  const jobSkills = normalizeSkills(
    job?.skills
  );

  const preferredSkills = normalizeSkills(
    job?.preferredSkills
  );

  if (!jobSkills.length && !preferredSkills.length) {
    return {
      match: 0,
      matched: [],
      missing: [],
    };
  }

  const studentSkillSet = new Set(
    studentSkills.map((skill) =>
      skill.toLowerCase()
    )
  );

  const requiredMatched = [];
  const requiredMissing = [];

  jobSkills.forEach((skill) => {
    if (
      studentSkillSet.has(skill.toLowerCase())
    ) {
      requiredMatched.push(skill);
    } else {
      requiredMissing.push(skill);
    }
  });

  let score = 0;

  if (jobSkills.length) {
    score =
      (requiredMatched.length /
        jobSkills.length) *
      100;
  }

  if (
    !jobSkills.length &&
    preferredSkills.length
  ) {
    const preferredMatched =
      preferredSkills.filter((skill) =>
        studentSkillSet.has(
          skill.toLowerCase()
        )
      );

    score =
      (preferredMatched.length /
        preferredSkills.length) *
      100;
  }

  return {
    match: Math.round(
      Math.min(score, 100)
    ),
    matched: requiredMatched,
    missing: requiredMissing,
  };
};

/* =========================================================
   COMPONENT
   ========================================================= */

function Jobs() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("All");
  const [workMode, setWorkMode] = useState("All");
  const [location, setLocation] = useState("All");
  const [sortBy, setSortBy] = useState("Match");

  const [showFilters, setShowFilters] =
    useState(false);

  /* =======================================================
     FETCH
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          studentResponse,
          jobsResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/student/me`, {
            headers,
          }),
          fetch(`${API_URL}/jobs`, {
            headers,
          }),
        ]);

        if (studentResponse.status === 401) {
          navigate("/login");
          return;
        }

        const studentData =
          await studentResponse.json();

        const jobsData =
          await jobsResponse.json();

        if (!studentResponse.ok) {
          throw new Error(
            studentData?.message ||
            "Unable to load your profile."
          );
        }

        if (!jobsResponse.ok) {
          throw new Error(
            jobsData?.message ||
            "Unable to load jobs."
          );
        }

        if (cancelled) return;

        const studentProfile =
          studentData?.student ||
          studentData?.data?.student ||
          studentData?.data ||
          studentData;

        const jobsList =
          jobsData?.jobs ||
          jobsData?.data?.jobs ||
          jobsData?.data ||
          [];

        setStudent(studentProfile);

        setJobs(
          Array.isArray(jobsList)
            ? jobsList
            : []
        );
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Jobs page error:",
          err
        );

        setError(
          err.message ||
          "Unable to load jobs."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  /* =======================================================
     NORMALIZE JOBS
     ======================================================= */

  const jobsWithMatch = useMemo(() => {
    return jobs.map((job) => {
      const matchData =
        calculateProfileMatch(
          student,
          job
        );

      const salaryInfo =
        getSalaryInfo(job);

      return {
        ...job,

        match: matchData.match,
        matched: matchData.matched,
        missing: matchData.missing,

        companyName:
          getCompanyName(job),

        jobType:
          getJobType(job),

        workplaceType:
          getWorkplaceType(job),

        locationLabel:
          getLocationLabel(job),

        salary:
          salaryInfo.label,

        salaryValue:
          salaryInfo.value,

        experience:
          getExperience(job),

        deadline:
          getDeadline(job),

        summary:
          getJobSummary(job),

        benefits:
          getBenefits(job),

        preferred:
          normalizeSkills(
            job.preferredSkills
          ),
      };
    });
  }, [jobs, student]);

  /* =======================================================
     LOCATIONS
     ======================================================= */

  const locations = useMemo(() => {
    const uniqueLocations =
      new Set();

    jobsWithMatch.forEach((job) => {
      if (
        job.locationLabel &&
        job.locationLabel !==
        "Location not specified"
      ) {
        uniqueLocations.add(
          job.locationLabel
        );
      }
    });

    return Array.from(
      uniqueLocations
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [jobsWithMatch]);

  /* =======================================================
     FILTER
     ======================================================= */

  const filteredJobs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const filtered =
      jobsWithMatch.filter((job) => {
        const searchableText = [
          job.title,
          job.companyName,
          job.locationLabel,
          job.workplaceType,
          job.jobType,
          job.experience,
          job.department,
          job.industry,
          job.category,
          job.summary,
          ...(job.skills || []),
          ...(job.preferred || []),
          ...(job.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchableText.includes(query);

        const matchesType =
          jobType === "All" ||
          job.jobType === jobType;

        const matchesWorkMode =
          workMode === "All" ||
          job.workplaceType ===
          workMode;

        const matchesLocation =
          location === "All" ||
          job.locationLabel ===
          location;

        return (
          matchesSearch &&
          matchesType &&
          matchesWorkMode &&
          matchesLocation
        );
      });

    return [...filtered].sort(
      (a, b) => {
        if (sortBy === "Match") {
          return b.match - a.match;
        }

        if (sortBy === "Newest") {
          return (
            new Date(
              b.publishedAt ||
              b.createdAt ||
              0
            ) -
            new Date(
              a.publishedAt ||
              a.createdAt ||
              0
            )
          );
        }

        if (sortBy === "Oldest") {
          return (
            new Date(
              a.publishedAt ||
              a.createdAt ||
              0
            ) -
            new Date(
              b.publishedAt ||
              b.createdAt ||
              0
            )
          );
        }

        if (sortBy === "Salary") {
          return (
            b.salaryValue -
            a.salaryValue
          );
        }

        return 0;
      }
    );
  }, [
    jobsWithMatch,
    search,
    jobType,
    workMode,
    location,
    sortBy,
  ]);

  /* =======================================================
     FILTER ACTIONS
     ======================================================= */

  const clearFilters = () => {
    setJobType("All");
    setWorkMode("All");
    setLocation("All");
    setSortBy("Match");
    setSearch("");
  };

  const hasActiveFilters =
    Boolean(search) ||
    jobType !== "All" ||
    workMode !== "All" ||
    location !== "All";

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingHeader}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonSubtitle} />
          </div>

          <div className={styles.loadingSearch} />

          <div className={styles.loadingGrid}>
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  className={styles.loadingCard}
                  key={index}
                >
                  <div className={styles.skeletonTop}>
                    <div className={styles.skeletonLogo} />
                    <div className={styles.skeletonLines}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className={styles.skeletonMeta}>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className={styles.skeletonText}>
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className={styles.skeletonTags}>
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className={styles.skeletonFooter} />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>
            <BriefcaseBusiness size={22} />
          </div>

          <h2>Unable to load jobs</h2>

          <p>{error}</p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={() =>
              window.location.reload()
            }
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.eyebrow}>
              <Sparkles size={13} />
              OPPORTUNITIES FOR YOU
            </div>

            <h1>
              Find work that
              <span> fits your path.</span>
            </h1>

            <p className={styles.subtitle}>
              Explore opportunities matched to
              your skills, career direction and
              preferences.
            </p>
          </div>
        </header>

        {/* =================================================
            SEARCH / FILTER PANEL
        ================================================= */}

        <section className={styles.searchPanel}>
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <Search size={18} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search jobs, companies, skills or locations..."
                aria-label="Search jobs"
              />

              {search && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              className={`${styles.filterToggle} ${showFilters
                  ? styles.filterToggleActive
                  : ""
                }`}
              onClick={() =>
                setShowFilters(
                  (current) => !current
                )
              }
            >
              <SlidersHorizontal size={16} />
              Filters
              <ChevronDown
                size={14}
                className={
                  showFilters
                    ? styles.chevronOpen
                    : ""
                }
              />
            </button>
          </div>

          <div
            className={`${styles.filters} ${showFilters
                ? styles.filtersOpen
                : ""
              }`}
          >
            <div className={styles.filterItem}>
              <label htmlFor="job-type">
                Opportunity
              </label>

              <select
                id="job-type"
                value={jobType}
                onChange={(event) =>
                  setJobType(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All types
                </option>
                <option value="Internship">
                  Internship
                </option>
                <option value="Full-time">
                  Full-time
                </option>
                <option value="Part-time">
                  Part-time
                </option>
                <option value="Contract">
                  Contract
                </option>
                <option value="Apprenticeship">
                  Apprenticeship
                </option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label htmlFor="work-mode">
                Work mode
              </label>

              <select
                id="work-mode"
                value={workMode}
                onChange={(event) =>
                  setWorkMode(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All modes
                </option>
                <option value="Remote">
                  Remote
                </option>
                <option value="Hybrid">
                  Hybrid
                </option>
                <option value="On-site">
                  On-site
                </option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label htmlFor="job-location">
                Location
              </label>

              <select
                id="job-location"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All locations
                </option>

                {locations.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className={styles.filterItem}>
              <label htmlFor="sort-jobs">
                Sort by
              </label>

              <select
                id="sort-jobs"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
              >
                <option value="Match">
                  Best match
                </option>
                <option value="Newest">
                  Newest
                </option>
                <option value="Oldest">
                  Oldest
                </option>
                <option value="Salary">
                  Highest salary
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* =================================================
            RESULT BAR
        ================================================= */}

        <div className={styles.resultsBar}>
          <div className={styles.resultsLeft}>
            <strong>
              {filteredJobs.length}
            </strong>

            <span>
              {filteredJobs.length === 1
                ? "opportunity"
                : "opportunities"}
            </span>

            {student?.targetRole && (
              <>
                <span className={styles.resultDivider}>
                  /
                </span>

                <span>
                  Targeting{" "}
                  <strong>
                    {student.targetRole}
                  </strong>
                </span>
              </>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={clearFilters}
            >
              Clear all filters
              <X size={13} />
            </button>
          )}
        </div>

        {/* =================================================
            EMPTY
        ================================================= */}

        {filteredJobs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Search size={23} />
            </div>

            <h2>
              No opportunities found
            </h2>

            <p>
              We couldn't find jobs matching
              your current search and filters.
              Try broadening your search.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={styles.primaryButton}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* =================================================
             JOB GRID
          ================================================= */

          <div className={styles.jobsList}>
            {filteredJobs.map((job) => (
              <article
                className={styles.jobCard}
                key={job._id || job.id}
              >
                <div className={styles.cardTop}>
                  <div className={styles.companyLogo}>
                    {getCompanyInitial(job.companyName)}
                  </div>

                  <div className={styles.cardIdentity}>
                    <div className={styles.titleRow}>
                      <h2 title={job.title}>
                        {job.title || "Untitled opportunity"}
                      </h2>

                      {job.isFeatured && (
                        <span className={styles.featuredBadge}>
                          Featured
                        </span>
                      )}
                    </div>

                    <p className={styles.companyName}>
                      {job.companyName}
                      {job.department && (
                        <>
                          <span className={styles.dot}>·</span>
                          {job.department}
                        </>
                      )}
                    </p>
                  </div>

                  <div className={styles.matchScore}>
                    <strong>{job.match}%</strong>
                    <span>match</span>
                  </div>
                </div>

                <div className={styles.metaGrid}>
                  <span>
                    <MapPin size={14} />
                    {job.locationLabel}
                  </span>

                  <span>
                    <BriefcaseBusiness size={14} />
                    {job.workplaceType}
                  </span>

                  <span>
                    <Clock3 size={14} />
                    {job.jobType}
                  </span>

                  <span>
                    <GraduationCap size={14} />
                    {job.experience}
                  </span>
                </div>

                {job.summary && (
                  <p className={styles.jobSummary}>
                    {job.summary}
                  </p>
                )}

                {(job.matched.length > 0 ||
                  job.missing.length > 0) && (
                    <div className={styles.skillsSection}>
                      <span className={styles.sectionLabel}>
                        Skills
                      </span>

                      <div className={styles.skillList}>
                        {job.matched.slice(0, 3).map((skill) => (
                          <span
                            key={`matched-${skill}`}
                            className={styles.matchedSkill}
                          >
                            ✓ {skill}
                          </span>
                        ))}

                        {job.missing.slice(0, 2).map((skill) => (
                          <span
                            key={`missing-${skill}`}
                            className={styles.missingSkill}
                          >
                            {skill}
                          </span>
                        ))}

                        {job.matched.length +
                          job.missing.length >
                          5 && (
                            <span className={styles.moreSkills}>
                              +
                              {job.matched.length +
                                job.missing.length -
                                5}
                            </span>
                          )}
                      </div>
                    </div>
                  )}

                <div className={styles.cardBottom}>
                  <div className={styles.salaryBlock}>
                    <span className={styles.salaryLabel}>
                      Compensation
                    </span>

                    <strong>{job.salary}</strong>
                  </div>

                  <div className={styles.bottomMeta}>
                    {job.deadline && (
                      <span>
                        <CalendarDays size={13} />
                        {job.deadline}
                      </span>
                    )}

                    {job.openings && (
                      <span>
                        <Users size={13} />
                        {job.openings}{" "}
                        {Number(job.openings) === 1
                          ? "opening"
                          : "openings"}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.viewButton}
                  onClick={() =>
                    navigate(
                      `/jobs/${job._id || job.id}`
                    )
                  }
                >
                  View opportunity
                  <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Jobs;