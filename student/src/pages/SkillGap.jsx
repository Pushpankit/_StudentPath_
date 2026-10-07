import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code2,
  Target,
  TrendingUp,
  UserRound,
  XCircle,
} from "lucide-react";
import styles from "./SkillGap.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._/-]+/g, " ")
    .replace(/\s+/g, " ");

const getSkillName = (skill) => {
  if (!skill) return "";

  if (typeof skill === "string") return skill.trim();

  if (typeof skill === "object") {
    return String(
      skill.name ||
        skill.skill ||
        skill.title ||
        skill.value ||
        ""
    ).trim();
  }

  return "";
};

const normalizeSkills = (skills = []) =>
  skills
    .map(getSkillName)
    .filter(Boolean)
    .filter(
      (skill, index, array) =>
        array.findIndex((item) => normalize(item) === normalize(skill)) === index
    );

const getCareerTitle = (career) =>
  career?.canonicalTitle ||
  career?.title ||
  career?.name ||
  "Your Career";

const getCareerSkills = (career) => {
  if (!career) return [];

  const skills = [
    ...(career.requiredSkills || []),
    ...(career.skills || []),
  ];

  return normalizeSkills(skills);
};

const getCareerPreferredSkills = (career) => {
  if (!career) return [];

  return normalizeSkills([
    ...(career.preferredSkills || []),
    ...(career.preferred || []),
  ]);
};

const getSkillImportance = (career, skill) => {
  const normalizedSkill = normalize(skill);

  const allSkillObjects = [
    ...(career?.skills || []),
    ...(career?.requiredSkills || []),
    ...(career?.preferredSkills || []),
  ];

  const match = allSkillObjects.find(
    (item) =>
      typeof item === "object" &&
      normalize(getSkillName(item)) === normalizedSkill
  );

  if (match?.importance) {
    const importance = String(match.importance).toLowerCase();

    if (importance.includes("required") || importance.includes("high")) {
      return "High";
    }

    if (importance.includes("preferred") || importance.includes("medium")) {
      return "Medium";
    }

    if (importance.includes("low")) {
      return "Low";
    }
  }

  return "High";
};

const getPriority = (career, skill) => {
  const importance = getSkillImportance(career, skill);

  if (importance === "High") return "High";
  if (importance === "Medium") return "Medium";

  return "Low";
};

const findCareerForStudent = (careers, student) => {
  if (!Array.isArray(careers) || !careers.length) return null;

  const careerId =
    typeof student?.careerPath === "object"
      ? student.careerPath?._id
      : student?.careerPath;

  const profileId =
    typeof student?.careerProfile === "object"
      ? student.careerProfile?._id
      : student?.careerProfile;

  if (careerId) {
    const byId = careers.find(
      (career) => String(career._id) === String(careerId)
    );

    if (byId) return byId;
  }

  if (profileId) {
    const byId = careers.find(
      (career) => String(career._id) === String(profileId)
    );

    if (byId) return byId;
  }

  const targetRole = normalize(
    student?.targetRole ||
      student?.careerGoal ||
      student?.goal ||
      ""
  );

  if (!targetRole) return null;

  return (
    careers.find((career) => {
      const title = normalize(getCareerTitle(career));

      const aliases = (career.aliases || []).map(normalize);

      return (
        title === targetRole ||
        aliases.includes(targetRole) ||
        title.includes(targetRole) ||
        targetRole.includes(title)
      );
    }) || null
  );
};

const getMatchColorClass = (score, styles) => {
  if (score >= 80) return styles.scoreGood;
  if (score >= 60) return styles.scoreMedium;
  return styles.scoreLow;
};

const SkillsGap = () => {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSkillsGap = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [studentResponse, careersResponse] = await Promise.all([
          fetch(`${API_URL}/student/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/careers`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (studentResponse.status === 401 || careersResponse.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!studentResponse.ok) {
          throw new Error("Unable to load your profile.");
        }

        if (!careersResponse.ok) {
          throw new Error("Unable to load career information.");
        }

        const studentJson = await studentResponse.json();
        const careersJson = await careersResponse.json();

        const studentData =
          studentJson?.data?.student ||
          studentJson?.data ||
          studentJson?.student ||
          studentJson;

        const careersData =
          careersJson?.data?.careers ||
          careersJson?.careers ||
          careersJson?.data ||
          [];

        setStudent(studentData);
        setCareer(findCareerForStudent(careersData, studentData));
      } catch (err) {
        console.error("Skills gap loading error:", err);
        setError(err.message || "Unable to load skills gap.");
      } finally {
        setLoading(false);
      }
    };

    loadSkillsGap();
  }, [navigate]);

  const currentSkills = useMemo(
    () => normalizeSkills(student?.skills || []),
    [student]
  );

  const requiredSkills = useMemo(
    () => getCareerSkills(career),
    [career]
  );

  const preferredSkills = useMemo(
    () => getCareerPreferredSkills(career),
    [career]
  );

  const matchedSkills = useMemo(() => {
    const current = new Set(currentSkills.map(normalize));

    return requiredSkills.filter((skill) => current.has(normalize(skill)));
  }, [currentSkills, requiredSkills]);

  const missingSkills = useMemo(() => {
    const current = new Set(currentSkills.map(normalize));

    return requiredSkills.filter(
      (skill) => !current.has(normalize(skill))
    );
  }, [currentSkills, requiredSkills]);

  const matchedPreferredSkills = useMemo(() => {
    const current = new Set(currentSkills.map(normalize));

    return preferredSkills.filter((skill) =>
      current.has(normalize(skill))
    );
  }, [currentSkills, preferredSkills]);

  const missingPreferredSkills = useMemo(() => {
    const current = new Set(currentSkills.map(normalize));

    return preferredSkills.filter(
      (skill) => !current.has(normalize(skill))
    );
  }, [currentSkills, preferredSkills]);

  const matchPercentage = useMemo(() => {
    if (!requiredSkills.length) {
      if (!preferredSkills.length) return 0;

      return Math.round(
        (matchedPreferredSkills.length / preferredSkills.length) * 100
      );
    }

    return Math.round(
      (matchedSkills.length / requiredSkills.length) * 100
    );
  }, [
    requiredSkills,
    preferredSkills,
    matchedSkills,
    matchedPreferredSkills,
  ]);

  const prioritySkills = useMemo(() => {
    return [...missingSkills].sort((a, b) => {
      const priorityOrder = {
        High: 0,
        Medium: 1,
        Low: 2,
      };

      return (
        priorityOrder[getPriority(career, a)] -
        priorityOrder[getPriority(career, b)]
      );
    });
  }, [missingSkills, career]);

  const technologyGaps = useMemo(() => {
    const technologies = normalizeSkills(career?.technologies || []);
    const current = new Set(currentSkills.map(normalize));

    return technologies.filter((technology) => !current.has(normalize(technology)));
  }, [career, currentSkills]);

  const scoreClass = getMatchColorClass(matchPercentage, styles);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <h2>Analyzing your skills</h2>
          <p>
            Comparing your profile with the requirements of your target career.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <CircleAlert size={34} />
          <h2>Could not load skill gap</h2>
          <p>{error}</p>
          <button
            className={styles.primaryButton}
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!career) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>
            <Target size={30} />
          </div>

          <h2>Set your target career first</h2>

          <p>
            We need a target career to compare your current skills against
            the skills required for that career.
          </p>

          <button
            className={styles.primaryButton}
            onClick={() => navigate("/profile")}
          >
            Update profile
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroGlowOne} />
          <div className={styles.heroGlowTwo} />

          <div className={styles.heroContent}>
            <div className={styles.breadcrumb}>
              <span>Career</span>
              <ChevronRight size={14} />
              <span>Skills Gap</span>
            </div>

            <div className={styles.heroTop}>
              <div>
                <div className={styles.eyebrow}>
                  <Target size={15} />
                  Career readiness
                </div>

                <h1>Skills Gap</h1>

                <p>
                  See where your current skills stand against the requirements
                  for <strong>{getCareerTitle(career)}</strong>.
                </p>
              </div>

              <div className={`${styles.scoreCard} ${scoreClass}`}>
                <div className={styles.scoreRing}>
                  <span>{matchPercentage}%</span>
                </div>

                <div>
                  <small>Skill match</small>
                  <strong>
                    {matchPercentage >= 80
                      ? "Strong match"
                      : matchPercentage >= 60
                      ? "Good progress"
                      : "Needs improvement"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.layout}>
          <main className={styles.mainColumn}>
            <section className={styles.overviewGrid}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.greenIcon}`}>
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <span>Matched skills</span>
                  <strong>
                    {matchedSkills.length}
                    <small> / {requiredSkills.length}</small>
                  </strong>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.redIcon}`}>
                  <XCircle size={19} />
                </div>

                <div>
                  <span>Missing skills</span>
                  <strong>{missingSkills.length}</strong>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.blueIcon}`}>
                  <Code2 size={19} />
                </div>

                <div>
                  <span>Your skills</span>
                  <strong>{currentSkills.length}</strong>
                </div>
              </div>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.sectionIcon}>
                    <CircleAlert size={18} />
                  </div>

                  <div>
                    <h2>Skills you need</h2>
                    <p>
                      Focus on these skills to improve your career match.
                    </p>
                  </div>
                </div>

                <span className={styles.countBadge}>
                  {missingSkills.length}
                </span>
              </div>

              {prioritySkills.length ? (
                <div className={styles.skillGrid}>
                  {prioritySkills.map((skill) => {
                    const priority = getPriority(career, skill);

                    return (
                      <div className={styles.missingSkill} key={skill}>
                        <div className={styles.skillMain}>
                          <div className={styles.missingDot}>
                            <XCircle size={15} />
                          </div>

                          <div>
                            <strong>{skill}</strong>
                            <span>Required for {getCareerTitle(career)}</span>
                          </div>
                        </div>

                        <span
                          className={`${styles.priorityBadge} ${
                            priority === "High"
                              ? styles.priorityHigh
                              : priority === "Medium"
                              ? styles.priorityMedium
                              : styles.priorityLow
                          }`}
                        >
                          {priority}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.successMessage}>
                  <CheckCircle2 size={22} />
                  <div>
                    <strong>No required skill gaps</strong>
                    <p>
                      You currently have all the required skills listed for
                      this career.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {preferredSkills.length > 0 && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={`${styles.sectionIcon} ${styles.blueSectionIcon}`}>
                      <TrendingUp size={18} />
                    </div>

                    <div>
                      <h2>Preferred skills</h2>
                      <p>
                        These can strengthen your profile but are not core
                        requirements.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.chipGrid}>
                  {preferredSkills.map((skill) => {
                    const matched = matchedPreferredSkills.some(
                      (item) => normalize(item) === normalize(skill)
                    );

                    return (
                      <div
                        className={`${styles.skillChip} ${
                          matched
                            ? styles.skillChipMatched
                            : styles.skillChipMissing
                        }`}
                        key={skill}
                      >
                        {matched ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <XCircle size={15} />
                        )}
                        {skill}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={`${styles.sectionIcon} ${styles.greenSectionIcon}`}>
                    <CheckCircle2 size={18} />
                  </div>

                  <div>
                    <h2>Your matched skills</h2>
                    <p>
                      Skills from your profile that already match the career.
                    </p>
                  </div>
                </div>

                <span className={styles.successCount}>
                  {matchedSkills.length} matched
                </span>
              </div>

              {matchedSkills.length ? (
                <div className={styles.chipGrid}>
                  {matchedSkills.map((skill) => (
                    <div
                      className={`${styles.skillChip} ${styles.skillChipMatched}`}
                      key={skill}
                    >
                      <CheckCircle2 size={15} />
                      {skill}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.mutedMessage}>
                  <p>
                    No required skills currently match your profile.
                  </p>
                </div>
              )}
            </section>

            {technologyGaps.length > 0 && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={`${styles.sectionIcon} ${styles.purpleSectionIcon}`}>
                      <Code2 size={18} />
                    </div>

                    <div>
                      <h2>Technology gaps</h2>
                      <p>
                        Tools and technologies associated with this career
                        that are not in your profile.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.chipGrid}>
                  {technologyGaps.map((technology) => (
                    <div
                      className={`${styles.skillChip} ${styles.techChip}`}
                      key={technology}
                    >
                      <Code2 size={15} />
                      {technology}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className={styles.sidebar}>
            <section className={styles.profileCard}>
              <div className={styles.profileHeader}>
                <div className={styles.avatar}>
                  <UserRound size={21} />
                </div>

                <div>
                  <span>Your profile</span>
                  <strong>{student?.name || "Student"}</strong>
                </div>
              </div>

              <div className={styles.profileStats}>
                <div>
                  <span>Current skills</span>
                  <strong>{currentSkills.length}</strong>
                </div>

                <div>
                  <span>Career match</span>
                  <strong>{matchPercentage}%</strong>
                </div>
              </div>

              <button
                className={styles.secondaryButton}
                onClick={() => navigate("/profile")}
              >
                Edit profile
                <ArrowRight size={16} />
              </button>
            </section>

            <section className={styles.careerCard}>
              <div className={styles.careerCardTop}>
                <div className={styles.careerIcon}>
                  <Target size={20} />
                </div>

                <span>Target career</span>
              </div>

              <h3>{getCareerTitle(career)}</h3>

              {career?.category && (
                <span className={styles.categoryBadge}>
                  {career.category}
                </span>
              )}

              {career?.description && (
                <p>
                  {String(career.description).length > 145
                    ? `${String(career.description).slice(0, 145)}...`
                    : career.description}
                </p>
              )}

              <button
                className={styles.textButton}
                onClick={() => navigate(`/careers/${career._id}`)}
              >
                View career
                <ArrowRight size={15} />
              </button>
            </section>

            <section className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <BookOpen size={21} />
              </div>

              <div>
                <h3>Close your skill gaps</h3>
                <p>
                  Turn your missing skills into concrete learning and project
                  tasks with your action plan.
                </p>
              </div>

              <button
                className={styles.primaryButton}
                onClick={() => navigate("/action-plan")}
              >
                Open action plan
                <ArrowRight size={16} />
              </button>
            </section>

            <section className={styles.tipCard}>
              <div className={styles.tipIcon}>
                <TrendingUp size={18} />
              </div>

              <div>
                <strong>Focus on high-priority skills first</strong>
                <p>
                  Building one required skill properly is usually more useful
                  than adding several shallow skills to your profile.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default SkillsGap;