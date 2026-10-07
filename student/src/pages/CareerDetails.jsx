import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  MapPin,
  Route,
  Sparkles,
  Target,
} from "lucide-react";

import styles from "./CareerDetails.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const normalizeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        return (
          item.name ||
          item.title ||
          item.skill ||
          item.value ||
          ""
        );
      }

      return "";
    })
    .map((item) => String(item).trim())
    .filter(Boolean);
};

const getCareerSkills = (career) => {
  return normalizeArray(career?.skills || career?.requiredSkills);
};

const getTechnologies = (career) => {
  return normalizeArray(career?.technologies);
};

const getProjects = (career) => {
  return normalizeArray(
    career?.projects || career?.projectTypes
  );
};

const getRoadmap = (career) => {
  return normalizeArray(career?.roadmap);
};

const getLearningTopics = (career) => {
  return normalizeArray(career?.learningTopics);
};

const getTitle = (career) => {
  return (
    career?.canonicalTitle ||
    career?.title ||
    career?.name ||
    "Career Path"
  );
};

const getCategory = (career) => {
  return career?.category || "Career Path";
};

const getDescription = (career) => {
  return (
    career?.description ||
    "Explore this career path, understand the skills it requires, and follow a practical roadmap to build toward it."
  );
};

const getAliases = (career) => {
  return normalizeArray(career?.aliases);
};

function CareerDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [career, setCareer] = useState(null);
  const [student, setStudent] = useState(null);
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

        const requests = [
          fetch(`${API_URL}/careers/${id}`),
          fetch(`${API_URL}/student/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ];

        const [careerResponse, studentResponse] =
          await Promise.all(requests);

        if (studentResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!careerResponse.ok) {
          if (careerResponse.status === 404) {
            throw new Error("Career path not found.");
          }

          throw new Error("Failed to load career path.");
        }

        const careerData = await careerResponse.json();
        const studentData = studentResponse.ok
          ? await studentResponse.json()
          : null;

        const careerResult =
          careerData?.career ||
          careerData?.data?.career ||
          careerData?.data ||
          careerData;

        const studentResult =
          studentData?.student ||
          studentData?.data?.student ||
          studentData?.data ||
          studentData;

        setCareer(careerResult);
        setStudent(studentResult);
      } catch (err) {
        console.error("Career details error:", err);
        setError(
          err.message || "Unable to load this career path right now."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const skills = useMemo(
    () => getCareerSkills(career),
    [career]
  );

  const technologies = useMemo(
    () => getTechnologies(career),
    [career]
  );

  const projects = useMemo(
    () => getProjects(career),
    [career]
  );

  const roadmap = useMemo(
    () => getRoadmap(career),
    [career]
  );

  const learningTopics = useMemo(
    () => getLearningTopics(career),
    [career]
  );

  const aliases = useMemo(
    () => getAliases(career),
    [career]
  );

  const title = getTitle(career);
  const category = getCategory(career);
  const description = getDescription(career);

  const studentSkills = useMemo(
    () => normalizeArray(student?.skills),
    [student]
  );

  const matchedSkills = useMemo(() => {
    if (!skills.length || !studentSkills.length) {
      return [];
    }

    const studentSkillSet = new Set(
      studentSkills.map((skill) =>
        skill.toLowerCase()
      )
    );

    return skills.filter((skill) =>
      studentSkillSet.has(skill.toLowerCase())
    );
  }, [skills, studentSkills]);

  const missingSkills = useMemo(() => {
    if (!skills.length) {
      return [];
    }

    const studentSkillSet = new Set(
      studentSkills.map((skill) =>
        skill.toLowerCase()
      )
    );

    return skills.filter(
      (skill) => !studentSkillSet.has(skill.toLowerCase())
    );
  }, [skills, studentSkills]);

  const matchPercentage = useMemo(() => {
    if (!skills.length || !studentSkills.length) {
      return null;
    }

    return Math.round(
      (matchedSkills.length / skills.length) * 100
    );
  }, [skills, studentSkills, matchedSkills]);

  const handleActionPlan = () => {
    navigate("/action-plan");
  };

  const handleJobs = () => {
    navigate("/jobs");
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.loader} />
          <p>Loading career path...</p>
        </div>
      </div>
    );
  }

  if (error || !career) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <BriefcaseBusiness size={30} />

          <h2>Unable to load career</h2>

          <p>
            {error ||
              "The requested career path could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/careers")}
            className={styles.primaryButton}
          >
            <ArrowLeft size={17} />
            Back to careers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.backgroundGlow} />
      <div className={styles.backgroundGlowTwo} />

      <div className={styles.container}>
        <div className={styles.topbar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/careers")}
          >
            <ArrowLeft size={17} />
            Career paths
          </button>

          <span className={styles.typeBadge}>
            {career.type === "career_profile"
              ? "AI discovered"
              : "Career path"}
          </span>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroDecoration}>
            <div />
            <div />
            <div />
          </div>

          <div className={styles.heroMain}>
            <div className={styles.heroIcon}>
              <BriefcaseBusiness size={27} />
            </div>

            <div className={styles.heroContent}>
              <div className={styles.heroMeta}>
                <span className={styles.categoryBadge}>
                  {category}
                </span>

                {career.source && (
                  <span className={styles.sourceBadge}>
                    <Sparkles size={13} />
                    {career.source}
                  </span>
                )}
              </div>

              <h1>{title}</h1>

              <p>{description}</p>

              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.heroPrimary}
                  onClick={handleActionPlan}
                >
                  <Target size={17} />
                  View action plan
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className={styles.heroSecondary}
                  onClick={handleJobs}
                >
                  Explore jobs
                  <ExternalLink size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <Code2 size={17} />
              <div>
                <strong>{skills.length}</strong>
                <span>Required skills</span>
              </div>
            </div>

            <div className={styles.heroStat}>
              <BookOpen size={17} />
              <div>
                <strong>{technologies.length}</strong>
                <span>Technologies</span>
              </div>
            </div>

            <div className={styles.heroStat}>
              <Route size={17} />
              <div>
                <strong>{roadmap.length}</strong>
                <span>Roadmap steps</span>
              </div>
            </div>

            <div className={styles.heroStat}>
              <Lightbulb size={17} />
              <div>
                <strong>{projects.length}</strong>
                <span>Project ideas</span>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.layout}>
          <main className={styles.main}>
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <div className={styles.sectionIcon}>
                  <BriefcaseBusiness size={18} />
                </div>

                <div>
                  <h2>Career overview</h2>
                  <p>Understand what this career involves.</p>
                </div>
              </div>

              <p className={styles.overviewText}>
                {description}
              </p>

              {aliases.length > 0 && (
                <div className={styles.aliasBlock}>
                  <span>Also known as</span>

                  <div className={styles.tagList}>
                    {aliases.map((alias) => (
                      <span key={alias}>{alias}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {skills.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIcon}>
                    <Code2 size={18} />
                  </div>

                  <div>
                    <h2>Required skills</h2>
                    <p>
                      Core skills that matter for this career.
                    </p>
                  </div>
                </div>

                <div className={styles.skillGrid}>
                  {skills.map((skill) => {
                    const matched = matchedSkills.some(
                      (item) =>
                        item.toLowerCase() ===
                        skill.toLowerCase()
                    );

                    return (
                      <div
                        className={`${styles.skillCard} ${
                          matched
                            ? styles.skillMatched
                            : ""
                        }`}
                        key={skill}
                      >
                        <div className={styles.skillDot}>
                          {matched ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <Code2 size={15} />
                          )}
                        </div>

                        <span>{skill}</span>

                        {matched && (
                          <small>Matched</small>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {technologies.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIcon}>
                    <Code2 size={18} />
                  </div>

                  <div>
                    <h2>Technologies</h2>
                    <p>
                      Tools and technologies commonly used.
                    </p>
                  </div>
                </div>

                <div className={styles.techGrid}>
                  {technologies.map((technology) => (
                    <div
                      className={styles.techCard}
                      key={technology}
                    >
                      <Code2 size={16} />
                      <span>{technology}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {projects.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIcon}>
                    <Lightbulb size={18} />
                  </div>

                  <div>
                    <h2>Project ideas</h2>
                    <p>
                      Practical projects you can build to develop
                      relevant experience.
                    </p>
                  </div>
                </div>

                <div className={styles.projectGrid}>
                  {projects.map((project, index) => (
                    <div
                      className={styles.projectCard}
                      key={`${project}-${index}`}
                    >
                      <span className={styles.projectNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div>
                        <strong>{project}</strong>
                        <p>
                          Build this as part of your portfolio and
                          use it to demonstrate relevant skills.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {learningTopics.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIcon}>
                    <BookOpen size={18} />
                  </div>

                  <div>
                    <h2>Learning topics</h2>
                    <p>
                      Areas worth studying while preparing for this
                      career.
                    </p>
                  </div>
                </div>

                <div className={styles.topicGrid}>
                  {learningTopics.map((topic) => (
                    <div
                      className={styles.topicCard}
                      key={topic}
                    >
                      <CheckCircle2 size={16} />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {roadmap.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIcon}>
                    <Route size={18} />
                  </div>

                  <div>
                    <h2>Career roadmap</h2>
                    <p>
                      A practical sequence for progressing toward
                      this career.
                    </p>
                  </div>
                </div>

                <div className={styles.roadmap}>
                  {roadmap.map((step, index) => (
                    <div
                      className={styles.roadmapItem}
                      key={`${step}-${index}`}
                    >
                      <div className={styles.roadmapMarker}>
                        {index + 1}
                      </div>

                      <div className={styles.roadmapContent}>
                        <span>
                          STEP{" "}
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <strong>{step}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className={styles.sidebar}>
            {matchPercentage !== null && (
              <section className={styles.matchCard}>
                <div className={styles.matchTop}>
                  <div>
                    <span>Your profile fit</span>
                    <strong>{matchPercentage}%</strong>
                  </div>

                  <div
                    className={styles.matchRing}
                    style={{
                      "--progress": `${matchPercentage * 3.6}deg`,
                    }}
                  >
                    <div>
                      <span>{matchPercentage}</span>
                      <small>%</small>
                    </div>
                  </div>
                </div>

                <div className={styles.matchBar}>
                  <div
                    style={{
                      width: `${matchPercentage}%`,
                    }}
                  />
                </div>

                <p>
                  {matchedSkills.length > 0
                    ? `${matchedSkills.length} of ${skills.length} required skills match your profile.`
                    : "Add relevant skills to your profile to improve this match."}
                </p>

                {missingSkills.length > 0 && (
                  <div className={styles.missingSkills}>
                    <span>Skills to develop</span>

                    <div>
                      {missingSkills
                        .slice(0, 5)
                        .map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}

                      {missingSkills.length > 5 && (
                        <span>
                          +{missingSkills.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className={styles.sideCard}>
              <div className={styles.sideHeading}>
                <Sparkles size={17} />
                <h3>Career snapshot</h3>
              </div>

              <div className={styles.sideList}>
                <div>
                  <span>Category</span>
                  <strong>{category}</strong>
                </div>

                <div>
                  <span>Required skills</span>
                  <strong>{skills.length}</strong>
                </div>

                <div>
                  <span>Technologies</span>
                  <strong>{technologies.length}</strong>
                </div>

                <div>
                  <span>Project ideas</span>
                  <strong>{projects.length}</strong>
                </div>

                <div>
                  <span>Roadmap stages</span>
                  <strong>{roadmap.length}</strong>
                </div>
              </div>
            </section>

            <section className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <GraduationCap size={20} />
              </div>

              <h3>Ready to work toward this career?</h3>

              <p>
                Review your action plan and identify the next
                practical steps for your profile.
              </p>

              <button
                type="button"
                onClick={handleActionPlan}
              >
                Open action plan
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className={styles.secondaryAction}
                onClick={handleJobs}
              >
                Find relevant jobs
              </button>
            </section>

            <section className={styles.sideCard}>
              <div className={styles.sideHeading}>
                <MapPin size={17} />
                <h3>Your goal</h3>
              </div>

              <p className={styles.goalText}>
                {student?.targetRole
                  ? student.targetRole
                  : "No career goal has been set yet."}
              </p>

              <button
                type="button"
                className={styles.profileLink}
                onClick={() => navigate("/profile")}
              >
                Update profile
                <ArrowRight size={15} />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CareerDetails;