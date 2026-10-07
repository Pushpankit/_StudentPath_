import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Clock3,
  Search,
  X,
} from "lucide-react";

import styles from "./Applications.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL
).replace(/\/+$/, "");

function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load applications");
        }

        const data = await response.json();

        setApplications(
          Array.isArray(data)
            ? data
            : data.applications || []
        );
      } catch (err) {
        console.error(err);
        setError("Unable to load your applications.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [navigate]);

  const getJob = (application) => {
    return application.job || {};
  };

  const getCompany = (application) => {
    const job = getJob(application);

    return (
      job.company?.companyName ||
      application.company?.companyName ||
      application.company ||
      "Company"
    );
  };

  const getJobTitle = (application) => {
    const job = getJob(application);

    return (
      job.title ||
      application.jobTitle ||
      "Opportunity"
    );
  };

  const getStatus = (application) => {
    return (
      application.status ||
      application.applicationStatus ||
      "Applied"
    );
  };

  const normalizeStatus = (status) => {
    return String(status)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  };

  const getDate = (application) => {
    return (
      application.appliedAt ||
      application.createdAt ||
      application.date ||
      null
    );
  };

  const formatDate = (date) => {
    if (!date) return "Date not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredApplications = useMemo(() => {
    let result = [...applications];

    if (statusFilter !== "All") {
      result = result.filter(
        (application) =>
          normalizeStatus(getStatus(application)) ===
          normalizeStatus(statusFilter)
      );
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((application) => {
        const job = getJob(application);

        const searchableText = [
          getJobTitle(application),
          getCompany(application),
          job.location,
          job.workMode,
          job.opportunityType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(getDate(a) || 0).getTime();
      const dateB = new Date(getDate(b) || 0).getTime();

      if (sortBy === "Oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    return result;
  }, [applications, search, statusFilter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: applications.length,

      applied: applications.filter(
        (application) =>
          normalizeStatus(getStatus(application)) === "applied"
      ).length,

      review: applications.filter((application) =>
        ["underreview", "reviewing", "shortlisted"].includes(
          normalizeStatus(getStatus(application))
        )
      ).length,

      interview: applications.filter(
        (application) =>
          normalizeStatus(getStatus(application)) === "interview"
      ).length,

      rejected: applications.filter(
        (application) =>
          normalizeStatus(getStatus(application)) === "rejected"
      ).length,
    };
  }, [applications]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSortBy("Newest");
  };

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    sortBy !== "Newest";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>APPLICATIONS</span>

          <h1>My applications</h1>

          <p>
            Keep track of the opportunities you have applied to and
            follow their progress.
          </p>
        </div>

        <button
          className={styles.browseButton}
          onClick={() => navigate("/jobs")}
        >
          <BriefcaseBusiness size={16} />
          Find opportunities
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span>Total applications</span>
          <strong>{stats.total}</strong>
        </div>

        <div className={styles.statCard}>
          <span>Applied</span>
          <strong>{stats.applied}</strong>
        </div>

        <div className={styles.statCard}>
          <span>Under review</span>
          <strong>{stats.review}</strong>
        </div>

        <div className={styles.statCard}>
          <span>Interview</span>
          <strong>{stats.interview}</strong>
        </div>

        <div className={styles.statCard}>
          <span>Rejected</span>
          <strong>{stats.rejected}</strong>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={17} />

          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className={styles.filters}>
          <div className={styles.selectWrapper}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Applied">Applied</option>
              <option value="Under Review">Under review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview</option>
              <option value="Rejected">Rejected</option>
            </select>

            <ChevronDown size={14} />
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="Newest">Newest first</option>
              <option value="Oldest">Oldest first</option>
            </select>

            <ChevronDown size={14} />
          </div>

          {hasFilters && (
            <button
              className={styles.clearButton}
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!loading && !error && (
        <div className={styles.resultHeader}>
          <div>
            <h2>
              {filteredApplications.length}{" "}
              {filteredApplications.length === 1
                ? "application"
                : "applications"}
            </h2>

            <span>
              {hasFilters
                ? "Based on your current filters"
                : "All your submitted applications"}
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.state}>
          <div className={styles.loader}></div>
          <p>Loading applications...</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.state}>
          <BriefcaseBusiness size={28} />
          <h3>Could not load applications</h3>
          <p>{error}</p>

          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        filteredApplications.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <BriefcaseBusiness size={25} />
            </div>

            {applications.length === 0 ? (
              <>
                <h3>No applications yet</h3>

                <p>
                  Once you apply to an opportunity, it will appear
                  here so you can track its progress.
                </p>

                <button
                  className={styles.primaryButton}
                  onClick={() => navigate("/jobs")}
                >
                  Browse opportunities
                  <BriefcaseBusiness size={15} />
                </button>
              </>
            ) : (
              <>
                <h3>No matching applications</h3>

                <p>
                  Try changing your search or application status
                  filter.
                </p>

                <button
                  className={styles.secondaryButton}
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}

      {!loading &&
        !error &&
        filteredApplications.length > 0 && (
          <div className={styles.applicationList}>
            {filteredApplications.map((application) => {
              const job = getJob(application);
              const company = getCompany(application);
              const title = getJobTitle(application);
              const status = getStatus(application);
              const date = getDate(application);

              const jobId =
                job._id ||
                application.jobId ||
                application.job?._id;

              return (
                <article
                  className={styles.applicationCard}
                  key={application._id || application.id}
                >
                  <div className={styles.companyLogo}>
                    {company.charAt(0).toUpperCase()}
                  </div>

                  <div className={styles.applicationMain}>
                    <div className={styles.applicationTop}>
                      <div>
                        <h3>{title}</h3>
                        <p>{company}</p>
                      </div>

                      <span
                        className={`${styles.status} ${
                          styles[
                            `status${normalizeStatus(status)}`
                          ]
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className={styles.metadata}>
                      {job.location && (
                        <span>
                          <BriefcaseBusiness size={13} />
                          {job.location}
                        </span>
                      )}

                      {job.workMode && (
                        <span>{job.workMode}</span>
                      )}

                      {job.opportunityType && (
                        <span>{job.opportunityType}</span>
                      )}

                      <span>
                        <CalendarDays size={13} />
                        Applied {formatDate(date)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.applicationAction}>
                    {jobId && (
                      <button
                        onClick={() =>
                          navigate(`/jobs/${jobId}`)
                        }
                      >
                        View opportunity
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
    </div>
  );
}

export default Applications;