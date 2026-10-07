import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Loader2,
  MapPin,
  PlayCircle,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import styles from "./ActionPlan.module.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");
const getSkillName = (skill) => {
  if (typeof skill === "string") {
    return skill.trim();
  }

  if (skill && typeof skill === "object") {
    return (
      skill.name ||
      skill.skill ||
      skill.title ||
      ""
    ).trim();
  }

  return "";
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  const seen = new Set();

  return skills
    .map(getSkillName)
    .filter(Boolean)
    .filter((skill) => {
      const normalized = skill.toLowerCase();

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
};
async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      text || `Request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

const getStepTypeLabel = (type) => {
  const labels = {
    Profile: "Profile",
    Learn: "Learn",
    Build: "Build",
    Opportunities: "Opportunities",
    Apply: "Apply",
    Tracking: "Tracking",
  };

  return labels[type] || type || "Task";
};

const getStepIcon = (type) => {
  switch (type) {
    case "Profile":
      return UserRound;
    case "Learn":
      return GraduationCap;
    case "Build":
      return Code2;
    case "Opportunities":
      return BriefcaseBusiness;
    case "Apply":
      return Target;
    case "Tracking":
      return TrendingUp;
    default:
      return Circle;
  }
};

const getPriorityLabel = (priority) => {
  if (!priority) return "Medium";

  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1).toLowerCase()
  );
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case "high":
      return styles.priorityHigh;
    case "low":
      return styles.priorityLow;
    default:
      return styles.priorityMedium;
  }
};

function ActionPlan() {
  const navigate = useNavigate();

  const [actionPlan, setActionPlan] = useState(null);
  const [student, setStudent] = useState(null);
  const [career, setCareer] = useState(null);

  const [matchedSkills, setMatchedSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [relatedJobs, setRelatedJobs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updatingStepId, setUpdatingStepId] = useState(null);
  const [error, setError] = useState("");

  const fetchActionPlan = useCallback(async () => {
    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/student/action-plan`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await parseResponse(response);

      /*
       * Supports the existing backend response:
       *
       * {
       *   success: true,
       *   actionPlan,
       *   student,
       *   career,
       *   skillAnalysis,
       *   jobs
       * }
       *
       * It also tolerates:
       *
       * {
       *   success: true,
       *   data: {
       *     actionPlan,
       *     student,
       *     career,
       *     skillAnalysis,
       *     jobs
       *   }
       * }
       */

      const payload = result?.data || result;

      setActionPlan(payload?.actionPlan || null);
      setStudent(payload?.student || null);
      setCareer(payload?.career || null);

     setMatchedSkills(
  normalizeSkills(
    payload?.skillAnalysis?.matchedSkills
  )
);

setMissingSkills(
  normalizeSkills(
    payload?.skillAnalysis?.missingSkills
  )
);

      setRelatedJobs(payload?.jobs || []);
    } catch (err) {
      if (
        err?.message?.toLowerCase().includes("401") ||
        err?.message?.toLowerCase().includes("unauthorized")
      ) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      setError(err.message || "Unable to load your action plan.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchActionPlan();
  }, [fetchActionPlan]);

  const steps = useMemo(() => {
    const planSteps = Array.isArray(actionPlan?.steps)
      ? [...actionPlan.steps]
      : [];

    return planSteps.sort(
      (a, b) => Number(a.number || 0) - Number(b.number || 0)
    );
  }, [actionPlan]);

  const completedSteps = useMemo(
    () =>
      steps.filter((step) => step.status === "completed").length,
    [steps]
  );

  const totalSteps = steps.length;

  const progress = useMemo(() => {
    if (!totalSteps) return 0;

    return Math.round((completedSteps / totalSteps) * 100);
  }, [completedSteps, totalSteps]);

  const targetRole =
    student?.targetRole ||
    career?.canonicalTitle ||
    career?.title ||
    career?.targetRole ||
    "Your Career";

  const careerTitle =
    career?.canonicalTitle ||
    career?.title ||
    career?.targetRole ||
    student?.targetRole ||
    "Career Path";

  const handleStepToggle = async (step) => {
    const token = getToken();

    if (!token || !step?.id) return;

    const completed = step.status !== "completed";

    try {
      setUpdatingStepId(step.id);
      setError("");

      const response = await fetch(
        `${API_URL}/student/action-plan/steps/${encodeURIComponent(
          step.id
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed,
          }),
        }
      );

      const result = await parseResponse(response);
      const payload = result?.data || result;
      const updatedStep = payload?.step;

      if (updatedStep) {
        setActionPlan((current) => {
          if (!current) return current;

          return {
            ...current,
            steps: current.steps.map((currentStep) =>
              currentStep.id === updatedStep.id
                ? updatedStep
                : currentStep
            ),
          };
        });
      } else {
        await fetchActionPlan();
      }
    } catch (err) {
      setError(
        err.message || "Unable to update this action."
      );
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleStepOpen = (step) => {
    if (!step?.path) return;

    if (step.path.startsWith("/")) {
      navigate(step.path);
    }
  };

  const getEstimatedTime = (step) => {
    if (step?.estimatedHours == null) {
      return null;
    }

    if (Number(step.estimatedHours) === 1) {
      return "1 hour";
    }

    return `${step.estimatedHours} hours`;
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 className={styles.loadingIcon} size={28} />
          <p>Building your action plan...</p>
        </div>
      </main>
    );
  }

  if (error && !actionPlan) {
    return (
      <main className={styles.page}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>
            !
          </div>

          <h1>Unable to load your action plan</h1>

          <p>{error}</p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={fetchActionPlan}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!actionPlan) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <Target size={40} />

          <h1>No action plan yet</h1>

          <p>
            Complete your career profile first to create your
            personalized action plan.
          </p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => navigate("/profile")}
          >
            Complete profile
            <ArrowRight size={17} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {error && (
        <div className={styles.globalError}>
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>
              <Zap size={15} />
              PERSONALIZED CAREER ROADMAP
            </div>

            <h1>
              Your path to becoming a{" "}
              <span>{targetRole}</span>
            </h1>

            <p className={styles.heroDescription}>
              Follow your personalized action plan, build the right
              skills, and move closer to your career goal one step
              at a time.
            </p>

            <div className={styles.heroMeta}>
              <div className={styles.heroMetaItem}>
                <Target size={17} />
                <span>{careerTitle}</span>
              </div>

              {student?.preferredLocation && (
                <div className={styles.heroMetaItem}>
                  <MapPin size={17} />
                  <span>{student.preferredLocation}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.heroProgress}>
            <div className={styles.progressCircle}>
              <svg
                viewBox="0 0 120 120"
                className={styles.progressSvg}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className={styles.progressCircleTrack}
                />

                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className={styles.progressCircleValue}
                  style={{
                    strokeDashoffset:
                      326.73 -
                      (326.73 * progress) / 100,
                  }}
                />
              </svg>

              <div className={styles.progressCircleText}>
                <strong>{progress}%</strong>
                <span>complete</span>
              </div>
            </div>

            <div className={styles.heroProgressInfo}>
              <span className={styles.progressLabel}>
                YOUR PROGRESS
              </span>

              <strong>
                {completedSteps} of {totalSteps} steps
              </strong>

              <span>
                {progress === 100
                  ? "You've completed your plan."
                  : "Keep moving forward."}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statIconGreen}`}
            >
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>Completed</span>
              <strong>{completedSteps}</strong>
              <small>steps finished</small>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statIconBlue}`}
            >
              <Target size={21} />
            </div>

            <div>
              <span>Remaining</span>
              <strong>
                {Math.max(totalSteps - completedSteps, 0)}
              </strong>
              <small>steps left</small>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statIconOrange}`}
            >
              <Clock3 size={21} />
            </div>

            <div>
              <span>Estimated</span>
              <strong>
                {steps.reduce(
                  (total, step) =>
                    total +
                    (Number(step.estimatedHours) || 0),
                  0
                )}
                h
              </strong>
              <small>total effort</small>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statIconPurple}`}
            >
              <Trophy size={21} />
            </div>

            <div>
              <span>Progress</span>
              <strong>{progress}%</strong>
              <small>plan completion</small>
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className={styles.roadmapSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>
              YOUR ROADMAP
            </span>

            <h2>Follow the path</h2>

            <p>
              Complete each step to keep progressing toward your
              career goal.
            </p>
          </div>
        </div>

        {steps.length > 0 ? (
          <div className={styles.roadmap}>
            {steps.map((step, index) => {
              const isCompleted = step.status === "completed";
              const isCurrent =
                !isCompleted &&
                steps
                  .slice(0, index)
                  .every(
                    (previousStep) =>
                      previousStep.status === "completed"
                  );

              const Icon = getStepIcon(step.type);

              return (
                <div
                  key={step.id || `${step.number}-${index}`}
                  className={`${styles.roadmapItem} ${
                    isCompleted
                      ? styles.roadmapCompleted
                      : ""
                  } ${
                    isCurrent ? styles.roadmapCurrent : ""
                  }`}
                >
                  <div className={styles.roadmapNode}>
                    {isCompleted ? (
                      <Check size={17} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  <div className={styles.roadmapLine} />

                  <div className={styles.roadmapContent}>
                    <div className={styles.roadmapIcon}>
                      <Icon size={17} />
                    </div>

                    <span className={styles.roadmapType}>
                      {getStepTypeLabel(step.type)}
                    </span>

                    <h3>{step.title}</h3>

                    {step.description && (
                      <p>{step.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noSteps}>
            <Target size={26} />
            <p>Your action plan does not have any steps yet.</p>
          </div>
        )}
      </section>

      {/* MAIN CONTENT */}
      <section className={styles.contentSection}>
        <div className={styles.contentGrid}>
          {/* TASKS */}
          <div className={styles.tasksColumn}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionEyebrow}>
                  ACTION ITEMS
                </span>

                <h2>Your next steps</h2>

                <p>
                  Work through these tasks at your own pace.
                </p>
              </div>

              <div className={styles.taskCount}>
                {completedSteps}/{totalSteps}
              </div>
            </div>

            <div className={styles.tasksList}>
              {steps.map((step, index) => {
                const isCompleted =
                  step.status === "completed";

                const Icon = getStepIcon(step.type);

                const estimatedTime =
                  getEstimatedTime(step);

                return (
                  <article
                    key={step.id || `${step.number}-${index}`}
                    className={`${styles.taskCard} ${
                      isCompleted
                        ? styles.taskCompleted
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.taskCheck}
                      onClick={() =>
                        handleStepToggle(step)
                      }
                      disabled={
                        updatingStepId === step.id
                      }
                      aria-label={
                        isCompleted
                          ? "Mark task as incomplete"
                          : "Mark task as completed"
                      }
                    >
                      {updatingStepId === step.id ? (
                        <Loader2
                          size={17}
                          className={styles.spin}
                        />
                      ) : isCompleted ? (
                        <Check size={17} />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>

                    <div className={styles.taskBody}>
                      <div className={styles.taskTop}>
                        <div className={styles.taskType}>
                          <span className={styles.taskTypeIcon}>
                            <Icon size={14} />
                          </span>

                          <span>
                            {getStepTypeLabel(step.type)}
                          </span>
                        </div>

                        <span
                          className={`${styles.priority} ${getPriorityClass(
                            step.priority
                          )}`}
                        >
                          {getPriorityLabel(
                            step.priority
                          )}
                        </span>
                      </div>

                      <h3
                        className={
                          isCompleted
                            ? styles.completedTitle
                            : ""
                        }
                      >
                        {step.title}
                      </h3>

                      {step.description && (
                        <p className={styles.taskDescription}>
                          {step.description}
                        </p>
                      )}

                      {step.action && (
                        <div className={styles.actionBox}>
                          <Lightbulb size={15} />
                          <span>{step.action}</span>
                        </div>
                      )}

                      <div className={styles.taskFooter}>
                        <div className={styles.taskMeta}>
                          {estimatedTime && (
                            <span>
                              <Clock3 size={14} />
                              {estimatedTime}
                            </span>
                          )}

                          {step.relatedSkill && (
                            <span>
                              <Code2 size={14} />
                              {step.relatedSkill}
                            </span>
                          )}
                        </div>

                        {step.path && !isCompleted && (
                          <button
                            type="button"
                            className={styles.taskAction}
                            onClick={() =>
                              handleStepOpen(step)
                            }
                          >
                            Open
                            <ChevronRight size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            {/* SKILL GAP */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <div className={styles.sideCardIcon}>
                  <TrendingUp size={18} />
                </div>

                <div>
                  <span>SKILL ANALYSIS</span>
                  <h3>Your skill gap</h3>
                </div>
              </div>

              <div className={styles.skillSummary}>
                <div>
                  <strong>{matchedSkills.length}</strong>
                  <span>matched</span>
                </div>

                <div>
                  <strong>{missingSkills.length}</strong>
                  <span>to learn</span>
                </div>
              </div>

              {missingSkills.length > 0 && (
                <div className={styles.skillGroup}>
                  <span className={styles.skillGroupTitle}>
                    Skills to develop
                  </span>

                  <div className={styles.skillList}>
                    {missingSkills.map((skill) => (
                      <span
                        className={styles.missingSkill}
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchedSkills.length > 0 && (
                <div className={styles.skillGroup}>
                  <span className={styles.skillGroupTitle}>
                    Skills you already have
                  </span>

                  <div className={styles.skillList}>
                    {matchedSkills.map((skill) => (
                      <span
                        className={styles.matchedSkill}
                        key={skill}
                      >
                        <Check size={12} />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                className={styles.sideButton}
                onClick={() => navigate("/skill-gap")}
              >
                View skill gap
                <ArrowRight size={15} />
              </button>
            </div>

            {/* CAREER */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <div className={styles.sideCardIcon}>
                  <GraduationCap size={18} />
                </div>

                <div>
                  <span>CAREER PATH</span>
                  <h3>{careerTitle}</h3>
                </div>
              </div>

              {career?.description && (
                <p className={styles.careerDescription}>
                  {career.description}
                </p>
              )}

              <button
                type="button"
                className={styles.sideButton}
                onClick={() => navigate("/careers")}
              >
                Explore careers
                <ArrowRight size={15} />
              </button>
            </div>

            {/* OPPORTUNITIES */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <div className={styles.sideCardIcon}>
                  <BriefcaseBusiness size={18} />
                </div>

                <div>
                  <span>OPPORTUNITIES</span>
                  <h3>Keep exploring</h3>
                </div>
              </div>

              <p className={styles.sideDescription}>
                Find opportunities that match your career path
                and skills.
              </p>

              {relatedJobs.length > 0 && (
                <div className={styles.jobCount}>
                  <strong>{relatedJobs.length}</strong>
                  <span>
                    related {relatedJobs.length === 1
                      ? "opportunity"
                      : "opportunities"}{" "}
                    found
                  </span>
                </div>
              )}

              <button
                type="button"
                className={styles.sideButton}
                onClick={() => navigate("/jobs")}
              >
                Browse jobs
                <ExternalLink size={15} />
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default ActionPlan;