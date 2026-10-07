import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Search,
  MapPin,
  BriefcaseBusiness,
  Clock3,
  Trash2,
  ArrowRight,
  AlertCircle,
  BookmarkX,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import styles from "./SavedJobs.module.css";

import {
  calculateProfileMatch,
  getMatchedSkills,
  getMissingSkills,
} from "../utils/profileMatch";

const API_URL = (
  import.meta.env.VITE_API_URL
).replace(/\/+$/, "");

function SavedJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [student, setStudent] = useState(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
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

      const [savedResponse, studentResponse] = await Promise.all([
        fetch(`${API_URL}/saved-jobs`, {
          headers,
        }),
        fetch(`${API_URL}/student/me`, {
          headers,
        }),
      ]);

      if (
        savedResponse.status === 401 ||
        studentResponse.status === 401
      ) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!savedResponse.ok) {
        throw new Error("Failed to load saved jobs");
      }

      const savedData = await savedResponse.json();

      let studentData = null;

      if (studentResponse.ok) {
        studentData = await studentResponse.json();
      }

      const savedJobs =
        Array.isArray(savedData)
          ? savedData
          : savedData.savedJobs || savedData.jobs || [];

      const currentStudent =
        studentData?.student ||
        studentData?.user ||
        studentData;

      setJobs(
        savedJobs
          .map((item) => item.job || item)
          .filter(Boolean)
      );

      setStudent(currentStudent || null);
    } catch (err) {
      console.error(err);
      setError("Unable to load your saved jobs.");
    } finally {
      setLoading(false);
    }
  };

  const removeSavedJob = async (jobId) => {
    if (!token || !jobId) return;

    try {
      setRemovingId(jobId);

      const response = await fetch(
        `${API_URL}/saved-jobs/${jobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to remove saved job");
      }

      setJobs((prev) =>
        prev.filter((job) => job._id !== jobId)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to remove this saved job.");
    } finally {
      setRemovingId(null);
    }
  };

  const getCompanyName = (job) => {
    if (typeof job.company === "object") {
      return job.company?.companyName || "Company";
    }

    return job.company || "Company";
  };

  const getCompanyInitial = (job) => {
    return getCompanyName(job)
      .charAt(0)
      .toUpperCase();
  };

  const getMatch = (job) => {
    if (!student) return 0;

    return calculateProfileMatch(student, job);
  };

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = jobs.filter((job) => {
      if (!query) return true;

      const company = getCompanyName(job);

      const searchableText = [
        job.title,
        company,
        job.location,
        job.workMode,
        job.opportunityType,
        ...(job.skills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    result.sort((a, b) => {
      if (sortBy === "match") {
        return getMatch(b) - getMatch(a);
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0)
        );
      }

      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    });

    return result;
  }, [jobs, student, search, sortBy]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading saved jobs...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>YOUR OPPORTUNITIES</p>
          <h1>Saved Jobs</h1>
          <p className={styles.subtitle}>
            Jobs you saved to review or apply to later.
          </p>
        </div>

        <div className={styles.savedCount}>
          <Bookmark size={17} />
          <span>{jobs.length} saved</span>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {jobs.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={17} />

            <input
              type="text"
              placeholder="Search saved jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="match">Best profile match</option>
          </select>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <BookmarkX size={26} />
          </div>

          <h2>No saved jobs yet</h2>

          <p>
            When you find an opportunity you want to come back to,
            save it here.
          </p>

          <button
            className={styles.primaryButton}
            onClick={() => navigate("/jobs")}
          >
            Browse opportunities
            <ArrowRight size={16} />
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Search size={25} />
          </div>

          <h2>No matching jobs</h2>

          <p>
            Try changing your search to find one of your saved
            opportunities.
          </p>
        </div>
      ) : (
        <div className={styles.jobList}>
          {filteredJobs.map((job) => {
            const match = getMatch(job);
            const matchedSkills = student
              ? getMatchedSkills(student, job)
              : [];
            const missingSkills = student
              ? getMissingSkills(student, job)
              : [];

            const companyName = getCompanyName(job);

            return (
              <article className={styles.jobCard} key={job._id}>
                <div className={styles.companyLogo}>
                  {getCompanyInitial(job)}
                </div>

                <div className={styles.jobContent}>
                  <div className={styles.jobTop}>
                    <div>
                      <h2>{job.title}</h2>

                      <p className={styles.companyName}>
                        {companyName}
                      </p>
                    </div>

                    <div className={styles.matchBadge}>
                      {match}% match
                    </div>
                  </div>

                  <div className={styles.meta}>
                    {job.location && (
                      <span>
                        <MapPin size={14} />
                        {job.location}
                      </span>
                    )}

                    {job.workMode && (
                      <span>
                        <BriefcaseBusiness size={14} />
                        {job.workMode}
                      </span>
                    )}

                    {job.opportunityType && (
                      <span>
                        <Clock3 size={14} />
                        {job.opportunityType}
                      </span>
                    )}
                  </div>

                  {matchedSkills.length > 0 && (
                    <div className={styles.skillsRow}>
                      <span className={styles.skillsLabel}>
                        You match:
                      </span>

                      {matchedSkills.slice(0, 4).map((skill) => (
                        <span
                          className={styles.matchSkill}
                          key={skill}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {missingSkills.length > 0 && (
                    <div className={styles.skillsRow}>
                      <span className={styles.skillsLabel}>
                        To learn:
                      </span>

                      {missingSkills.slice(0, 3).map((skill) => (
                        <span
                          className={styles.missingSkill}
                          key={skill}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.actions}>
                    <button
                      className={styles.viewButton}
                      onClick={() =>
                        navigate(`/jobs/${job._id}`)
                      }
                    >
                      View opportunity
                      <ArrowRight size={15} />
                    </button>

                    <button
                      className={styles.removeButton}
                      onClick={() => removeSavedJob(job._id)}
                      disabled={removingId === job._id}
                    >
                      <Trash2 size={15} />
                      {removingId === job._id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SavedJobs;