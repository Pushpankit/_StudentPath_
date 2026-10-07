import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
  XCircle,
} from "lucide-react";

import CompanySidebar from "../components/CompanySidebar";
import styles from "./CompanyJobs.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

function CompanyJobs() {
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [sortBy, setSortBy] =
    useState("newest");

  const token = localStorage.getItem("token");

  const fetchJobs = async () => {
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
          fetch(`${API_URL}/company/me`, {
            headers,
          }),
          fetch(`${API_URL}/company/jobs`, {
            headers,
          }),
        ]);

      if (
        companyResponse.status === 401 ||
        companyResponse.status === 403 ||
        jobsResponse.status === 401 ||
        jobsResponse.status === 403
      ) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const companyData =
        await companyResponse.json();

      const jobsData =
        await jobsResponse.json();

      if (!companyResponse.ok) {
        throw new Error(
          companyData.message ||
          "Unable to load company profile."
        );
      }

      if (!jobsResponse.ok) {
        throw new Error(
          jobsData.message ||
          "Unable to load jobs."
        );
      }

      setCompany(companyData.company);
      setJobs(jobsData.jobs || []);
    } catch (err) {
      console.error(
        "Company jobs error:",
        err
      );

      setError(
        err.message ||
        "Unable to load company jobs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  /*
   * ------------------------------------------------------
   * JOB COUNTS
   * ------------------------------------------------------
   */

  const jobCounts = useMemo(() => {
    const counts = {
      all: jobs.length,
      approved: 0,
      pending: 0,
      draft: 0,
      rejected: 0,
      closed: 0,
    };

    jobs.forEach((job) => {
      const status = String(
        job.status || ""
      ).toLowerCase();

      if (status === "approved") {
        counts.approved += 1;
      } else if (status === "pending") {
        counts.pending += 1;
      } else if (status === "draft") {
        counts.draft += 1;
      } else if (status === "rejected") {
        counts.rejected += 1;
      } else if (status === "closed") {
        counts.closed += 1;
      }
    });

    return counts;
  }, [jobs]);

  /*
   * ------------------------------------------------------
   * FILTERED JOBS
   * ------------------------------------------------------
   */

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    const searchValue =
      search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((job) => {
        const title = String(
          job.title || ""
        ).toLowerCase();

        const location = String(
          job.location || ""
        ).toLowerCase();

        const jobType = String(
          job.jobType || ""
        ).toLowerCase();

        const careerPath =
          Array.isArray(job.careerPaths)
            ? job.careerPaths
              .map(
                (career) =>
                  career?.title || ""
              )
              .join(" ")
              .toLowerCase()
            : "";

        return (
          title.includes(searchValue) ||
          location.includes(searchValue) ||
          jobType.includes(searchValue) ||
          careerPath.includes(searchValue)
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (job) =>
          String(job.status || "")
            .toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    result.sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0)
        );
      }

      if (sortBy === "title") {
        return String(
          a.title || ""
        ).localeCompare(
          String(b.title || "")
        );
      }

      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    });

    return result;
  }, [
    jobs,
    search,
    statusFilter,
    sortBy,
  ]);

  /*
   * ------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------
   */

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

  const getStatusClass = (status) => {
    const normalized = String(
      status || "Pending"
    ).toLowerCase();

    if (normalized === "approved") {
      return styles.statusApproved;
    }

    if (normalized === "rejected") {
      return styles.statusRejected;
    }

    if (normalized === "closed") {
      return styles.statusClosed;
    }

    if (normalized === "draft") {
      return styles.statusDraft;
    }

    return styles.statusPending;
  };

  const getStatusIcon = (status) => {
    const normalized = String(
      status || "Pending"
    ).toLowerCase();

    if (normalized === "approved") {
      return <CheckCircle2 size={13} />;
    }

    if (normalized === "rejected") {
      return <XCircle size={13} />;
    }

    if (normalized === "closed") {
      return <XCircle size={13} />;
    }

    if (normalized === "draft") {
      return <FileText size={13} />;
    }

    return <Clock3 size={13} />;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getCareerPath = (job) => {
    if (
      Array.isArray(job.careerPaths) &&
      job.careerPaths.length
    ) {
      return job.careerPaths
        .map(
          (career) =>
            career?.title
        )
        .filter(Boolean)
        .join(", ");
    }

    return "";
  };

  /*
   * ------------------------------------------------------
   * LOADING
   * ------------------------------------------------------
   */

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
              Loading your jobs...
            </span>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ------------------------------------------------------
   * PAGE
   * ------------------------------------------------------
   */

  return (
    <div className={styles.page}>
      <CompanySidebar />

      <main className={styles.main}>
        {/* TOP BAR */}

        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>Company</span>

            <span className={styles.slash}>
              /
            </span>

            <strong>Jobs</strong>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.companyMini}>
              <div
                className={
                  styles.companyAvatar
                }
              >
                {getInitials(
                  company?.companyName
                )}
              </div>

              <div>
                <strong>
                  {company?.companyName ||
                    "Company"}
                </strong>

                <span>
                  Company workspace
                </span>
              </div>
            </div>
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
                onClick={fetchJobs}
                className={styles.retryButton}
              >
                Try again
              </button>
            </div>
          )}

          {/* PAGE HEADER */}

          <section className={styles.pageHeader}>
            <div>
              <p className={styles.eyebrow}>
                MANAGE OPPORTUNITIES
              </p>

              <h1>
                Your job postings
              </h1>

              <p>
                Create, manage and track the
                opportunities your company offers
                to students.
              </p>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate("/company/post-job")}
            >
              <Plus size={17} />
              Post a Job
            </button>
          </section>

          {/* SUMMARY */}

          <section className={styles.statsGrid}>
            <button
              type="button"
              className={`${styles.statCard} ${statusFilter === "All"
                ? styles.statActive
                : ""
                }`}
              onClick={() =>
                setStatusFilter("All")
              }
            >
              <div
                className={`${styles.statIcon} ${styles.blue}`}
              >
                <BriefcaseBusiness size={19} />
              </div>

              <div>
                <span>Total Jobs</span>

                <strong>
                  {jobCounts.all}
                </strong>

                <small>
                  All your postings
                </small>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.statCard} ${statusFilter === "Approved"
                ? styles.statActive
                : ""
                }`}
              onClick={() =>
                setStatusFilter("Approved")
              }
            >
              <div
                className={`${styles.statIcon} ${styles.green}`}
              >
                <CheckCircle2 size={19} />
              </div>

              <div>
                <span>Active Jobs</span>

                <strong>
                  {jobCounts.approved}
                </strong>

                <small>
                  Currently active
                </small>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.statCard} ${statusFilter === "Pending"
                ? styles.statActive
                : ""
                }`}
              onClick={() =>
                setStatusFilter("Pending")
              }
            >
              <div
                className={`${styles.statIcon} ${styles.orange}`}
              >
                <Clock3 size={19} />
              </div>

              <div>
                <span>Pending Review</span>

                <strong>
                  {jobCounts.pending}
                </strong>

                <small>
                  Waiting for approval
                </small>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.statCard} ${statusFilter === "Draft"
                ? styles.statActive
                : ""
                }`}
              onClick={() =>
                setStatusFilter("Draft")
              }
            >
              <div
                className={`${styles.statIcon} ${styles.purple}`}
              >
                <FileText size={19} />
              </div>

              <div>
                <span>Draft Jobs</span>

                <strong>
                  {jobCounts.draft}
                </strong>

                <small>
                  Not submitted
                </small>
              </div>
            </button>
          </section>

          {/* TOOLBAR */}

          <section
            className={styles.toolbar}
            id="jobs-list"
          >
            <div className={styles.searchBox}>
              <Search size={17} />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search jobs, locations or career paths..."
                aria-label="Search jobs"
              />
            </div>

            <div className={styles.filters}>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className={styles.select}
              >
                <option value="All">
                  All statuses
                </option>

                <option value="Approved">
                  Approved
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Draft">
                  Draft
                </option>

                <option value="Rejected">
                  Rejected
                </option>

                <option value="Closed">
                  Closed
                </option>
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
                className={styles.select}
              >
                <option value="newest">
                  Newest first
                </option>

                <option value="oldest">
                  Oldest first
                </option>

                <option value="title">
                  Job title
                </option>
              </select>
            </div>
          </section>

          {/* RESULTS */}

          <section className={styles.jobsSection}>
            <div className={styles.resultsHeader}>
              <div>
                <span>
                  {filteredJobs.length}{" "}
                  {filteredJobs.length === 1
                    ? "job"
                    : "jobs"}
                </span>

                {search && (
                  <small>
                    Search results for "
                    {search}"
                  </small>
                )}
              </div>

              <button
                type="button"
                className={styles.refreshButton}
                onClick={fetchJobs}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {filteredJobs.length === 0 ? (
              <div className={styles.emptyState}>
                <div
                  className={
                    styles.emptyIcon
                  }
                >
                  {search ||
                    statusFilter !== "All" ? (
                    <Search size={23} />
                  ) : (
                    <BriefcaseBusiness
                      size={23}
                    />
                  )}
                </div>

                <h2>
                  {search ||
                    statusFilter !== "All"
                    ? "No jobs found"
                    : "No job postings yet"}
                </h2>

                <p>
                  {search ||
                    statusFilter !== "All"
                    ? "Try changing your search or filters."
                    : "Create your first job opportunity to start reaching students."}
                </p>

                {search ||
                  statusFilter !== "All" ? (
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("All");
                    }}
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => navigate("/company/post-job")}
                  >
                    <Plus size={15} />
                    Create a job
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.jobsCard}>
                <div className={styles.tableHeader}>
                  <span>JOB</span>
                  <span>LOCATION</span>
                  <span>TYPE</span>
                  <span>POSTED</span>
                  <span>STATUS</span>
                  <span />
                </div>

                {filteredJobs.map((job) => {
                  const careerPath =
                    getCareerPath(job);

                  return (
                    <div
                      className={styles.jobRow}
                      key={job._id}
                    >
                      <div
                        className={
                          styles.jobMain
                        }
                      >
                        <div
                          className={
                            styles.jobIcon
                          }
                        >
                          <BriefcaseBusiness
                            size={18}
                          />
                        </div>

                        <div>
                          <h3>
                            {job.title ||
                              "Untitled Job"}
                          </h3>

                          {careerPath && (
                            <span
                              className={
                                styles.careerPath
                              }
                            >
                              {careerPath}
                            </span>
                          )}

                          {job.experienceLevel && (
                            <span
                              className={
                                styles.experience
                              }
                            >
                              {
                                job.experienceLevel
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={
                          styles.location
                        }
                      >
                        <MapPin size={14} />

                        <span>
                          {job.location ||
                            "Not specified"}
                        </span>
                      </div>

                      <div
                        className={
                          styles.jobType
                        }
                      >
                        {job.jobType ||
                          "Not specified"}
                      </div>

                      <div
                        className={
                          styles.postedDate
                        }
                      >
                        {formatDate(
                          job.createdAt
                        )}
                      </div>

                      <div>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            job.status
                          )}`}
                        >
                          {getStatusIcon(
                            job.status
                          )}

                          {job.status ||
                            "Pending"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={
                          styles.viewButton
                        }
                        onClick={() => {
                          /*
                           * Keep this button local until
                           * a dedicated job-detail route
                           * is available.
                           */
                          console.log(
                            "Selected job:",
                            job
                          );
                        }}
                      >
                        View
                        <ArrowRight
                          size={14}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* BOTTOM INFO */}

          <section className={styles.bottomGrid}>
            <div className={styles.infoCard}>
              <div
                className={
                  styles.infoCardIcon
                }
              >
                <UsersRound size={20} />
              </div>

              <div>
                <h3>
                  Reach the right students
                </h3>

                <p>
                  Clear job descriptions,
                  relevant career paths and
                  accurate requirements help
                  students discover your
                  opportunities.
                </p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div
                className={
                  styles.infoCardIconGreen
                }
              >
                <Building2 size={20} />
              </div>

              <div>
                <h3>
                  Keep your company profile
                  updated
                </h3>

                <p>
                  A complete company profile
                  gives students more context
                  before they apply.
                </p>

                <Link
                  to="/company/profile"
                  className={
                    styles.infoLink
                  }
                >
                  Edit company profile
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default CompanyJobs;





