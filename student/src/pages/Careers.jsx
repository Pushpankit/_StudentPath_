import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import styles from "./Careers.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const getCareerKey = (career) => {
  return String(
    career.canonicalTitle ||
      career.title ||
      career.name ||
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getCareerTitle = (career) => {
  return (
    career.canonicalTitle ||
    career.title ||
    career.name ||
    "Career Path"
  );
};

const getCareerSkills = (career) => {
  if (!Array.isArray(career.skills)) {
    return [];
  }

  return career.skills
    .map((skill) => {
      if (typeof skill === "string") {
        return skill.trim();
      }

      return String(skill?.name || "").trim();
    })
    .filter(Boolean);
};

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const getCareerMatch = (career, student) => {
  if (!student) {
    return null;
  }

  const careerTitle = normalizeText(getCareerTitle(career));
  const targetRole = normalizeText(student.targetRole);

  if (!targetRole) {
    return null;
  }

  if (
    careerTitle === targetRole ||
    careerTitle.includes(targetRole) ||
    targetRole.includes(careerTitle)
  ) {
    return 100;
  }

  const careerSkills = getCareerSkills(career).map(normalizeText);

  const studentSkills = Array.isArray(student.skills)
    ? student.skills
        .map((skill) => {
          if (typeof skill === "string") {
            return normalizeText(skill);
          }

          return normalizeText(skill?.name);
        })
        .filter(Boolean)
    : [];

  if (!careerSkills.length || !studentSkills.length) {
    return null;
  }

  const matchedSkills = careerSkills.filter((careerSkill) =>
    studentSkills.some(
      (studentSkill) =>
        studentSkill === careerSkill ||
        studentSkill.includes(careerSkill) ||
        careerSkill.includes(studentSkill)
    )
  );

  if (!matchedSkills.length) {
    return null;
  }

  return Math.min(
    98,
    Math.round((matchedSkills.length / careerSkills.length) * 100)
  );
};

function Careers() {
  const navigate = useNavigate();

  const [careers, setCareers] = useState([]);
  const [student, setStudent] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [careerResponse, studentResponse] =
          await Promise.all([
            fetch(`${API_URL}/careers`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),

            fetch(`${API_URL}/student/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        if (
          careerResponse.status === 401 ||
          studentResponse.status === 401
        ) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!careerResponse.ok) {
          throw new Error("Failed to load careers");
        }

        const careerData = await careerResponse.json();

        const studentData = studentResponse.ok
          ? await studentResponse.json()
          : null;

        const careerList = Array.isArray(careerData)
          ? careerData
          : careerData.careers || [];

        const uniqueCareers = Array.from(
          new Map(
            careerList
              .map((career) => [
                getCareerKey(career),
                career,
              ])
              .filter(([key]) => key)
          ).values()
        );

        setCareers(uniqueCareers);
        setStudent(
          studentData?.student || studentData
        );
      } catch (err) {
        console.error("Careers page error:", err);
        setError(
          "Unable to load career paths right now."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const categories = useMemo(() => {
    const values = careers
      .map((career) => career.category)
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean);

    return Array.from(new Set(values)).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [careers]);

  const targetRole = student?.targetRole;

  const filteredCareers = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = careers.filter((career) => {
      const careerCategory = String(
        career.category || ""
      ).trim();

      if (
        category !== "all" &&
        careerCategory !== category
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const skills = getCareerSkills(career);

      const searchableText = [
        career.title,
        career.name,
        career.canonicalTitle,
        career.description,
        career.category,
        career.normalizedTitle,
        ...skills,
        ...(Array.isArray(career.technologies)
          ? career.technologies
          : []),
        ...(Array.isArray(career.aliases)
          ? career.aliases
          : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    result = result.map((career) => ({
      ...career,
      matchScore: getCareerMatch(
        career,
        student
      ),
    }));

    if (sortBy === "recommended") {
      result.sort((a, b) => {
        const scoreA = a.matchScore ?? -1;
        const scoreB = b.matchScore ?? -1;

        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }

        return getCareerTitle(a).localeCompare(
          getCareerTitle(b)
        );
      });
    }

    if (sortBy === "a-z") {
      result.sort((a, b) =>
        getCareerTitle(a).localeCompare(
          getCareerTitle(b)
        )
      );
    }

    if (sortBy === "z-a") {
      result.sort((a, b) =>
        getCareerTitle(b).localeCompare(
          getCareerTitle(a)
        )
      );
    }

    return result;
  }, [
    careers,
    search,
    category,
    sortBy,
    student,
  ]);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setSortBy("recommended");
  };

  const hasFilters =
    search.trim() ||
    category !== "all" ||
    sortBy !== "recommended";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* =========================
            HEADER
        ========================= */}

        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>
              CAREER EXPLORATION
            </span>

            <h1>
              Find a career path that{" "}
              <span>fits you.</span>
            </h1>

            <p>
              Explore career paths, understand the
              skills they require, and discover what
              you can work on next.
            </p>
          </div>

          <div className={styles.headerBadge}>
            <Sparkles size={15} />
            <span>
              {careers.length} career paths
            </span>
          </div>
        </header>

        {/* =========================
            CURRENT GOAL
        ========================= */}

        {targetRole && (
          <div className={styles.goalCard}>
            <div className={styles.goalIcon}>
              <Target size={19} />
            </div>

            <div className={styles.goalContent}>
              <span>Your current career goal</span>

              <strong>{targetRole}</strong>
            </div>

            <div className={styles.goalMatch}>
              <CheckCircle2 size={15} />
              <span>Personalized recommendations</span>
            </div>

            <button
              type="button"
              className={styles.goalButton}
              onClick={() => navigate("/profile")}
            >
              Edit goal
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* =========================
            SEARCH + FILTERS
        ========================= */}

        <section className={styles.searchPanel}>
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <Search size={18} />

              <input
                type="text"
                placeholder="Search career paths, roles or skills..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className={styles.filterControl}>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                aria-label="Filter by category"
              >
                <option value="all">
                  All categories
                </option>

                {categories.map((item) => (
                  <option
                    value={item}
                    key={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterControl}>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                aria-label="Sort careers"
              >
                <option value="recommended">
                  Recommended
                </option>

                <option value="a-z">
                  A–Z
                </option>

                <option value="z-a">
                  Z–A
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* =========================
            RESULTS HEADER
        ========================= */}

        <div className={styles.resultsBar}>
          <div className={styles.resultsLeft}>
            <div>
              <h2>Career paths</h2>

              <p>
                {loading
                  ? "Finding career paths..."
                  : `${filteredCareers.length} ${
                      filteredCareers.length === 1
                        ? "career path"
                        : "career paths"
                    } available`}
              </p>
            </div>

            {targetRole && !loading && (
              <span className={styles.recommendedLabel}>
                <Sparkles size={13} />
                Matched to your goal
              </span>
            )}
          </div>

          {hasFilters && !loading && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* =========================
            LOADING SKELETON
        ========================= */}

        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <article
                  className={styles.skeletonCard}
                  key={index}
                >
                  <div
                    className={styles.skeletonTop}
                  >
                    <div
                      className={
                        styles.skeletonIcon
                      }
                    />

                    <div
                      className={
                        styles.skeletonCategory
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.skeletonTitle
                    }
                  />

                  <div
                    className={
                      styles.skeletonText
                    }
                  />

                  <div
                    className={`${styles.skeletonText} ${styles.short}`}
                  />

                  <div
                    className={`${styles.skeletonText} ${styles.shorter}`}
                  />

                  <div
                    className={
                      styles.skeletonSkills
                    }
                  >
                    <span
                      className={
                        styles.skeletonSkill
                      }
                    />

                    <span
                      className={
                        styles.skeletonSkill
                      }
                    />

                    <span
                      className={
                        styles.skeletonSkill
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.skeletonButton
                    }
                  />
                </article>
              )
            )}
          </div>
        )}

        {/* =========================
            ERROR
        ========================= */}

        {!loading && error && (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>
              <BriefcaseBusiness size={23} />
            </div>

            <h3>
              Couldn't load career paths
            </h3>

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
        )}

        {/* =========================
            EMPTY
        ========================= */}

        {!loading &&
          !error &&
          filteredCareers.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Search size={23} />
              </div>

              <h3>
                No career paths found
              </h3>

              <p>
                Try another role, technology,
                category, or career area.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

        {/* =========================
            CAREER GRID
        ========================= */}

        {!loading &&
          !error &&
          filteredCareers.length > 0 && (
            <div className={styles.grid}>
              {filteredCareers.map((career) => {
                const careerId =
                  career._id || career.id;

                const title =
                  getCareerTitle(career);

                const skills =
                  getCareerSkills(career);

                const matchScore =
                  career.matchScore;

                const isTargetCareer =
                  targetRole &&
                  normalizeText(title) ===
                    normalizeText(targetRole);

                return (
                  <article
                    className={styles.card}
                    key={careerId}
                  >
                    <div className={styles.cardTop}>
                      <div
                        className={styles.icon}
                      >
                        <BriefcaseBusiness
                          size={20}
                        />
                      </div>

                      <div
                        className={
                          styles.cardBadges
                        }
                      >
                        {isTargetCareer && (
                          <span
                            className={
                              styles.goalBadge
                            }
                          >
                            <Check size={11} />
                            Your goal
                          </span>
                        )}

                        {career.category && (
                          <span
                            className={
                              styles.category
                            }
                          >
                            {career.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={
                        styles.titleRow
                      }
                    >
                      <h3>{title}</h3>

                      {matchScore !== null &&
                        matchScore !== undefined && (
                          <span
                            className={
                              styles.matchScore
                            }
                          >
                            <Sparkles size={11} />
                            {matchScore}% match
                          </span>
                        )}
                    </div>

                    <p
                      className={
                        styles.description
                      }
                    >
                      {career.description ||
                        "Explore this career path and understand the skills, opportunities and next steps involved."}
                    </p>

                    {skills.length > 0 && (
                      <div
                        className={
                          styles.skills
                        }
                      >
                        {skills
                          .slice(0, 5)
                          .map((skill) => (
                            <span
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))}

                        {skills.length > 5 && (
                          <span>
                            +
                            {skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={
                        styles.cardFooter
                      }
                    >
                      <div
                        className={
                          styles.footerHint
                        }
                      >
                        <BriefcaseBusiness
                          size={13}
                        />

                        <span>
                          Explore skills &amp;
                          opportunities
                        </span>
                      </div>

                      <button
                        type="button"
                        className={
                          styles.viewButton
                        }
                        onClick={() =>
                          navigate(
                            `/careers/${careerId}`
                          )
                        }
                      >
                        Explore
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

export default Careers;