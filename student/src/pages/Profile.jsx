
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  Layers3,
  MapPin,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import styles from "./Profile.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("You are not logged in.");
        }

        const response = await fetch(`${API_URL}/student/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        /*
         * Do not blindly call response.json().
         *
         * If Express/Vite returns an HTML 404 page, response.json()
         * throws "Unexpected token '<'".
         */
        const contentType = response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();

          throw new Error(
            response.ok
              ? "The server returned an unexpected response."
              : `Unable to load profile. Server returned ${response.status}.`
          );
        }

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        setProfile(data.student || data);
      } catch (err) {
        console.error("Profile error:", err);
        setError(err.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /*
   * --------------------------------------------------
   * NORMALIZE PROFILE
   * --------------------------------------------------
   *
   * This maps the actual Student model/API response
   * into values used by the UI.
   */

  const normalizedProfile = useMemo(() => {
    if (!profile) {
      return null;
    }

    const user = profile.user || {};

    const fullName =
      profile.name ||
      user.name ||
      "Student";

    const initials =
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("") || "ST";

    const careerProfile =
      profile.careerProfile &&
      typeof profile.careerProfile === "object"
        ? profile.careerProfile
        : null;

    return {
      ...profile,

      user,

      name: fullName,

      initials,

      email:
        user.email ||
        profile.email ||
        "",

      college:
        profile.college ||
        "",

      degree:
        profile.degree ||
        "",

      branch:
        profile.branch ||
        "",

      graduationYear:
        profile.graduationYear ||
        "",

      city:
        profile.city ||
        profile.location ||
        "",

      preferredLocation:
        profile.preferredLocation ||
        "",

      targetRole:
        profile.targetRole ||
        "",

      careerProfile,

      opportunityType:
        profile.opportunityType ||
        "",

      workMode:
        profile.workMode ||
        "",

      skills:
        Array.isArray(profile.skills)
          ? profile.skills
          : [],

      projects:
        Array.isArray(profile.projects)
          ? profile.projects
          : [],

      experience:
        Array.isArray(profile.experience)
          ? profile.experience
          : [],

      certifications:
        Array.isArray(profile.certifications)
          ? profile.certifications
          : [],

      profileCompletion:
        Number(profile.profileCompletion) || 0,

      resume:
        profile.resume || null,
    };
  }, [profile]);

  /*
   * --------------------------------------------------
   * RESUME VIEW
   * --------------------------------------------------
   *
   * The resume endpoint is protected by authentication.
   * A normal <a href=""> cannot attach the JWT.
   *
   * Therefore fetch the PDF with Authorization and open
   * a temporary Blob URL.
   */

  const handleViewResume = async () => {
    try {
      if (resumeLoading) {
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      setResumeLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/student/resume`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType =
          response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = await response.json();

          throw new Error(
            data.message || "Unable to open resume."
          );
        }

        throw new Error(
          `Unable to open resume. Server returned ${response.status}.`
        );
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The resume file is empty.");
      }

      const blobUrl = window.URL.createObjectURL(blob);

      window.open(blobUrl, "_blank", "noopener,noreferrer");

      /*
       * Give the new tab enough time to load the Blob URL
       * before releasing it.
       */
      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error("Resume view error:", err);

      setError(
        err.message || "Unable to open your resume."
      );
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error && !normalizedProfile) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>
            <UserRound size={20} />
          </div>

          <div>
            <h2>Unable to load profile</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!normalizedProfile) {
    return null;
  }

  const {
    name,
    initials,
    email,
    college,
    degree,
    branch,
    graduationYear,
    city,
    preferredLocation,
    targetRole,
    careerProfile,
    opportunityType,
    workMode,
    skills,
    projects,
    experience,
    certifications,
    profileCompletion,
    resume,
  } = normalizedProfile;

  const hasResume = Boolean(
    resume?.fileName ||
      resume?.url ||
      profile?.resumeUrl
  );

  const hasCertification =
    certifications.length > 0;

  const allExperience = [
    ...projects.map((item) => ({
      ...item,
      displayType: "project",
    })),

    ...experience.map((item) => ({
      ...item,
      displayType: "experience",
    })),
  ];

  const careerName =
    careerProfile?.canonicalTitle ||
    careerProfile?.title ||
    targetRole ||
    "";

  return (
    <div className={styles.page}>
      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>
            YOUR STORY SO FAR
          </p>

          <h1>Your profile</h1>

          <p className={styles.subtitle}>
            Keep your details up to date for more relevant
            matches.
          </p>
        </div>

        <Link
          to="/profile/edit"
          className={styles.editButton}
        >
          Edit profile
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* =========================
          PROFILE GRID
      ========================= */}

      <div className={styles.profileGrid}>
        {/* =========================
            MAIN COLUMN
        ========================= */}

        <main className={styles.mainColumn}>
          {/* PROFILE IDENTITY */}

          <section className={styles.identityCard}>
            <div className={styles.avatar}>
              {initials}
            </div>

            <div className={styles.identityInfo}>
              <h2>{name}</h2>

              <p className={styles.identitySubtitle}>
                {degree || "Student"}

                {branch
                  ? ` · ${branch}`
                  : ""}

                {graduationYear
                  ? ` · Class of ${graduationYear}`
                  : ""}
              </p>

              <div className={styles.identityMeta}>
                {city && (
                  <span>
                    <MapPin size={13} />
                    {city}
                  </span>
                )}

                {email && (
                  <span>
                    <Mail size={13} />
                    {email}
                  </span>
                )}
              </div>
            </div>

            <span className={styles.roleBadge}>
              Student
            </span>
          </section>

          {/* ABOUT & EDUCATION */}

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>About & education</h2>
              </div>

              <Link
                to="/profile/edit"
                className={styles.textAction}
              >
                Edit
                <Pencil size={14} />
              </Link>
            </div>

            <div className={styles.educationGrid}>
              <div className={styles.infoField}>
                <span>University / College</span>

                <strong>
                  {college || "Not added yet"}
                </strong>
              </div>

              <div className={styles.infoField}>
                <span>Degree</span>

                <strong>
                  {degree || "Not added yet"}
                </strong>
              </div>

              <div className={styles.infoField}>
                <span>Branch</span>

                <strong>
                  {branch || "Not added yet"}
                </strong>
              </div>

              <div className={styles.infoField}>
                <span>Graduation</span>

                <strong>
                  {graduationYear || "Not added yet"}
                </strong>
              </div>

              <div className={styles.infoField}>
                <span>Current city</span>

                <strong>
                  {city || "Not added yet"}
                </strong>
              </div>
            </div>
          </section>

          {/* CAREER & PREFERENCES */}

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Career & preferences</h2>
              </div>

              <Link
                to="/profile/edit"
                className={styles.textAction}
              >
                Edit
                <Pencil size={14} />
              </Link>
            </div>

            <div className={styles.educationGrid}>
              <div className={styles.infoField}>
                <span>Target role</span>

                <strong>
                  {targetRole || "Not added yet"}
                </strong>
              </div>

              <div className={styles.infoField}>
                <span>Career path</span>

                <strong>
                  {careerName || "Not selected yet"}
                </strong>
              </div>

              <div className={styles.infoField}>
                <span>Opportunity type</span>

                <strong>
                  {opportunityType || "Not added yet"}
                </strong>
              </div>

              <div className={styles.infoField}>
                <span>Work mode</span>

                <strong>
                  {workMode || "Not added yet"}
                </strong>
              </div>

              <div className={styles.infoField}>
                <span>Preferred location</span>

                <strong>
                  {preferredLocation || "Not added yet"}
                </strong>
              </div>
            </div>
          </section>

          {/* SKILLS */}

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2>Skills</h2>

              <Link
                to="/profile/edit"
                className={styles.textAction}
              >
                Add skill
                <Plus size={16} />
              </Link>
            </div>

            {skills.length > 0 ? (
              <div className={styles.skillsGrid}>
                {skills.map((skill, index) => {
                  /*
                   * Student.skills is currently an array
                   * of strings in the actual model.
                   *
                   * Do not invent a proficiency level.
                   */
                  const skillName =
                    typeof skill === "string"
                      ? skill
                      : skill?.name ||
                        skill?.skill ||
                        skill?.title ||
                        "Skill";

                  return (
                    <div
                      className={styles.skillItem}
                      key={`${skillName}-${index}`}
                    >
                      <strong>{skillName}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>
                  Add your skills to help us understand
                  what you can do.
                </p>

                <Link to="/profile/edit">
                  Add skills
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>

          {/* PROJECTS & EXPERIENCE */}

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2>Projects & experience</h2>

              <Link
                to="/profile/edit"
                className={styles.textAction}
              >
                Add project
                <Plus size={16} />
              </Link>
            </div>

            {allExperience.length > 0 ? (
              <div className={styles.experienceList}>
                {allExperience.map((item, index) => {
                  const isProject =
                    item.displayType === "project";

                  return (
                    <article
                      className={styles.experienceItem}
                      key={
                        item._id ||
                        item.id ||
                        index
                      }
                    >
                      <div
                        className={
                          styles.experienceIcon
                        }
                      >
                        {isProject ? (
                          <Layers3 size={19} />
                        ) : (
                          <BriefcaseBusiness
                            size={19}
                          />
                        )}
                      </div>

                      <div
                        className={
                          styles.experienceContent
                        }
                      >
                        <h3>
                          {item.title ||
                            "Untitled"}
                        </h3>

                        {!isProject &&
                          item.company && (
                            <p>
                              {item.company}
                            </p>
                          )}

                        {item.description && (
                          <p>
                            {item.description}
                          </p>
                        )}

                        {item.technologies &&
                          Array.isArray(
                            item.technologies
                          ) &&
                          item.technologies
                            .length > 0 && (
                            <div
                              className={
                                styles.technologyText
                              }
                            >
                              {item.technologies.join(
                                " · "
                              )}
                            </div>
                          )}

                        {(item.date ||
                          item.period) && (
                          <span
                            className={
                              styles.experienceDate
                            }
                          >
                            {item.date ||
                              item.period}
                          </span>
                        )}

                        {isProject &&
                          item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className={
                                styles.technologyText
                              }
                            >
                              View project
                            </a>
                          )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>
                  Add projects and experience to show
                  what you have worked on.
                </p>

                <Link to="/profile/edit">
                  Add project
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>

          {/* CERTIFICATIONS */}

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2>Certifications</h2>

              <Link
                to="/profile/edit"
                className={styles.textAction}
              >
                Add certification
                <Plus size={16} />
              </Link>
            </div>

            {certifications.length > 0 ? (
              <div
                className={
                  styles.certificationList
                }
              >
                {certifications.map(
                  (certificate, index) => (
                    <div
                      className={
                        styles.certificationItem
                      }
                      key={
                        certificate._id ||
                        certificate.id ||
                        index
                      }
                    >
                      <div
                        className={
                          styles.certificationIcon
                        }
                      >
                        <ShieldCheck size={18} />
                      </div>

                      <div>
                        <h3>
                          {certificate.name ||
                            "Certification"}
                        </h3>

                        <p>
                          {certificate.issuer ||
                            ""}
                        </p>

                        {certificate.date && (
                          <span>
                            {certificate.date}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div
                className={
                  styles.emptyCertification
                }
              >
                <p>
                  Add certifications to show more of
                  what you've learned.
                </p>
              </div>
            )}
          </section>
        </main>

        {/* =========================
            RIGHT COLUMN
        ========================= */}

        <aside className={styles.sideColumn}>
          {/* PROFILE STRENGTH */}

          <section className={styles.strengthCard}>
            <div className={styles.strengthHeader}>
              <span>Profile strength</span>

              <strong>
                {profileCompletion}%
              </strong>
            </div>

            <div className={styles.progressBar}>
              <span
                style={{
                  width: `${Math.min(
                    Math.max(
                      profileCompletion,
                      0
                    ),
                    100
                  )}%`,
                }}
              />
            </div>

            <p>
              A more complete profile helps us suggest
              more relevant paths and jobs.
            </p>

            <div
              className={
                styles.completionItems
              }
            >
              <div>
                <CheckCircle2
                  size={16}
                  className={
                    hasResume
                      ? styles.completed
                      : styles.incomplete
                  }
                />

                <span>Add your resume</span>
              </div>

              <div>
                <CheckCircle2
                  size={16}
                  className={
                    hasCertification
                      ? styles.completed
                      : styles.incomplete
                  }
                />

                <span>
                  Add a certification
                </span>
              </div>
            </div>
          </section>

          {/* RESUME */}

          <section className={styles.resumeCard}>
            <div className={styles.resumeIcon}>
              <FileText size={20} />
            </div>

            <h3>Your resume</h3>

            {hasResume ? (
              <>
                <p className={styles.resumeName}>
                  {resume?.fileName ||
                    "Resume.pdf"}
                </p>

                <button
                  type="button"
                  onClick={handleViewResume}
                  disabled={resumeLoading}
                  className={
                    styles.resumeAction
                  }
                >
                  {resumeLoading
                    ? "Opening..."
                    : "View resume"}

                  <ArrowRight size={15} />
                </button>

                <Link
                  to="/profile/edit"
                  className={
                    styles.resumeAction
                  }
                >
                  Change resume
                  <ArrowRight size={15} />
                </Link>
              </>
            ) : (
              <>
                <p
                  className={
                    styles.resumeEmpty
                  }
                >
                  Add your resume to improve job
                  matches.
                </p>

                <Link
                  to="/profile/edit"
                  className={
                    styles.resumeAction
                  }
                >
                  Add resume
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </section>

          {/* PROFILE TIP */}

          <section className={styles.tipCard}>
            <div className={styles.tipIcon}>
              <Sparkles size={18} />
            </div>

            <div>
              <h3>
                Keep your profile current
              </h3>

              <p>
                Updated skills, projects and experience
                can improve your job matches.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Profile;

