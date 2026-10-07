import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Headphones,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  XCircle,
} from "lucide-react";

import CompanySidebar from "../components/CompanySidebar";
import styles from "./CompanyDashboard.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

function CompanyDashboard() {
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchDashboard = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [companyResponse, jobsResponse] =
        await Promise.all([
          fetch(`${API_URL}/company/me`, { headers }),
          fetch(`${API_URL}/company/jobs`, { headers }),
        ]);

      if (
        [401, 403].includes(companyResponse.status) ||
        [401, 403].includes(jobsResponse.status)
      ) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const companyData = await companyResponse.json();
      const jobsData = await jobsResponse.json();

      if (!companyResponse.ok) {
        throw new Error(
          companyData.message ||
            "Unable to load company profile."
        );
      }

      if (!jobsResponse.ok) {
        throw new Error(
          jobsData.message ||
            "Unable to load company jobs."
        );
      }

      setCompany(companyData.company);
      setJobs(jobsData.jobs || []);
    } catch (err) {
      console.error("Company dashboard error:", err);

      setError(
        err.message ||
          "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const approvedJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          String(job.status || "").toLowerCase() ===
          "approved"
      ),
    [jobs]
  );

  const draftJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const status = String(
          job.status || ""
        ).toLowerCase();

        return status === "draft";
      }),
    [jobs]
  );

  /*
   * Applications are not currently returned by
   * /company/jobs.
   */
  const applicationCount = 0;
  const shortlistedCount = 0;

  const verificationStatus = String(
    company?.verificationStatus || "unverified"
  ).toLowerCase();

  const isVerified =
    verificationStatus === "verified";

  const isRejected =
    verificationStatus === "rejected";

  const profileFields = [
    company?.companyName,
    company?.industry,
    company?.companySize,
    company?.description,
    company?.headquarters,
    company?.contactEmail,
  ];

  const completedProfileFields =
    profileFields.filter(
      (field) =>
        field !== undefined &&
        field !== null &&
        String(field).trim() !== ""
    ).length;

  const profileProgress = Math.round(
    (completedProfileFields /
      profileFields.length) *
      100
  );

  const getInitials = (name) => {
    if (!name) return "C";

    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 1) {
      return words[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getVerificationLabel = () => {
    if (isVerified) return "Verified";
    if (isRejected) return "Rejected";
    if (verificationStatus === "pending") {
      return "Pending";
    }

    return "Unverified";
  };

  const getVerificationText = () => {
    if (isVerified) {
      return "Your company profile has been verified and is ready for hiring.";
    }

    if (isRejected) {
      return (
        company?.verificationNotes ||
        "Your verification needs attention. Review your company information and resubmit."
      );
    }

    if (verificationStatus === "pending") {
      return "Your company profile has been submitted for verification. We'll notify you once it's reviewed.";
    }

    return "Complete your company profile and submit it for verification.";
  };

  const getJobMeta = (job) => {
    const meta = [];

    if (job.location) {
      meta.push({
        label: job.location,
        icon: <MapPin size={12} />,
      });
    }

    if (job.jobType) {
      meta.push({
        label: job.jobType,
      });
    }

    return meta;
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <CompanySidebar />

        <main className={styles.main}>
          <div className={styles.loading}>
            <RefreshCw
              size={19}
              className={styles.loadingIcon}
            />

            <span>
              Loading company dashboard...
            </span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <CompanySidebar />

      <main className={styles.main}>
        {/* TOP BAR */}

        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>Company</span>

            <span className={styles.breadcrumbSlash}>
              /
            </span>

            <strong>Dashboard</strong>
          </div>

          <div className={styles.topbarRight}>
            <button
              type="button"
              className={styles.notificationButton}
              aria-label="Notifications"
            >
              <Bell size={19} />

              <span
                className={styles.notificationDot}
              />
            </button>

            <div className={styles.topbarDivider} />

            <button
              type="button"
              className={styles.companyUser}
              onClick={() =>
                navigate("/company/profile")
              }
            >
              <div className={styles.companyAvatar}>
                {getInitials(
                  company?.companyName
                )}
              </div>

              <div
                className={styles.companyUserText}
              >
                <strong>
                  {company?.companyName ||
                    "Company"}
                </strong>

                <span>Company</span>
              </div>

              <ChevronDown
                size={16}
                className={styles.companyChevron}
              />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {/* ERROR */}

          {error && (
            <div className={styles.error}>
              <XCircle size={18} />

              <span>{error}</span>

              <button
                type="button"
                onClick={fetchDashboard}
                className={styles.retryButton}
              >
                Try again
              </button>
            </div>
          )}

          {/* PAGE HEADING */}

          <section className={styles.pageHeading}>
            <div>
              <p className={styles.eyebrow}>
                COMPANY DASHBOARD
              </p>

              <h1>
                Welcome back
                {company?.companyName
                  ? `, ${company.companyName}`
                  : ""}
              </h1>

              <p className={styles.pageDescription}>
                Here's what's happening with your
                company profile and job postings.
              </p>
            </div>

            {isVerified && (
              <Link
                to="/company/jobs"
                className={styles.primaryButton}
              >
                <Plus size={17} />
                Post a job
              </Link>
            )}
          </section>

          {/* MAIN DASHBOARD LAYOUT */}

          <div className={styles.dashboardLayout}>
            <div className={styles.leftColumn}>
              {/* STATS */}

              <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div
                    className={`${styles.statIcon} ${styles.statBlue}`}
                  >
                    <BriefcaseBusiness
                      size={19}
                    />
                  </div>

                  <div className={styles.statContent}>
                    <span>Active Jobs</span>

                    <strong>
                      {approvedJobs.length}
                    </strong>

                    <small>
                      Across your postings
                    </small>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div
                    className={`${styles.statIcon} ${styles.statGreen}`}
                  >
                    <UsersRound size={19} />
                  </div>

                  <div className={styles.statContent}>
                    <span>
                      Total Applications
                    </span>

                    <strong>
                      {applicationCount}
                    </strong>

                    <small>
                      Across your postings
                    </small>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div
                    className={`${styles.statIcon} ${styles.statPurple}`}
                  >
                    <UsersRound size={19} />
                  </div>

                  <div className={styles.statContent}>
                    <span>
                      Hired Candidates
                    </span>

                    <strong>0</strong>

                    <small>
                      Candidate hires
                    </small>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div
                    className={`${styles.statIcon} ${styles.statCyan}`}
                  >
                    <FileText size={19} />
                  </div>

                  <div className={styles.statContent}>
                    <span>Draft Jobs</span>

                    <strong>
                      {draftJobs.length}
                    </strong>

                    <small>
                      Ready to publish
                    </small>
                  </div>
                </div>
              </section>

              {/* RECENT JOBS */}

              <section className={styles.section}>
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.eyebrow}>
                      MANAGE OPPORTUNITIES
                    </p>

                    <h2>
                      Recent Job Postings
                    </h2>
                  </div>

                  {jobs.length > 0 && (
                    <Link
                      to="/company/jobs"
                      className={styles.sectionLink}
                    >
                      View All
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>

                {jobs.length === 0 ? (
                  <div className={styles.emptyCard}>
                    <div className={styles.emptyIcon}>
                      <BriefcaseBusiness
                        size={22}
                      />
                    </div>

                    <h3>
                      No job postings yet
                    </h3>

                    <p>
                      {isVerified
                        ? "Create your first opportunity and start reaching relevant students."
                        : "You can prepare your first opportunity while your company is under review."}
                    </p>

                    {isVerified && (
                      <Link
                        to="/company/jobs"
                        className={
                          styles.secondaryButton
                        }
                      >
                        <Plus size={16} />
                        Post a job
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className={styles.jobsCard}>
                    <div className={styles.jobsHeader}>
                      <span>Job Title</span>
                      <span>Location</span>
                      <span>Applications</span>
                      <span>Status</span>
                    </div>

                    {jobs
                      .slice(0, 5)
                      .map((job) => {
                        const meta =
                          getJobMeta(job);

                        return (
                          <Link
                            key={job._id}
                            to="/company/jobs"
                            className={styles.jobRow}
                          >
                            <div
                              className={
                                styles.jobTitleCell
                              }
                            >
                              <div
                                className={
                                  styles.jobIcon
                                }
                              >
                                <BriefcaseBusiness
                                  size={17}
                                />
                              </div>

                              <div>
                                <strong>
                                  {job.title ||
                                    "Untitled job"}
                                </strong>

                                {job.careerPath
                                  ?.name && (
                                  <span>
                                    {
                                      job
                                        .careerPath
                                        .name
                                    }
                                  </span>
                                )}
                              </div>
                            </div>

                            <div
                              className={
                                styles.jobLocation
                              }
                            >
                              {meta[0] ? (
                                <>
                                  {meta[0].icon}
                                  {meta[0].label}
                                </>
                              ) : (
                                "Not specified"
                              )}
                            </div>

                            <div
                              className={
                                styles.jobApplications
                              }
                            >
                              0
                            </div>

                            <div>
                              <span
                                className={`${styles.statusBadge} ${
                                  String(
                                    job.status || ""
                                  ).toLowerCase() ===
                                  "approved"
                                    ? styles.statusApproved
                                    : String(
                                        job.status ||
                                          ""
                                      ).toLowerCase() ===
                                      "rejected"
                                    ? styles.statusRejected
                                    : styles.statusPending
                                }`}
                              >
                                {job.status ||
                                  "Pending"}
                              </span>
                            </div>

                            <ArrowRight
                              size={15}
                              className={
                                styles.jobArrow
                              }
                            />
                          </Link>
                        );
                      })}
                  </div>
                )}
              </section>

              {/* GROW YOUR TEAM */}

              <section
                className={styles.growBanner}
              >
                <div>
                  <div className={styles.growLabel}>
                    <BriefcaseBusiness size={16} />
                    Grow Your Team
                  </div>

                  <h2>
                    Your next great hire is
                    waiting
                  </h2>

                  <p>
                    Post a job and reach talented
                    students looking for their next
                    opportunity.
                  </p>

                  {isVerified ? (
                    <Link
                      to="/company/jobs"
                      className={
                        styles.growButton
                      }
                    >
                      Post a Job
                      <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <Link
                      to="/company/profile"
                      className={
                        styles.growButton
                      }
                    >
                      Complete Profile
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>

                <div className={styles.growGraphic}>
                  <div
                    className={
                      styles.graphicLaptop
                    }
                  >
                    <BriefcaseBusiness
                      size={34}
                    />
                  </div>

                  <div
                    className={
                      styles.graphicLeafOne
                    }
                  />

                  <div
                    className={
                      styles.graphicLeafTwo
                    }
                  />
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}

            <aside className={styles.rightColumn}>
              {/* VERIFICATION */}

              <section
                className={
                  styles.sideCard
                }
              >
                <div className={styles.sideCardHeader}>
                  <div
                    className={
                      styles.sideCardTitle
                    }
                  >
                    <div
                      className={
                        styles.shieldIcon
                      }
                    >
                      <ShieldCheck size={19} />
                    </div>

                    <h3>
                      Verification Status
                    </h3>
                  </div>

                  <span
                    className={`${styles.verificationBadge} ${
                      isVerified
                        ? styles.verifiedBadge
                        : isRejected
                        ? styles.rejectedBadge
                        : styles.pendingBadge
                    }`}
                  >
                    {getVerificationLabel()}
                  </span>
                </div>

                <p
                  className={
                    styles.verificationText
                  }
                >
                  {getVerificationText()}
                </p>

                {company?.verificationSubmittedAt && (
                  <div
                    className={
                      styles.submittedDate
                    }
                  >
                    <Clock3 size={14} />

                    Submitted for review
                  </div>
                )}

                <Link
                  to="/company/profile"
                  className={
                    styles.outlineButton
                  }
                >
                  View Details
                </Link>
              </section>

              {/* COMPANY PROFILE */}

              <section
                className={
                  styles.sideCard
                }
              >
                <div className={styles.sideCardTitle}>
                  <div
                    className={
                      styles.profileIcon
                    }
                  >
                    <Building2 size={19} />
                  </div>

                  <h3>
                    Company Profile
                  </h3>
                </div>

                <div
                  className={
                    styles.progressWrapper
                  }
                >
                  <div
                    className={
                      styles.progressRing
                    }
                    style={{
                      "--progress": `${profileProgress * 3.6}deg`,
                    }}
                  >
                    <div
                      className={
                        styles.progressInner
                      }
                    >
                      <strong>
                        {profileProgress}%
                      </strong>

                      <span>Complete</span>
                    </div>
                  </div>
                </div>

                <div
                  className={
                    styles.profileChecklist
                  }
                >
                  <ProfileCheck
                    completed={
                      !!company?.companyName
                    }
                    label="Basic Information"
                  />

                  <ProfileCheck
                    completed={
                      !!company?.industry &&
                      !!company?.companySize
                    }
                    label="Industry & Size"
                  />

                  <ProfileCheck
                    completed={
                      !!company?.description
                    }
                    label="Company Description"
                  />

                  <ProfileCheck
                    completed={
                      !!company?.headquarters &&
                      !!company?.contactEmail
                    }
                    label="Location & Contact"
                  />

                  <ProfileCheck
                    completed={
                      company?.hiringRoles?.length >
                        0 ||
                      company?.hiringLocations
                        ?.length > 0
                    }
                    label="Hiring Information"
                  />

                  <ProfileCheck
                    completed={isVerified}
                    label="Verification"
                  />
                </div>

                <Link
                  to="/company/profile"
                  className={
                    styles.completeProfileButton
                  }
                >
                  {profileProgress < 100
                    ? "Complete Profile"
                    : "View Profile"}
                </Link>
              </section>

              {/* QUICK ACTIONS */}

              <section
                className={
                  styles.sideCard
                }
              >
                <div className={styles.sideCardTitle}>
                  <div
                    className={
                      styles.quickIcon
                    }
                  >
                    <Plus size={19} />
                  </div>

                  <h3>
                    Quick Actions
                  </h3>
                </div>

                <div
                  className={
                    styles.quickActions
                  }
                >
                  <QuickAction
                    to="/company/jobs"
                    icon={<Plus size={18} />}
                    title="Post a New Job"
                    description="Create a job listing in minutes"
                  />

                  <QuickAction
                    to="/company/profile"
                    icon={<Pencil size={17} />}
                    title="Update Company Profile"
                    description="Keep your information current"
                  />

                  <QuickAction
                    to="/company/applicants"
                    icon={<FileText size={17} />}
                    title="View Applications"
                    description="Manage your candidates"
                  />

                  <QuickAction
                    to="/company/profile"
                    icon={<ShieldCheck size={17} />}
                    title="Check Verification Status"
                    description="Track your verification progress"
                  />
                </div>
              </section>

              {/* SUPPORT */}

              <section
                className={
                  styles.supportCard
                }
              >
                <div
                  className={
                    styles.supportIcon
                  }
                >
                  <Headphones size={19} />
                </div>

                <div>
                  <strong>
                    Need Help?
                  </strong>

                  <span>
                    Our support team is here for
                    you.
                  </span>

                  <button
                    type="button"
                    onClick={() => {}}
                  >
                    Contact Support
                    <ArrowRight size={14} />
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileCheck({
  completed,
  label,
}) {
  return (
    <div className={styles.profileCheck}>
      {completed ? (
        <CheckCircle2
          size={16}
          className={
            styles.checkCompleted
          }
        />
      ) : (
        <span
          className={
            styles.checkEmpty
          }
        />
      )}

      <span>{label}</span>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  description,
}) {
  return (
    <Link
      to={to}
      className={styles.quickAction}
    >
      <div
        className={
          styles.quickActionIcon
        }
      >
        {icon}
      </div>

      <div
        className={
          styles.quickActionContent
        }
      >
        <strong>{title}</strong>

        <span>{description}</span>
      </div>

      <ArrowRight
        size={15}
        className={
          styles.quickActionArrow
        }
      />
    </Link>
  );
}

export default CompanyDashboard;