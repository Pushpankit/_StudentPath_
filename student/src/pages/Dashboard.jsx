import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileText,
  GraduationCap,
  MapPin,
  PlayCircle,
  Rocket,
  Search,
  Target,
  TrendingUp,
  UserRound,
  Bookmark,
  XCircle,
} from "lucide-react";
import styles from "./Dashboard.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("accessToken");

const getData = (response) => {
  if (!response) return null;

  if (response.data !== undefined) {
    return response.data;
  }

  return response;
};

const getArray = (response, keys = []) => {
  const data = getData(response);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};

const getStudentData = (response) => {
  const data = getData(response);

  return (
    data?.student ||
    data?.profile ||
    data?.user?.student ||
    data?.user ||
    data ||
    {}
  );
};

const getApplicationStatus = (application) =>
  application?.status ||
  application?.applicationStatus ||
  application?.state ||
  "Applied";

const getJobFromApplication = (application) =>
  application?.job ||
  application?.jobId ||
  application?.jobData ||
  application?.position ||
  {};

const getJobTitle = (job) =>
  job?.title ||
  job?.jobTitle ||
  job?.role ||
  job?.position ||
  "Untitled position";

const getCompanyName = (job) =>
  job?.company?.name ||
  job?.companyName ||
  job?.company?.companyName ||
  "Company";

const getLocation = (job) => {
  if (job?.location && typeof job.location === "string") {
    return job.location;
  }

  return (
    job?.location?.city ||
    job?.structuredLocation?.city ||
    job?.city ||
    job?.workplaceType ||
    "Location not specified"
  );
};

const getStepStatus = (step) =>
  String(step?.status || "").toLowerCase() === "completed";

const getStepTitle = (step) =>
  step?.title ||
  step?.action ||
  step?.description ||
  "Complete your next task";

const getSkillName = (skill) => {
  if (!skill) return "";

  if (typeof skill === "string") return skill;

  return (
    skill.name ||
    skill.skill ||
    skill.title ||
    skill.label ||
    ""
  );
};

const normalizeSkills = (skills) =>
  Array.isArray(skills)
    ? skills.map(getSkillName).filter(Boolean)
    : [];

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "Student") => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "ST";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const clamp = (value, min, max) =>
  Math.min(Math.max(Number(value) || 0, min), max);

const calculateProfileCompletion = (student) => {
  if (typeof student?.profileCompletion === "number") {
    return clamp(student.profileCompletion, 0, 100);
  }

  if (typeof student?.profileCompletionPercentage === "number") {
    return clamp(student.profileCompletionPercentage, 0, 100);
  }

  if (typeof student?.profileCompleted === "boolean") {
    if (student.profileCompleted) return 100;
  }

  const checks = [
    Boolean(student?.name),
    Boolean(student?.college || student?.university),
    Boolean(student?.degree),
    Boolean(student?.branch),
    Boolean(student?.graduationYear),
    Boolean(student?.city || student?.location),
    Boolean(student?.targetRole),
    Boolean(student?.opportunityType),
    Boolean(student?.workMode || student?.workPreference),
    normalizeSkills(student?.skills).length > 0,
    Array.isArray(student?.projects) && student.projects.length > 0,
    Boolean(student?.resumeUrl || student?.resume?.fileName),
  ];

  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100
  );
};

const getCareerName = (student) =>
  student?.targetRole ||
  student?.careerProfile?.canonicalTitle ||
  student?.careerProfile?.title ||
  student?.careerPath?.title ||
  "Choose a career goal";

const getActionPlanSteps = (plan) => {
  if (!plan) return [];

  return Array.isArray(plan?.steps)
    ? plan.steps
    : Array.isArray(plan?.plan?.steps)
      ? plan.plan.steps
      : [];
};

const getActionPlan = (response) => {
  const data = getData(response);

  return data?.actionPlan || data?.plan || data || null;
};

const getProgress = (steps) => {
  if (!steps.length) return 0;

  const completed = steps.filter(getStepStatus).length;

  return Math.round((completed / steps.length) * 100);
};

const getApplicationClass = (status) => {
  const normalized = String(status).toLowerCase();

  if (
    normalized.includes("reject") ||
    normalized.includes("decline") ||
    normalized.includes("closed")
  ) {
    return "danger";
  }

  if (
    normalized.includes("interview") ||
    normalized.includes("selected") ||
    normalized.includes("offer")
  ) {
    return "success";
  }

  if (
    normalized.includes("review") ||
    normalized.includes("short")
  ) {
    return "warning";
  }

  return "neutral";
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const fetchStudent = async () => {
      try {
        const response = await fetch(`${API_URL}/student/me`, {
          headers,
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("accessToken");

          navigate("/login", { replace: true });
          return;
        }

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || "Unable to load profile.");
        }

        setStudent(getStudentData(json));
      } catch (err) {
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    const fetchActionPlan = async () => {
      try {
        const response = await fetch(`${API_URL}/student/action-plan`, {
          headers,
        });

        if (response.status === 404) {
          setActionPlan(null);
          return;
        }

        if (!response.ok) return;

        const json = await response.json();
        setActionPlan(getActionPlan(json));
      } catch {
        // Dashboard should remain usable if action plan is unavailable.
      }
    };

    const fetchApplications = async () => {
      try {
        const response = await fetch(`${API_URL}/applications`, {
          headers,
        });

        if (!response.ok) return;

        const json = await response.json();

        const data = getArray(json, [
          "applications",
          "items",
          "results",
        ]);

        setApplications(data);
      } catch {
        setApplications([]);
      } finally {
        setApplicationsLoading(false);
      }
    };

    const fetchSavedJobs = async () => {
      try {
        const response = await fetch(`${API_URL}/saved-jobs`, {
          headers,
        });

        if (!response.ok) return;

        const json = await response.json();

        const data = getArray(json, [
          "savedJobs",
          "jobs",
          "items",
          "results",
        ]);

        setSavedJobs(data);
      } catch {
        setSavedJobs([]);
      } finally {
        setSavedLoading(false);
      }
    };

    fetchStudent();
    fetchActionPlan();
    fetchApplications();
    fetchSavedJobs();
  }, [navigate]);

  const profileCompletion = useMemo(
    () => calculateProfileCompletion(student || {}),
    [student]
  );

  const careerName = useMemo(
    () => getCareerName(student || {}),
    [student]
  );

  const skills = useMemo(
    () => normalizeSkills(student?.skills),
    [student]
  );

  const actionPlanSteps = useMemo(
    () => getActionPlanSteps(actionPlan),
    [actionPlan]
  );

  const actionPlanProgress = useMemo(
    () => getProgress(actionPlanSteps),
    [actionPlanSteps]
  );

  const completedSteps = useMemo(
    () => actionPlanSteps.filter(getStepStatus).length,
    [actionPlanSteps]
  );

  const nextStep = useMemo(
    () => actionPlanSteps.find((step) => !getStepStatus(step)),
    [actionPlanSteps]
  );

  const recentApplications = useMemo(
    () => applications.slice(0, 4),
    [applications]
  );

  const recentSavedJobs = useMemo(
    () => savedJobs.slice(0, 3),
    [savedJobs]
  );

  const applicationStats = useMemo(() => {
    const total = applications.length;

    const interviews = applications.filter((application) => {
      const status = String(getApplicationStatus(application)).toLowerCase();

      return (
        status.includes("interview") ||
        status.includes("selected") ||
        status.includes("offer")
      );
    }).length;

    const active = applications.filter((application) => {
      const status = String(getApplicationStatus(application)).toLowerCase();

      return !(
        status.includes("reject") ||
        status.includes("decline") ||
        status.includes("closed")
      );
    }).length;

    return {
      total,
      active,
      interviews,
    };
  }, [applications]);

  const handleContinue = () => {
    if (nextStep) {
      navigate("/action-plan");
      return;
    }

    if (profileCompletion < 100) {
      navigate("/profile");
      return;
    }

    navigate("/jobs");
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingShell}>
          <div className={`${styles.skeleton} ${styles.skeletonHero}`} />

          <div className={styles.loadingGrid}>
            <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
            <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
            <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
          </div>

          <div className={`${styles.skeleton} ${styles.skeletonLarge}`} />
        </div>
      </main>
    );
  }

  const firstName =
    student?.name?.trim()?.split(/\s+/)?.[0] || "Student";

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlowOne} />
      <div className={styles.backgroundGlowTwo} />

      <div className={styles.container}>
        {error && (
          <div className={styles.errorBanner}>
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroTop}>
              <div className={styles.avatar}>
                {student?.profileImage ? (
                  <img
                    src={student.profileImage}
                    alt={student?.name || "Student"}
                  />
                ) : (
                  getInitials(student?.name)
                )}
              </div>

              <div>
                <p className={styles.eyebrow}>Student dashboard</p>

                <h1>
                  Welcome back, {firstName}
                  <span>.</span>
                </h1>

                <p className={styles.heroDescription}>
                  Keep building your profile, follow your roadmap, and find
                  opportunities that match your career direction.
                </p>
              </div>
            </div>

            <div className={styles.goalStrip}>
              <div className={styles.goalIcon}>
                <Target size={19} />
              </div>

              <div className={styles.goalText}>
                <span>Current career goal</span>
                <strong>{careerName}</strong>
              </div>

              <Link to="/profile" className={styles.goalAction}>
                Edit goal
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroOrb}>
              <Rocket size={34} />
            </div>

            <div className={styles.heroStat}>
              <span>Profile</span>
              <strong>{profileCompletion}%</strong>
              <small>complete</small>
            </div>

            <div className={styles.heroDecoration.decorationOne} />
            <div className={styles.heroDecoration.decorationTwo} />
          </div>
        </section>

        <section className={styles.statsGrid}>
          <Link to="/profile" className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.greenIcon}`}>
              <CircleUserRound size={20} />
            </div>

            <div className={styles.statInfo}>
              <span>Profile completion</span>
              <strong>{profileCompletion}%</strong>
            </div>

            <div className={styles.miniProgress}>
              <span style={{ width: `${profileCompletion}%` }} />
            </div>

            <ChevronRight size={17} className={styles.statArrow} />
          </Link>

          <Link to="/action-plan" className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.blueIcon}`}>
              <TrendingUp size={20} />
            </div>

            <div className={styles.statInfo}>
              <span>Action plan</span>
              <strong>{actionPlanProgress}%</strong>
            </div>

            <div className={styles.miniProgress}>
              <span
                style={{ width: `${actionPlanProgress}%` }}
              />
            </div>

            <ChevronRight size={17} className={styles.statArrow} />
          </Link>

          <Link to="/applications" className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.purpleIcon}`}>
              <BriefcaseBusiness size={20} />
            </div>

            <div className={styles.statInfo}>
              <span>Applications</span>
              <strong>{applicationStats.total}</strong>
            </div>

            <small className={styles.statSubtext}>
              {applicationStats.active} active
            </small>

            <ChevronRight size={17} className={styles.statArrow} />
          </Link>

          <Link to="/jobs" className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.orangeIcon}`}>
              <Bookmark size={20} />
            </div>

            <div className={styles.statInfo}>
              <span>Saved jobs</span>
              <strong>{savedJobs.length}</strong>
            </div>

            <small className={styles.statSubtext}>
              Keep your shortlist ready
            </small>

            <ChevronRight size={17} className={styles.statArrow} />
          </Link>
        </section>

        <div className={styles.mainGrid}>
          <div className={styles.primaryColumn}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.sectionLabel}>
                    Your next move
                  </span>

                  <h2>Continue your progress</h2>
                </div>

                <Link to="/action-plan" className={styles.textLink}>
                  View plan
                  <ArrowRight size={15} />
                </Link>
              </div>

              {nextStep ? (
                <div className={styles.nextAction}>
                  <div className={styles.nextActionNumber}>
                    {nextStep.number || actionPlanSteps.indexOf(nextStep) + 1}
                  </div>

                  <div className={styles.nextActionContent}>
                    <div className={styles.nextActionMeta}>
                      <span>
                        {nextStep.type || "Next task"}
                      </span>

                      {nextStep.estimatedHours && (
                        <span>
                          <Clock3 size={13} />
                          {nextStep.estimatedHours}h
                        </span>
                      )}
                    </div>

                    <h3>{getStepTitle(nextStep)}</h3>

                    {nextStep.description && (
                      <p>{nextStep.description}</p>
                    )}

                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={handleContinue}
                    >
                      Continue
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className={styles.progressRing}>
                    <svg viewBox="0 0 42 42">
                      <circle
                        className={styles.progressRingTrack}
                        cx="21"
                        cy="21"
                        r="17"
                      />
                      <circle
                        className={styles.progressRingValue}
                        cx="21"
                        cy="21"
                        r="17"
                        style={{
                          strokeDasharray: `${actionPlanProgress * 1.068
                            } 106.8`,
                        }}
                      />
                    </svg>

                    <span>{actionPlanProgress}%</span>
                  </div>
                </div>
              ) : actionPlanSteps.length > 0 ? (
                <div className={styles.completeState}>
                  <div className={styles.completeIcon}>
                    <CheckCircle2 size={28} />
                  </div>

                  <div>
                    <h3>Action plan completed</h3>
                    <p>
                      You have completed all {actionPlanSteps.length} steps.
                      Now focus on applications and real opportunities.
                    </p>
                  </div>

                  <Link to="/jobs" className={styles.primaryButton}>
                    Find jobs
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <Target size={23} />
                  </div>

                  <div>
                    <h3>Your roadmap is waiting</h3>
                    <p>
                      Complete your career profile to start working through
                      a personalized action plan.
                    </p>
                  </div>

                  <Link to="/action-plan" className={styles.primaryButton}>
                    Open action plan
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.sectionLabel}>
                    Applications
                  </span>

                  <h2>Recent applications</h2>
                </div>

                <Link to="/applications" className={styles.textLink}>
                  View all
                  <ArrowRight size={15} />
                </Link>
              </div>

              {applicationsLoading ? (
                <div className={styles.inlineLoading}>
                  Loading applications...
                </div>
              ) : recentApplications.length ? (
                <div className={styles.applicationList}>
                  {recentApplications.map((application, index) => {
                    const job = getJobFromApplication(application);
                    const status = getApplicationStatus(application);
                    const statusClass = getApplicationClass(status);

                    return (
                      <div
                        className={styles.applicationRow}
                        key={
                          application?._id ||
                          application?.id ||
                          `application-${index}`
                        }
                      >
                        <div className={styles.companyMark}>
                          {getInitials(getCompanyName(job))}
                        </div>

                        <div className={styles.applicationMain}>
                          <strong>{getJobTitle(job)}</strong>

                          <span>
                            {getCompanyName(job)}
                            {getLocation(job) &&
                              ` · ${getLocation(job)}`}
                          </span>
                        </div>

                        <span
                          className={`${styles.statusBadge} ${styles[statusClass]
                            }`}
                        >
                          {status}
                        </span>

                        <span className={styles.applicationDate}>
                          {formatDate(
                            application?.createdAt ||
                            application?.appliedAt ||
                            application?.date
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.smallEmptyState}>
                  <FileText size={22} />
                  <div>
                    <strong>No applications yet</strong>
                    <span>
                      Start applying to jobs that match your profile.
                    </span>
                  </div>

                  <Link to="/jobs" className={styles.outlineButton}>
                    Browse jobs
                  </Link>
                </div>
              )}
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.sectionLabel}>
                    Saved opportunities
                  </span>

                  <h2>Your shortlist</h2>
                </div>

                <Link to="/jobs" className={styles.textLink}>
                  Browse jobs
                  <ArrowRight size={15} />
                </Link>
              </div>

              {savedLoading ? (
                <div className={styles.inlineLoading}>
                  Loading saved jobs...
                </div>
              ) : recentSavedJobs.length ? (
                <div className={styles.savedGrid}>
                  {recentSavedJobs.map((saved, index) => {
                    const job = saved?.job || saved?.jobId || saved;

                    const jobId =
                      job?._id ||
                      job?.id ||
                      saved?._id ||
                      saved?.jobId;

                    return (
                      <Link
                        to={jobId ? `/jobs/${jobId}` : "/jobs"}
                        className={styles.savedCard}
                        key={
                          saved?._id ||
                          saved?.id ||
                          jobId ||
                          `saved-${index}`
                        }
                      >
                        <div className={styles.savedTop}>
                          <div className={styles.companyMarkSmall}>
                            {getInitials(getCompanyName(job))}
                          </div>

                          <Bookmark size={16} />
                        </div>

                        <strong>{getJobTitle(job)}</strong>

                        <span>{getCompanyName(job)}</span>

                        <div className={styles.savedLocation}>
                          <MapPin size={13} />
                          {getLocation(job)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.smallEmptyState}>
                  <Bookmark size={22} />
                  <div>
                    <strong>Your shortlist is empty</strong>
                    <span>
                      Save interesting jobs so you can return to them later.
                    </span>
                  </div>

                  <Link to="/jobs" className={styles.outlineButton}>
                    Explore jobs
                  </Link>
                </div>
              )}
            </section>
          </div>

          <aside className={styles.sidebar}>
            <section className={`${styles.card} ${styles.profileCard}`}>
              <div className={styles.profileCardHeader}>
                <div>
                  <span className={styles.sectionLabel}>Profile</span>
                  <h2>Profile strength</h2>
                </div>

                <CircleUserRound size={19} />
              </div>

              <div className={styles.profileScore}>
                <div className={styles.largeRing}>
                  <svg viewBox="0 0 42 42">
                    <circle
                      className={styles.largeRingTrack}
                      cx="21"
                      cy="21"
                      r="17"
                    />
                    <circle
                      className={styles.largeRingValue}
                      cx="21"
                      cy="21"
                      r="17"
                      style={{
                        strokeDasharray: `${profileCompletion * 1.068
                          } 106.8`,
                      }}
                    />
                  </svg>

                  <div>
                    <strong>{profileCompletion}%</strong>
                    <span>complete</span>
                  </div>
                </div>

                <p>
                  {profileCompletion >= 90
                    ? "Your profile is in strong shape."
                    : profileCompletion >= 60
                      ? "A few more details can improve your matches."
                      : "Complete more of your profile to improve job matching."}
                </p>
              </div>

              <Link to="/profile" className={styles.fullButton}>
                {profileCompletion >= 100
                  ? "View profile"
                  : "Complete profile"}
                <ArrowRight size={16} />
              </Link>
            </section>

            <section className={`${styles.card} ${styles.careerCard}`}>
              <div className={styles.careerIcon}>
                <GraduationCap size={21} />
              </div>

              <span className={styles.sectionLabel}>Career direction</span>

              <h2>{careerName}</h2>

              <p>
                Your skills and opportunities are organized around this
                direction.
              </p>

              {skills.length > 0 && (
                <div className={styles.skillList}>
                  {skills.slice(0, 5).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}

                  {skills.length > 5 && (
                    <span>+{skills.length - 5}</span>
                  )}
                </div>
              )}

              <Link to="/careers" className={styles.careerLink}>
                Explore career path
                <ArrowRight size={15} />
              </Link>
            </section>
            <section className={styles.miniCareerStats}>
              <div>
                <span>Applications</span>
                <strong>{applicationStats.total}</strong>
              </div>

              <div>
                <span>Active</span>
                <strong>{applicationStats.active}</strong>
              </div>

              <div>
                <span>Positive</span>
                <strong>{applicationStats.interviews}</strong>
              </div>
            </section>
            <section className={`${styles.card} ${styles.quickActions}`}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.sectionLabel}>
                    Shortcuts
                  </span>
                  <h2>Quick actions</h2>
                </div>
              </div>

              <Link to="/jobs" className={styles.actionLink}>
                <div className={`${styles.actionIcon} ${styles.actionGreen}`}>
                  <Search size={18} />
                </div>

                <div>
                  <strong>Find jobs</strong>
                  <span>Discover matching opportunities</span>
                </div>

                <ChevronRight size={16} />
              </Link>

              <Link to="/action-plan" className={styles.actionLink}>
                <div className={`${styles.actionIcon} ${styles.actionBlue}`}>
                  <PlayCircle size={18} />
                </div>

                <div>
                  <strong>Continue roadmap</strong>
                  <span>
                    {completedSteps} of {actionPlanSteps.length || 0} tasks
                    done
                  </span>
                </div>

                <ChevronRight size={16} />
              </Link>

              <Link to="/profile" className={styles.actionLink}>
                <div
                  className={`${styles.actionIcon} ${styles.actionPurple}`}
                >
                  <UserRound size={18} />
                </div>

                <div>
                  <strong>Update profile</strong>
                  <span>Keep your information current</span>
                </div>

                <ChevronRight size={16} />
              </Link>
            </section>


          </aside>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;