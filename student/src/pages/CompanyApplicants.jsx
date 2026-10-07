import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  SlidersHorizontal,
  Users,
  UserCheck,
  Clock3,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CalendarDays,
  ExternalLink,
  FileText,
  Award,
  Code2,
  Building2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Video,
  Save,
  Loader2,
} from "lucide-react";

import CompanySidebar from "../components/CompanySidebar";

import styles from "./CompanyApplicants.module.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const ITEMS_PER_PAGE = 8;

const STATUS_OPTIONS = [
  "All",
  "Applied",
  "Reviewed",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Hired",
  "Withdrawn",
];

const COMPANY_STATUS_OPTIONS = [
  "Reviewed",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Hired",
];

const INTERVIEW_MODES = [
  "Online",
  "Phone",
  "In-person",
  "Other",
];

const getToken = () =>
  localStorage.getItem("token");

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

const formatDateTimeLocal = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offset =
    parsed.getTimezoneOffset();

  const localDate = new Date(
    parsed.getTime() -
      offset * 60 * 1000
  );

  return localDate
    .toISOString()
    .slice(0, 16);
};

const getStatusClass = (status) => {
  switch (status) {
    case "Applied":
      return styles.statusApplied;

    case "Reviewed":
      return styles.statusReviewed;

    case "Shortlisted":
      return styles.statusShortlisted;

    case "Interview":
      return styles.statusInterview;

    case "Rejected":
      return styles.statusRejected;

    case "Hired":
      return styles.statusHired;

    case "Withdrawn":
      return styles.statusWithdrawn;

    default:
      return "";
  }
};

const getInitials = (name) => {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
};

const getStudentLocation = (student) => {
  return (
    student?.preferredLocation ||
    student?.city ||
    student?.location ||
    "Location not provided"
  );
};

const getEducation = (student) => {
  const parts = [
    student?.degree,
    student?.branch,
  ].filter(Boolean);

  return (
    parts.join(" • ") ||
    "Education not provided"
  );
};

const getCandidateSubtitle = (student) => {
  return (
    student?.targetRole ||
    student?.branch ||
    student?.degree ||
    "Student"
  );
};

const CompanyApplicants = () => {
  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [jobFilter, setJobFilter] =
    useState("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedApplicationId, setSelectedApplicationId] =
    useState(null);

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [drawerLoading, setDrawerLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [interview, setInterview] =
    useState({
      scheduled: false,
      scheduledAt: "",
      mode: "",
      meetingUrl: "",
      location: "",
      notes: "",
    });

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  }, []);

  const fetchApplications =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          handleUnauthorized();
          return;
        }

        const response = await fetch(
          `${API_URL}/applications/company`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          handleUnauthorized();
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to fetch applicants."
          );
        }

        setApplications(
          Array.isArray(
            data?.applications
          )
            ? data.applications
            : []
        );
      } catch (err) {
        console.error(
          "Fetch company applications error:",
          err
        );

        setError(
          err.message ||
            "Unable to fetch applicants."
        );
      } finally {
        setLoading(false);
      }
    }, [handleUnauthorized]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const jobs = useMemo(() => {
    const map = new Map();

    applications.forEach(
      (application) => {
        const job = application?.job;

        if (!job?._id) return;

        if (!map.has(job._id)) {
          map.set(job._id, job);
        }
      }
    );

    return Array.from(
      map.values()
    ).sort((a, b) =>
      String(a.title || "").localeCompare(
        String(b.title || "")
      )
    );
  }, [applications]);

  const filteredApplications =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return applications.filter(
        (application) => {
          const student =
            application?.student;

          const job =
            application?.job;

          const matchesSearch =
            !normalizedSearch ||
            [
              student?.name,
              student?.targetRole,
              student?.college,
              student?.degree,
              student?.branch,
              student?.city,
              student?.preferredLocation,
              student?.location,
              job?.title,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  )
              );

          const matchesStatus =
            statusFilter === "All" ||
            application?.status ===
              statusFilter;

          const matchesJob =
            jobFilter === "All" ||
            application?.job?._id ===
              jobFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesJob
          );
        }
      );
    }, [
      applications,
      search,
      statusFilter,
      jobFilter,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredApplications.length /
        ITEMS_PER_PAGE
    )
  );

  const visibleApplications =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredApplications.slice(
        start,
        start + ITEMS_PER_PAGE
      );
    }, [
      filteredApplications,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    jobFilter,
  ]);

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const stats = useMemo(() => {
    return {
      total: applications.length,

      applied: applications.filter(
        (item) =>
          item.status === "Applied"
      ).length,

      shortlisted: applications.filter(
        (item) =>
          item.status === "Shortlisted"
      ).length,

      interview: applications.filter(
        (item) =>
          item.status === "Interview"
      ).length,

      hired: applications.filter(
        (item) =>
          item.status === "Hired"
      ).length,
    };
  }, [applications]);

  const openApplication =
    async (applicationId) => {
      try {
        setSelectedApplicationId(
          applicationId
        );

        setSelectedApplication(null);
        setDrawerLoading(true);
        setActionMessage("");

        const token = getToken();

        if (!token) {
          handleUnauthorized();
          return;
        }

        const response =
          await fetch(
            `${API_URL}/applications/company/${applicationId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          handleUnauthorized();
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to fetch applicant."
          );
        }

        const application =
          data?.application;

        setSelectedApplication(
          application
        );

        setNotes(
          application?.recruiterNotes ||
            ""
        );

        setRejectionReason(
          application?.rejectionReason ||
            ""
        );

        const details =
          application?.interviewDetails ||
          {};

        setInterview({
          scheduled:
            Boolean(
              details.scheduled
            ),

          scheduledAt:
            formatDateTimeLocal(
              details.scheduledAt
            ),

          mode:
            details.mode || "",

          meetingUrl:
            details.meetingUrl || "",

          location:
            details.location || "",

          notes:
            details.notes || "",
        });
      } catch (err) {
        console.error(
          "Open applicant error:",
          err
        );

        setActionMessage(
          err.message ||
            "Unable to open applicant."
        );
      } finally {
        setDrawerLoading(false);
      }
    };

  const closeDrawer = () => {
    if (actionLoading) return;

    setSelectedApplicationId(null);
    setSelectedApplication(null);
    setActionMessage("");
  };

  const updateStatus =
    async (status) => {
      if (!selectedApplicationId) {
        return;
      }

      try {
        setActionLoading(true);
        setActionMessage("");

        const token = getToken();

        if (!token) {
          handleUnauthorized();
          return;
        }

        const response =
          await fetch(
            `${API_URL}/applications/company/${selectedApplicationId}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",

                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                status,
              }),
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          handleUnauthorized();
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to update status."
          );
        }

        setSelectedApplication(
          data.application
        );

        setApplications(
          (previous) =>
            previous.map(
              (application) =>
                application._id ===
                selectedApplicationId
                  ? {
                      ...application,
                      status,
                      ...(data.application ||
                        {}),
                    }
                  : application
            )
        );

        setActionMessage(
          "Application status updated."
        );
      } catch (err) {
        console.error(
          "Update application status error:",
          err
        );

        setActionMessage(
          err.message ||
            "Unable to update status."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const saveNotes =
    async () => {
      if (!selectedApplicationId) {
        return;
      }

      try {
        setActionLoading(true);
        setActionMessage("");

        const token = getToken();

        if (!token) {
          handleUnauthorized();
          return;
        }

        const response =
          await fetch(
            `${API_URL}/applications/company/${selectedApplicationId}/notes`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                recruiterNotes:
                  notes,

                rejectionReason:
                  rejectionReason,
              }),
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          handleUnauthorized();
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to save notes."
          );
        }

        setSelectedApplication(
          (previous) => ({
            ...previous,
            recruiterNotes:
              notes,

            rejectionReason:
              rejectionReason,
          })
        );

        setApplications(
          (previous) =>
            previous.map(
              (application) =>
                application._id ===
                selectedApplicationId
                  ? {
                      ...application,
                      recruiterNotes:
                        notes,
                      rejectionReason:
                        rejectionReason,
                    }
                  : application
            )
        );

        setActionMessage(
          "Applicant notes saved."
        );
      } catch (err) {
        console.error(
          "Save applicant notes error:",
          err
        );

        setActionMessage(
          err.message ||
            "Unable to save notes."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const saveInterview =
    async () => {
      if (!selectedApplicationId) {
        return;
      }

      try {
        setActionLoading(true);
        setActionMessage("");

        const token = getToken();

        if (!token) {
          handleUnauthorized();
          return;
        }

        const payload = {
          scheduled:
            interview.scheduled,

          scheduledAt:
            interview.scheduled
              ? interview.scheduledAt
              : null,

          mode:
            interview.mode || "",

          meetingUrl:
            interview.meetingUrl,

          location:
            interview.location,

          notes:
            interview.notes,
        };

        const response =
          await fetch(
            `${API_URL}/applications/company/${selectedApplicationId}/interview`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify(
                payload
              ),
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          handleUnauthorized();
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to save interview details."
          );
        }

        setSelectedApplication(
          data.application
        );

        setApplications(
          (previous) =>
            previous.map(
              (application) =>
                application._id ===
                selectedApplicationId
                  ? {
                      ...application,
                      status:
                        data.application
                          ?.status ||
                        application.status,
                      interviewDetails:
                        data.application
                          ?.interviewDetails ||
                        payload,
                      interviewAt:
                        data.application
                          ?.interviewAt ||
                        null,
                    }
                  : application
            )
        );

        setActionMessage(
          "Interview details saved."
        );
      } catch (err) {
        console.error(
          "Save interview error:",
          err
        );

        setActionMessage(
          err.message ||
            "Unable to save interview details."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setJobFilter("All");
    setCurrentPage(1);
  };

  return (
    <div className={styles.page}>
      <CompanySidebar />

      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <div className={styles.breadcrumb}>
              Company
              <span>/</span>
              Applicants
            </div>

            <h1 className={styles.pageTitle}>
              Applicants
            </h1>

            <p className={styles.pageSubtitle}>
              Review and manage students
              who applied to your jobs.
            </p>
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.totalApplicants}>
              <Users size={17} />
              <span>
                {applications.length} applicants
              </span>
            </div>
          </div>
        </div>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statBlue}`}
            >
              <Users size={19} />
            </div>

            <div>
              <span className={styles.statLabel}>
                Total applicants
              </span>

              <strong className={styles.statValue}>
                {stats.total}
              </strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statAmber}`}
            >
              <Clock3 size={19} />
            </div>

            <div>
              <span className={styles.statLabel}>
                Applied
              </span>

              <strong className={styles.statValue}>
                {stats.applied}
              </strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statPurple}`}
            >
              <UserCheck size={19} />
            </div>

            <div>
              <span className={styles.statLabel}>
                Shortlisted
              </span>

              <strong className={styles.statValue}>
                {stats.shortlisted}
              </strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statGreen}`}
            >
              <BriefcaseBusiness size={19} />
            </div>

            <div>
              <span className={styles.statLabel}>
                Interviews
              </span>

              <strong className={styles.statValue}>
                {stats.interview}
              </strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={`${styles.statIcon} ${styles.statSuccess}`}
            >
              <CheckCircle2 size={19} />
            </div>

            <div>
              <span className={styles.statLabel}>
                Hired
              </span>

              <strong className={styles.statValue}>
                {stats.hired}
              </strong>
            </div>
          </div>
        </section>

        <section className={styles.contentCard}>
          <div className={styles.filtersHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                Applications
              </h2>

              <p className={styles.sectionSubtitle}>
                {filteredApplications.length} matching
                application
                {filteredApplications.length !==
                1
                  ? "s"
                  : ""}
              </p>
            </div>

            <button
              type="button"
              className={styles.resetButton}
              onClick={resetFilters}
              disabled={
                !search &&
                statusFilter === "All" &&
                jobFilter === "All"
              }
            >
              <SlidersHorizontal
                size={15}
              />
              Reset filters
            </button>
          </div>

          <div className={styles.filters}>
            <div
              className={styles.searchBox}
            >
              <Search size={17} />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search applicants, roles, colleges or jobs..."
              />

              {search && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() =>
                    setSearch("")
                  }
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status === "All"
                      ? "All statuses"
                      : status}
                  </option>
                )
              )}
            </select>

            <select
              className={styles.filterSelect}
              value={jobFilter}
              onChange={(event) =>
                setJobFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All jobs
              </option>

              {jobs.map((job) => (
                <option
                  key={job._id}
                  value={job._id}
                >
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <Loader2
                className={styles.spinner}
                size={26}
              />

              <p>
                Loading applicants...
              </p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <XCircle size={25} />

              <h3>
                Unable to load applicants
              </h3>

              <p>{error}</p>

              <button
                type="button"
                onClick={
                  fetchApplications
                }
              >
                Try again
              </button>
            </div>
          ) : visibleApplications.length ===
            0 ? (
            <div className={styles.emptyState}>
              <div
                className={
                  styles.emptyIcon
                }
              >
                <Users size={27} />
              </div>

              <h3>
                No applicants found
              </h3>

              <p>
                No applications match
                your current filters.
              </p>

              {(search ||
                statusFilter !==
                  "All" ||
                jobFilter !==
                  "All") && (
                <button
                  type="button"
                  onClick={
                    resetFilters
                  }
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className={
                  styles.tableWrapper
                }
              >
                <table
                  className={
                    styles.table
                  }
                >
                  <thead>
                    <tr>
                      <th>
                        Applicant
                      </th>

                      <th>
                        Job
                      </th>

                      <th>
                        Education
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Applied
                      </th>

                      <th>
                        Status
                      </th>

                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleApplications.map(
                      (
                        application
                      ) => {
                        const student =
                          application?.student;

                        const job =
                          application?.job;

                        return (
                          <tr
                            key={
                              application._id
                            }
                            onClick={() =>
                              openApplication(
                                application._id
                              )
                            }
                            className={
                              styles.tableRow
                            }
                          >
                            <td>
                              <div
                                className={
                                  styles.applicantCell
                                }
                              >
                                <div
                                  className={
                                    styles.avatar
                                  }
                                >
                                  {student
                                    ?.name
                                    ? getInitials(
                                        student.name
                                      )
                                    : "U"}
                                </div>

                                <div
                                  className={
                                    styles.applicantInfo
                                  }
                                >
                                  <strong>
                                    {student
                                      ?.name ||
                                      "Unknown applicant"}
                                  </strong>

                                  <span>
                                    {getCandidateSubtitle(
                                      student
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div
                                className={
                                  styles.jobCell
                                }
                              >
                                <strong>
                                  {job?.title ||
                                    "Unknown job"}
                                </strong>

                                <span>
                                  {job?.jobType ||
                                    "—"}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div
                                className={
                                  styles.educationCell
                                }
                              >
                                <span>
                                  {student
                                    ?.college ||
                                    "College not provided"}
                                </span>

                                <small>
                                  {getEducation(
                                    student
                                  )}
                                </small>
                              </div>
                            </td>

                            <td>
                              <div
                                className={
                                  styles.locationCell
                                }
                              >
                                <MapPin
                                  size={14}
                                />

                                <span>
                                  {getStudentLocation(
                                    student
                                  )}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span
                                className={
                                  styles.dateText
                                }
                              >
                                {formatDate(
                                  application.appliedAt ||
                                    application.createdAt
                                )}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`${styles.statusBadge} ${getStatusClass(
                                  application.status
                                )}`}
                              >
                                {
                                  application.status
                                }
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className={
                                  styles.viewButton
                                }
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  openApplication(
                                    application._id
                                  );
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div
                  className={
                    styles.pagination
                  }
                >
                  <span>
                    Showing{" "}
                    {(
                      (currentPage -
                        1) *
                        ITEMS_PER_PAGE +
                      1
                    )}{" "}
                    –{" "}
                    {Math.min(
                      currentPage *
                        ITEMS_PER_PAGE,
                      filteredApplications.length
                    )}{" "}
                    of{" "}
                    {
                      filteredApplications.length
                    }
                  </span>

                  <div
                    className={
                      styles.paginationControls
                    }
                  >
                    <button
                      type="button"
                      disabled={
                        currentPage ===
                        1
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            page - 1
                        )
                      }
                    >
                      <ChevronLeft
                        size={16}
                      />
                    </button>

                    <span>
                      {currentPage} /{" "}
                      {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            page + 1
                        )
                      }
                    >
                      <ChevronRight
                        size={16}
                      />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {selectedApplicationId && (
        <div
          className={
            styles.drawerOverlay
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDrawer();
            }
          }}
        >
          <aside
            className={
              styles.drawer
            }
          >
            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span
                  className={
                    styles.drawerEyebrow
                  }
                >
                  Applicant details
                </span>

                <h2>
                  {selectedApplication
                    ?.student
                    ?.name ||
                    "Applicant"}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.closeDrawer
                }
                onClick={
                  closeDrawer
                }
                disabled={
                  actionLoading
                }
              >
                <X size={20} />
              </button>
            </div>

            {drawerLoading ? (
              <div
                className={
                  styles.drawerLoading
                }
              >
                <Loader2
                  size={27}
                  className={
                    styles.spinner
                  }
                />

                <p>
                  Loading applicant...
                </p>
              </div>
            ) : selectedApplication ? (
              <div
                className={
                  styles.drawerContent
                }
              >
                <section
                  className={
                    styles.profileHero
                  }
                >
                  <div
                    className={
                      styles.largeAvatar
                    }
                  >
                    {getInitials(
                      selectedApplication
                        ?.student
                        ?.name
                    )}
                  </div>

                  <div
                    className={
                      styles.profileHeroInfo
                    }
                  >
                    <h3>
                      {
                        selectedApplication
                          ?.student
                          ?.name
                      }
                    </h3>

                    <p>
                      {getCandidateSubtitle(
                        selectedApplication?.student
                      )}
                    </p>

                    <span
                      className={`${styles.statusBadge} ${getStatusClass(
                        selectedApplication.status
                      )}`}
                    >
                      {
                        selectedApplication.status
                      }
                    </span>
                  </div>
                </section>

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <h3>
                      Application
                    </h3>
                  </div>

                  <div
                    className={
                      styles.infoGrid
                    }
                  >
                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <BriefcaseBusiness
                        size={16}
                      />

                      <div>
                        <span>
                          Applied for
                        </span>

                        <strong>
                          {
                            selectedApplication
                              ?.job
                              ?.title
                          }
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <CalendarDays
                        size={16}
                      />

                      <div>
                        <span>
                          Applied on
                        </span>

                        <strong>
                          {formatDate(
                            selectedApplication.appliedAt
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <Building2
                        size={16}
                      />

                      <div>
                        <span>
                          Job type
                        </span>

                        <strong>
                          {
                            selectedApplication
                              ?.job
                              ?.jobType ||
                            "—"
                          }
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <MapPin
                        size={16}
                      />

                      <div>
                        <span>
                          Job location
                        </span>

                        <strong>
                          {
                            selectedApplication
                              ?.job
                              ?.location ||
                            "—"
                          }
                        </strong>
                      </div>
                    </div>
                  </div>

                  {selectedApplication.coverLetter && (
                    <div
                      className={
                        styles.coverLetter
                      }
                    >
                      <span>
                        Cover letter
                      </span>

                      <p>
                        {
                          selectedApplication.coverLetter
                        }
                      </p>
                    </div>
                  )}
                </section>

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <h3>
                      Candidate
                    </h3>
                  </div>

                  <div
                    className={
                      styles.infoGrid
                    }
                  >
                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <Mail size={16} />

                      <div>
                        <span>
                          Email
                        </span>

                        <strong>
                          {selectedApplication
                            ?.student
                            ?.user
                            ?.email ||
                            "Not available"}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <Phone size={16} />

                      <div>
                        <span>
                          Phone
                        </span>

                        <strong>
                          {selectedApplication
                            ?.student
                            ?.user
                            ?.phone ||
                            "Not available"}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <MapPin
                        size={16}
                      />

                      <div>
                        <span>
                          Location
                        </span>

                        <strong>
                          {getStudentLocation(
                            selectedApplication?.student
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <GraduationCap
                        size={16}
                      />

                      <div>
                        <span>
                          Education
                        </span>

                        <strong>
                          {getEducation(
                            selectedApplication?.student
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <CalendarDays
                        size={16}
                      />

                      <div>
                        <span>
                          Graduation
                        </span>

                        <strong>
                          {selectedApplication
                            ?.student
                            ?.graduationYear ||
                            "—"}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.infoItem
                      }
                    >
                      <Code2 size={16} />

                      <div>
                        <span>
                          Target role
                        </span>

                        <strong>
                          {selectedApplication
                            ?.student
                            ?.targetRole ||
                            "Not specified"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <h3>
                      Skills
                    </h3>
                  </div>

                  {selectedApplication
                    ?.student
                    ?.skills
                    ?.length ? (
                    <div
                      className={
                        styles.skillList
                      }
                    >
                      {selectedApplication.student.skills.map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            key={`${skill}-${index}`}
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p
                      className={
                        styles.mutedText
                      }
                    >
                      No skills provided.
                    </p>
                  )}
                </section>

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <h3>
                      Projects
                    </h3>
                  </div>

                  {selectedApplication
                    ?.student
                    ?.projects
                    ?.length ? (
                    <div
                      className={
                        styles.projectList
                      }
                    >
                      {selectedApplication.student.projects.map(
                        (
                          project
                        ) => (
                          <div
                            className={
                              styles.projectCard
                            }
                            key={
                              project._id
                            }
                          >
                            <div
                              className={
                                styles.projectTitleRow
                              }
                            >
                              <Code2
                                size={16}
                              />

                              <strong>
                                {
                                  project.title
                                }
                              </strong>
                            </div>

                            {project.description && (
                              <p>
                                {
                                  project.description
                                }
                              </p>
                            )}

                            {project.technologies
                              ?.length > 0 && (
                              <div
                                className={
                                  styles.miniTags
                                }
                              >
                                {project.technologies.map(
                                  (
                                    tech,
                                    index
                                  ) => (
                                    <span
                                      key={`${tech}-${index}`}
                                    >
                                      {tech}
                                    </span>
                                  )
                                )}
                              </div>
                            )}

                            {project.url && (
                              <a
                                href={
                                  project.url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className={
                                  styles.externalLink
                                }
                                onClick={(
                                  event
                                ) =>
                                  event.stopPropagation()
                                }
                              >
                                View project
                                <ExternalLink
                                  size={13}
                                />
                              </a>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p
                      className={
                        styles.mutedText
                      }
                    >
                      No projects provided.
                    </p>
                  )}
                </section>

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <h3>
                      Experience
                    </h3>
                  </div>

                  {selectedApplication
                    ?.student
                    ?.experience
                    ?.length ? (
                    <div
                      className={
                        styles.timeline
                      }
                    >
                      {selectedApplication.student.experience.map(
                        (
                          item
                        ) => (
                          <div
                            className={
                              styles.timelineItem
                            }
                            key={
                              item._id
                            }
                          >
                            <div
                              className={
                                styles.timelineDot
                              }
                            />

                            <div>
                              <strong>
                                {
                                  item.title ||
                                  "Experience"
                                }
                              </strong>

                              {item.company && (
                                <span>
                                  {
                                    item.company
                                  }
                                </span>
                              )}

                              {item.period && (
                                <small>
                                  {
                                    item.period
                                  }
                                </small>
                              )}

                              {item.description && (
                                <p>
                                  {
                                    item.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p
                      className={
                        styles.mutedText
                      }
                    >
                      No experience provided.
                    </p>
                  )}
                </section>

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <h3>
                      Certifications
                    </h3>
                  </div>

                  {selectedApplication
                    ?.student
                    ?.certifications
                    ?.length ? (
                    <div
                      className={
                        styles.certificationList
                      }
                    >
                      {selectedApplication.student.certifications.map(
                        (
                          certification
                        ) => (
                          <div
                            className={
                              styles.certificationCard
                            }
                            key={
                              certification._id
                            }
                          >
                            <Award
                              size={17}
                            />

                            <div>
                              <strong>
                                {
                                  certification.name
                                }
                              </strong>

                              <span>
                                {certification.issuer ||
                                  "Issuer not provided"}
                              </span>

                              {certification.date && (
                                <small>
                                  {
                                    certification.date
                                  }
                                </small>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p
                      className={
                        styles.mutedText
                      }
                    >
                      No certifications provided.
                    </p>
                  )}
                </section>

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <h3>
                      Resume
                    </h3>
                  </div>

                  {selectedApplication
                    ?.student
                    ?.resume
                    ?.fileName ? (
                    <div
                      className={
                        styles.resumeCard
                      }
                    >
                      <div
                        className={
                          styles.resumeIcon
                        }
                      >
                        <FileText
                          size={19}
                        />
                      </div>

                      <div
                        className={
                          styles.resumeInfo
                        }
                      >
                        <strong>
                          {
                            selectedApplication
                              .student
                              .resume
                              .fileName
                          }
                        </strong>

                        <span>
                          {selectedApplication
                            .student
                            .resume
                            .size
                            ? `${(
                                selectedApplication
                                  .student
                                  .resume
                                  .size /
                                1024 /
                                1024
                              ).toFixed(
                                2
                              )} MB`
                            : "PDF"}
                        </span>
                      </div>

                      <span
                        className={
                          styles.resumeNotice
                        }
                      >
                        Resume endpoint
                        required
                      </span>
                    </div>
                  ) : selectedApplication
                      ?.student
                      ?.resumeUrl ? (
                    <a
                      href={
                        selectedApplication
                          .student
                          .resumeUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={
                        styles.resumeLink
                      }
                    >
                      <FileText
                        size={18}
                      />

                      <span>
                        View resume
                      </span>

                      <ExternalLink
                        size={14}
                      />
                    </a>
                  ) : (
                    <p
                      className={
                        styles.mutedText
                      }
                    >
                      No resume uploaded.
                    </p>
                  )}
                </section>

                <section
                  className={
                    styles.actionSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <h3>
                      Application status
                    </h3>
                  </div>

                  <div
                    className={
                      styles.statusActions
                    }
                  >
                    {COMPANY_STATUS_OPTIONS.map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          className={`${styles.statusActionButton} ${
                            selectedApplication.status ===
                            status
                              ? styles.activeStatusAction
                              : ""
                          }`}
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            updateStatus(
                              status
                            )
                          }
                        >
                          {status ===
                            "Reviewed" && (
                            <CheckCircle2
                              size={15}
                            />
                          )}

                          {status ===
                            "Shortlisted" && (
                            <UserCheck
                              size={15}
                            />
                          )}

                          {status ===
                            "Interview" && (
                            <Video
                              size={15}
                            />
                          )}

                          {status ===
                            "Rejected" && (
                            <XCircle
                              size={15}
                            />
                          )}

                          {status ===
                            "Hired" && (
                            <CheckCircle2
                              size={15}
                            />
                          )}

                          {status}
                        </button>
                      )
                    )}
                  </div>
                </section>

                <section
                  className={
                    styles.actionSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <div>
                      <h3>
                        Recruiter notes
                      </h3>

                      <p>
                        Internal notes about
                        this candidate.
                      </p>
                    </div>
                  </div>

                  <textarea
                    className={
                      styles.textarea
                    }
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    placeholder="Add internal notes..."
                    rows={4}
                    maxLength={5000}
                  />

                  <input
                    className={
                      styles.textInput
                    }
                    value={
                      rejectionReason
                    }
                    onChange={(event) =>
                      setRejectionReason(
                        event.target.value
                      )
                    }
                    placeholder="Rejection reason (optional)"
                    maxLength={2000}
                  />

                  <button
                    type="button"
                    className={
                      styles.primaryAction
                    }
                    disabled={
                      actionLoading
                    }
                    onClick={
                      saveNotes
                    }
                  >
                    {actionLoading ? (
                      <Loader2
                        size={16}
                        className={
                          styles.spinner
                        }
                      />
                    ) : (
                      <Save
                        size={16}
                      />
                    )}

                    Save notes
                  </button>
                </section>

                <section
                  className={
                    styles.actionSection
                  }
                >
                  <div
                    className={
                      styles.detailSectionHeader
                    }
                  >
                    <div>
                      <h3>
                        Interview
                      </h3>

                      <p>
                        Schedule or update
                        an interview for
                        this applicant.
                      </p>
                    </div>
                  </div>

                  <label
                    className={
                      styles.checkboxRow
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        interview.scheduled
                      }
                      onChange={(event) =>
                        setInterview(
                          (
                            previous
                          ) => ({
                            ...previous,
                            scheduled:
                              event
                                .target
                                .checked,
                          })
                        )
                      }
                    />

                    <span>
                      Interview scheduled
                    </span>
                  </label>

                  <div
                    className={
                      styles.formGrid
                    }
                  >
                    <label
                      className={
                        styles.formField
                      }
                    >
                      <span>
                        Date & time
                      </span>

                      <input
                        type="datetime-local"
                        className={
                          styles.textInput
                        }
                        value={
                          interview.scheduledAt
                        }
                        onChange={(
                          event
                        ) =>
                          setInterview(
                            (
                              previous
                            ) => ({
                              ...previous,
                              scheduledAt:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        disabled={
                          !interview.scheduled
                        }
                      />
                    </label>

                    <label
                      className={
                        styles.formField
                      }
                    >
                      <span>
                        Mode
                      </span>

                      <select
                        className={
                          styles.textInput
                        }
                        value={
                          interview.mode
                        }
                        onChange={(
                          event
                        ) =>
                          setInterview(
                            (
                              previous
                            ) => ({
                              ...previous,
                              mode:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      >
                        <option value="">
                          Select mode
                        </option>

                        {INTERVIEW_MODES.map(
                          (mode) => (
                            <option
                              key={
                                mode
                              }
                              value={
                                mode
                              }
                            >
                              {mode}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  <label
                    className={
                      styles.formField
                    }
                  >
                    <span>
                      Meeting URL
                    </span>

                    <input
                      type="url"
                      className={
                        styles.textInput
                      }
                      value={
                        interview.meetingUrl
                      }
                      onChange={(
                        event
                      ) =>
                        setInterview(
                          (
                            previous
                          ) => ({
                            ...previous,
                            meetingUrl:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="https://..."
                    />
                  </label>

                  <label
                    className={
                      styles.formField
                    }
                  >
                    <span>
                      Location
                    </span>

                    <input
                      type="text"
                      className={
                        styles.textInput
                      }
                      value={
                        interview.location
                      }
                      onChange={(
                        event
                      ) =>
                        setInterview(
                          (
                            previous
                          ) => ({
                            ...previous,
                            location:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Office location or interview venue"
                    />
                  </label>

                  <label
                    className={
                      styles.formField
                    }
                  >
                    <span>
                      Interview notes
                    </span>

                    <textarea
                      className={
                        styles.textarea
                      }
                      value={
                        interview.notes
                      }
                      onChange={(
                        event
                      ) =>
                        setInterview(
                          (
                            previous
                          ) => ({
                            ...previous,
                            notes:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Instructions or notes for the interview..."
                      rows={3}
                      maxLength={2000}
                    />
                  </label>

                  <button
                    type="button"
                    className={
                      styles.primaryAction
                    }
                    disabled={
                      actionLoading
                    }
                    onClick={
                      saveInterview
                    }
                  >
                    {actionLoading ? (
                      <Loader2
                        size={16}
                        className={
                          styles.spinner
                        }
                      />
                    ) : (
                      <Video
                        size={16}
                      />
                    )}

                    Save interview
                  </button>
                </section>

                {actionMessage && (
                  <div
                    className={
                      styles.actionMessage
                    }
                  >
                    <MessageSquare
                      size={15}
                    />

                    {actionMessage}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={
                  styles.drawerError
                }
              >
                <XCircle size={24} />

                <p>
                  Unable to load this
                  applicant.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default CompanyApplicants;