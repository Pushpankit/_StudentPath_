import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  Mail,
  Plus,
  Save,
  Trash2,
  Upload,
  UserRound,
  GraduationCap,
  BriefcaseBusiness,
  Award,
} from "lucide-react";

import styles from "./EditProfile.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const parseJsonResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}.`);
  }

  return response.json();
};

const emptyProject = {
  title: "",
  description: "",
  technologies: "",
  date: "",
};

const emptyExperience = {
  title: "",
  company: "",
  description: "",
  period: "",
};

const emptyCertification = {
  name: "",
  issuer: "",
  date: "",
};

function EditProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const initialSnapshotRef = useRef("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    college: "",
    degree: "",
    branch: "",
    graduationYear: "",
    city: "",
    targetRole: "",
    opportunityType: "",
    workMode: "",
    preferredLocation: "",
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  const [projects, setProjects] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certifications, setCertifications] = useState([]);

  const [resume, setResume] = useState(null);

    const buildSnapshot = (
    currentForm = form,
    currentSkills = skills,
    currentProjects = projects,
    currentExperience = experience,
    currentCertifications = certifications,
    currentResume = resume
  ) =>
    JSON.stringify({
      form: currentForm,
      skills: currentSkills,
      projects: currentProjects,
      experience: currentExperience,
      certifications: currentCertifications,
      resume:
        currentResume instanceof File
          ? {
              name: currentResume.name,
              size: currentResume.size,
              type: currentResume.type,
              lastModified: currentResume.lastModified,
            }
          : currentResume,
    });

  const isDirty =
    initialSnapshotRef.current !== "" &&
    buildSnapshot() !== initialSnapshotRef.current;

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty || saving) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, saving]);

  const requestNavigation = (path) => {
    if (saving) return;

    if (isDirty) {
      setPendingNavigation(path);
      setShowLeaveModal(true);
      return;
    }

    navigate(path);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/student/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to load profile.");
      }

      const student = data.student || data;
      const user = student.user || {};

      setForm({
        name: student.name || user.name || "",
        email: user.email || student.email || "",
        college: student.college || "",
        degree: student.degree || "",
        branch: student.branch || "",
        graduationYear: student.graduationYear || "",
        city: student.city || "",
        targetRole: student.targetRole || "",
        opportunityType: student.opportunityType || "",
        workMode: student.workMode || "",
        preferredLocation: student.preferredLocation || "",
      });

      setSkills(
        Array.isArray(student.skills)
          ? student.skills
          : []
      );

      setProjects(
        Array.isArray(student.projects)
          ? student.projects
          : []
      );

      setExperience(
        Array.isArray(student.experience)
          ? student.experience
          : []
      );

      setCertifications(
        Array.isArray(student.certifications)
          ? student.certifications
          : []
      );

      setResume(
        student.resume ||
          student.resumeUrl ||
          student.resumeFile ||
          null
      );

      initialSnapshotRef.current = buildSnapshot(
        {
          name: student.name || user.name || "",
          email: user.email || student.email || "",
          college: student.college || "",
          degree: student.degree || "",
          branch: student.branch || "",
          graduationYear: student.graduationYear || "",
          city: student.city || "",
          targetRole: student.targetRole || "",
          opportunityType: student.opportunityType || "",
          workMode: student.workMode || "",
          preferredLocation: student.preferredLocation || "",
        },
        Array.isArray(student.skills) ? student.skills : [],
        Array.isArray(student.projects) ? student.projects : [],
        Array.isArray(student.experience) ? student.experience : [],
        Array.isArray(student.certifications) ? student.certifications : [],
        student.resume || student.resumeUrl || student.resumeFile || null
      );
    } catch (err) {
      console.error("Edit profile error:", err);

      setError(
        err.message || "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================
     SKILLS
  ========================= */

  const addSkill = () => {
    const value = skillInput.trim();

    if (!value) return;

    const exists = skills.some((skill) => {
      const name =
        typeof skill === "string"
          ? skill
          : skill?.name || skill?.skill || skill?.title || "";

      return name.trim().toLowerCase() === value.toLowerCase();
    });

    if (exists) {
      setSkillInput("");
      return;
    }

    setSkills((previous) => [...previous, value]);
    setSkillInput("");
  };

  const removeSkill = (index) => {
    setSkills((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  };

  /* =========================
     PROJECTS
  ========================= */

  const addProject = () => {
    setProjects((previous) => [
      ...previous,
      {
        ...emptyProject,
      },
    ]);
  };

  const updateProject = (index, field, value) => {
    setProjects((previous) =>
      previous.map((project, itemIndex) =>
        itemIndex === index
          ? {
              ...project,
              [field]: value,
            }
          : project
      )
    );
  };

  const removeProject = (index) => {
    setProjects((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  /* =========================
     EXPERIENCE
  ========================= */

  const addExperience = () => {
    setExperience((previous) => [
      ...previous,
      {
        ...emptyExperience,
      },
    ]);
  };

  const updateExperience = (index, field, value) => {
    setExperience((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const removeExperience = (index) => {
    setExperience((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  /* =========================
     CERTIFICATIONS
  ========================= */

  const addCertification = () => {
    setCertifications((previous) => [
      ...previous,
      {
        ...emptyCertification,
      },
    ]);
  };

  const updateCertification = (
    index,
    field,
    value
  ) => {
    setCertifications((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const removeCertification = (index) => {
    setCertifications((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  /* =========================
     RESUME
  ========================= */

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setResume(file);
  };

  /* =========================
     SAVE
  ========================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      /*
       * This payload is intentionally kept as normal JSON.
       * If your backend has a dedicated resume upload endpoint,
       * upload the resume separately.
       */
      const payload = {
        name: form.name.trim(),
        college: form.college.trim(),
        degree: form.degree.trim(),
        branch: form.branch.trim(),
        city: form.city.trim(),
        targetRole: form.targetRole.trim(),
        opportunityType: form.opportunityType,
        workMode: form.workMode,
        preferredLocation: form.preferredLocation.trim(),

        skills: skills
          .map((skill) =>
            typeof skill === "string"
              ? skill.trim()
              : skill?.name || skill?.skill || skill?.title || ""
          )
          .map((skill) => skill.trim())
          .filter(Boolean),

        projects: projects.map((project) => ({
          title: project.title || "",
          description: project.description || "",
          technologies: Array.isArray(project.technologies)
            ? project.technologies
            : String(project.technologies || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
          url: project.url || "",
          date: project.date || "",
        })),

        experience: experience.map((item) => ({
          title: item.title || "",
          company: item.company || "",
          description: item.description || "",
          period: item.period || "",
        })),

        certifications: certifications.map((item) => ({
          name: item.name || "",
          issuer: item.issuer || "",
          date: item.date || "",
        })),
      };

      if (form.graduationYear) {
        payload.graduationYear = Number(form.graduationYear);
      }

      const response = await fetch(
        `${API_URL}/student/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save your profile."
        );
      }

      if (resume instanceof File) {
        if (resume.type !== "application/pdf") {
          throw new Error("Only PDF resumes are supported.");
        }

        if (resume.size > 5 * 1024 * 1024) {
          throw new Error("Resume must be 5 MB or smaller.");
        }

        const resumeData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Unable to read the resume file."));
          reader.readAsDataURL(resume);
        });

        const resumeResponse = await fetch(`${API_URL}/student/resume`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: resume.name,
            contentType: resume.type,
            data: resumeData,
          }),
        });

        const resumeResult = await parseJsonResponse(resumeResponse);

        if (!resumeResponse.ok) {
          throw new Error(resumeResult.message || "Unable to upload your resume.");
        }
      }

      // The current state is now the saved state, so leaving should not warn.
      initialSnapshotRef.current = buildSnapshot();
      setSuccess("Profile updated successfully.");

      setTimeout(() => {
        navigate("/profile");
      }, 800);
    } catch (err) {
      console.error("Save profile error:", err);

      setError(
        err.message ||
          "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
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

  return (
    <div className={styles.page}>
      {showLeaveModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-profile-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.45)",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowLeaveModal(false);
              setPendingNavigation(null);
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h2
              id="leave-profile-title"
              style={{ margin: "0 0 8px", fontSize: "20px" }}
            >
              Save your changes?
            </h2>
            <p style={{ margin: "0 0 20px", lineHeight: 1.5 }}>
              You have unsaved changes. If you leave this page now, those changes will be lost.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  setPendingNavigation(null);
                }}
                style={{
                  padding: "10px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Stay on page
              </button>

              <button
                type="button"
                onClick={() => {
                  const destination = pendingNavigation;
                  setShowLeaveModal(false);
                  setPendingNavigation(null);
                  if (destination) navigate(destination);
                }}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#111",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        {/* =========================
            HEADER
        ========================= */}

        <header className={styles.pageHeader}>
          <div>
            <Link
              to="/profile"
              className={styles.backLink}
              onClick={(event) => {
                event.preventDefault();
                requestNavigation("/profile");
              }}
            >
              <ArrowLeft size={15} />
              Back to profile
            </Link>

            <p className={styles.eyebrow}>
              PROFILE SETTINGS
            </p>

            <h1>Edit your profile</h1>

            <p className={styles.subtitle}>
              Keep your information updated so we can
              recommend more relevant opportunities.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link
              to="/profile"
              className={styles.cancelButton}
              onClick={(event) => {
                event.preventDefault();
                requestNavigation("/profile");
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              <Save size={15} />

              {saving
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </header>

        {/* =========================
            MESSAGES
        ========================= */}

        {success && (
          <div className={styles.successMessage}>
            <CheckCircle2 size={17} />
            {success}
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <span>!</span>
            {error}
          </div>
        )}

        {/* =========================
            MAIN GRID
        ========================= */}

        <div className={styles.profileGrid}>
          <main className={styles.mainColumn}>
            {/* BASIC INFORMATION */}

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>
                  <UserRound size={18} />
                </div>
                <div>
                  <h2>Basic information</h2>
                  <p>Keep your basic profile information up to date.</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={15} />
                    <input id="email" name="email" value={form.email} disabled readOnly />
                  </div>
                  <span className={styles.helper}>
                    Your account email cannot be changed here.
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="city">Current city</label>
                  <div className={styles.inputWrapper}>
                    <MapPin size={15} />
                    <input
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="e.g. Noida"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* EDUCATION */}

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h2>Education</h2>
                  <p>Add your current or most recent education.</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="college">University / college</label>
                  <input
                    id="college"
                    name="college"
                    value={form.college}
                    onChange={handleChange}
                    placeholder="e.g. RIMT University"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="degree">Degree / program</label>
                  <input
                    id="degree"
                    name="degree"
                    value={form.degree}
                    onChange={handleChange}
                    placeholder="e.g. B.Tech"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="branch">Branch / specialization</label>
                  <input
                    id="branch"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="graduationYear">Graduation year</label>
                  <input
                    id="graduationYear"
                    name="graduationYear"
                    type="number"
                    min="1950"
                    max="2100"
                    value={form.graduationYear}
                    onChange={handleChange}
                    placeholder="e.g. 2027"
                  />
                </div>
              </div>
            </section>

            {/* CAREER & PREFERENCES */}

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>
                  <BriefcaseBusiness size={18} />
                </div>
                <div>
                  <h2>Career & preferences</h2>
                  <p>Tell us what kind of opportunity you are targeting.</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="targetRole">Target career / role</label>
                  <input
                    id="targetRole"
                    name="targetRole"
                    value={form.targetRole}
                    onChange={handleChange}
                    placeholder="e.g. Frontend Developer"
                  />
                  <span className={styles.helper}>
                    Your target role is used to resolve your career profile.
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="opportunityType">Opportunity type</label>
                  <select
                    id="opportunityType"
                    name="opportunityType"
                    value={form.opportunityType}
                    onChange={handleChange}
                  >
                    <option value="">Select opportunity type</option>
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="workMode">Work mode</label>
                  <select
                    id="workMode"
                    name="workMode"
                    value={form.workMode}
                    onChange={handleChange}
                  >
                    <option value="">Select work mode</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="Any">Any</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="preferredLocation">Preferred location</label>
                  <input
                    id="preferredLocation"
                    name="preferredLocation"
                    value={form.preferredLocation}
                    onChange={handleChange}
                    placeholder="e.g. Delhi NCR or Remote"
                  />
                </div>
              </div>
            </section>

            {/* SKILLS */}

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>
                  <BriefcaseBusiness size={18} />
                </div>
                <div>
                  <h2>Skills</h2>
                  <p>Add the skills you currently use or are learning.</p>
                </div>
              </div>

              <div className={styles.skillInput}>
                <input
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="e.g. React, JavaScript, Python"
                />
                <button type="button" onClick={addSkill}>
                  <Plus size={15} />
                  Add
                </button>
              </div>

              {skills.length > 0 ? (
                <div className={styles.skillList}>
                  {skills.map((skill, index) => {
                    const name =
                      typeof skill === "string"
                        ? skill
                        : skill?.name || skill?.skill || skill?.title || "";

                    return (
                      <div className={styles.skillRow} key={`${name}-${index}`}>
                        <div className={styles.skillName}>
                          <span>{name}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => removeSkill(index)}
                          aria-label={`Remove ${name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptySmall}>No skills added yet.</div>
              )}
            </section>

            {/* PROJECTS */}

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>
                  <BriefcaseBusiness size={18} />
                </div>

                <div className={styles.cardHeaderContent}>
                  <div>
                    <h2>Projects</h2>
                    <p>
                      Show projects that demonstrate your
                      skills.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={addProject}
                  >
                    <Plus size={15} />
                    Add project
                  </button>
                </div>
              </div>

              {projects.length > 0 ? (
                <div className={styles.itemList}>
                  {projects.map((project, index) => (
                    <div
                      className={styles.itemCard}
                      key={index}
                    >
                      <div className={styles.itemHeader}>
                        <span>
                          Project {index + 1}
                        </span>

                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() =>
                            removeProject(index)
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className={styles.formGrid}>
                        <div className={styles.field}>
                          <label>Project name</label>

                          <input
                            value={
                              project.title || ""
                            }
                            onChange={(event) =>
                              updateProject(
                                index,
                                "title",
                                event.target.value
                              )
                            }
                            placeholder="e.g. Student Career Platform"
                          />
                        </div>

                        <div className={styles.field}>
                          <label>Date / period</label>

                          <input
                            value={
                              project.date || ""
                            }
                            onChange={(event) =>
                              updateProject(
                                index,
                                "date",
                                event.target.value
                              )
                            }
                            placeholder="e.g. 2026"
                          />
                        </div>

                        <div
                          className={`${styles.field} ${styles.fullWidth}`}
                        >
                          <label>
                            Description
                          </label>

                          <textarea
                            value={
                              project.description ||
                              ""
                            }
                            onChange={(event) =>
                              updateProject(
                                index,
                                "description",
                                event.target.value
                              )
                            }
                            placeholder="What did you build and what problem did it solve?"
                          />
                        </div>

                        <div
                          className={`${styles.field} ${styles.fullWidth}`}
                        >
                          <label>
                            Technologies
                          </label>

                          <input
                            value={
                              Array.isArray(
                                project.technologies
                              )
                                ? project.technologies.join(
                                    ", "
                                  )
                                : project.technologies ||
                                  ""
                            }
                            onChange={(event) =>
                              updateProject(
                                index,
                                "technologies",
                                event.target.value
                              )
                            }
                            placeholder="React, Node.js, MongoDB"
                          />
                        </div>

                        <div
                          className={`${styles.field} ${styles.fullWidth}`}
                        >
                          <label>Project URL</label>
                          <input
                            type="url"
                            value={project.url || ""}
                            onChange={(event) =>
                              updateProject(index, "url", event.target.value)
                            }
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptySmall}>
                  No projects added yet.
                </div>
              )}
            </section>

            {/* EXPERIENCE */}

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>
                  <BriefcaseBusiness size={18} />
                </div>

                <div className={styles.cardHeaderContent}>
                  <div>
                    <h2>Experience</h2>
                    <p>
                      Add internships, jobs or other
                      relevant experience.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={addExperience}
                  >
                    <Plus size={15} />
                    Add experience
                  </button>
                </div>
              </div>

              {experience.length > 0 ? (
                <div className={styles.itemList}>
                  {experience.map((item, index) => (
                    <div
                      className={styles.itemCard}
                      key={index}
                    >
                      <div className={styles.itemHeader}>
                        <span>
                          Experience {index + 1}
                        </span>

                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() =>
                            removeExperience(index)
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className={styles.formGrid}>
                        <div className={styles.field}>
                          <label>Role</label>

                          <input
                            value={
                              item.title || ""
                            }
                            onChange={(event) =>
                              updateExperience(
                                index,
                                "title",
                                event.target.value
                              )
                            }
                            placeholder="e.g. Web Developer Intern"
                          />
                        </div>

                        <div className={styles.field}>
                          <label>Company</label>

                          <input
                            value={
                              item.company || ""
                            }
                            onChange={(event) =>
                              updateExperience(
                                index,
                                "company",
                                event.target.value
                              )
                            }
                            placeholder="Company name"
                          />
                        </div>

                        <div className={styles.field}>
                          <label>Period</label>

                          <input
                            value={
                              item.period || ""
                            }
                            onChange={(event) =>
                              updateExperience(
                                index,
                                "period",
                                event.target.value
                              )
                            }
                            placeholder="e.g. Jun 2026 - Sep 2026"
                          />
                        </div>

                        <div
                          className={`${styles.field} ${styles.fullWidth}`}
                        >
                          <label>
                            Description
                          </label>

                          <textarea
                            value={
                              item.description ||
                              ""
                            }
                            onChange={(event) =>
                              updateExperience(
                                index,
                                "description",
                                event.target.value
                              )
                            }
                            placeholder="Describe what you worked on."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptySmall}>
                  No experience added yet.
                </div>
              )}
            </section>

            {/* CERTIFICATIONS */}

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>
                  <Award size={18} />
                </div>

                <div className={styles.cardHeaderContent}>
                  <div>
                    <h2>Certifications</h2>
                    <p>
                      Add certifications that support your
                      skills.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={addCertification}
                  >
                    <Plus size={15} />
                    Add certification
                  </button>
                </div>
              </div>

              {certifications.length > 0 ? (
                <div className={styles.itemList}>
                  {certifications.map(
                    (certificate, index) => (
                      <div
                        className={styles.itemCard}
                        key={index}
                      >
                        <div
                          className={styles.itemHeader}
                        >
                          <span>
                            Certification{" "}
                            {index + 1}
                          </span>

                          <button
                            type="button"
                            className={
                              styles.removeButton
                            }
                            onClick={() =>
                              removeCertification(
                                index
                              )
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className={styles.formGrid}>
                          <div
                            className={styles.field}
                          >
                            <label>
                              Certification name
                            </label>

                            <input
                              value={
                                certificate.name ||
                                ""
                              }
                              onChange={(event) =>
                                updateCertification(
                                  index,
                                  "name",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. AWS Cloud Practitioner"
                            />
                          </div>

                          <div
                            className={styles.field}
                          >
                            <label>
                              Issuing organization
                            </label>

                            <input
                              value={
                                certificate.issuer ||
                                ""
                              }
                              onChange={(event) =>
                                updateCertification(
                                  index,
                                  "issuer",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. Amazon Web Services"
                            />
                          </div>

                          <div
                            className={styles.field}
                          >
                            <label>Date</label>

                            <input
                              value={
                                certificate.date ||
                                ""
                              }
                              onChange={(event) =>
                                updateCertification(
                                  index,
                                  "date",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. 2026"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className={styles.emptySmall}>
                  No certifications added yet.
                </div>
              )}
            </section>
          </main>

          {/* =========================
              SIDE COLUMN
          ========================= */}

          <aside className={styles.sideColumn}>
            {/* RESUME */}

            <section className={styles.resumeCard}>
              <div className={styles.resumeTop}>
                <div className={styles.resumeIcon}>
                  <FileText size={20} />
                </div>

                <div>
                  <h2>Your resume</h2>

                  <p>
                    Keep your latest resume available
                    for applications.
                  </p>
                </div>
              </div>

              {resume && !(resume instanceof File) ? (
                <div className={styles.currentResume}>
                  <FileText size={16} />

                  <span>
                    {typeof resume === "string"
                      ? resume.split("/").pop()
                      : resume.name ||
                        resume.fileName ||
                        "Current resume"}
                  </span>
                </div>
              ) : resume instanceof File ? (
                <div className={styles.currentResume}>
                  <CheckCircle2 size={16} />

                  <span>{resume.name}</span>
                </div>
              ) : (
                <div className={styles.noResume}>
                  No resume uploaded yet.
                </div>
              )}

              <label
                htmlFor="resume"
                className={styles.uploadButton}
              >
                <Upload size={15} />

                {resume
                  ? "Change resume"
                  : "Upload resume"}

                <input
                  id="resume"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleResumeChange}
                />
              </label>

              <span className={styles.resumeHelper}>
                PDF · Max 5 MB
              </span>
            </section>

            {/* PROFILE COMPLETION */}

            <section className={styles.completionCard}>
              <div className={styles.completionHeader}>
                <span>Profile completion</span>

                <strong>
                  Complete the important details
                </strong>
              </div>

              <div className={styles.checkList}>
                <div>
                  <CheckCircle2 size={15} />
                  <span>Basic information</span>
                </div>

                <div>
                  <CheckCircle2 size={15} />
                  <span>Education</span>
                </div>

                <div>
                  <CheckCircle2 size={15} />
                  <span>Skills</span>
                </div>

                <div>
                  <CheckCircle2 size={15} />
                  <span>Projects or experience</span>
                </div>

                <div>
                  <CheckCircle2 size={15} />
                  <span>Resume</span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* MOBILE SAVE */}

        <div className={styles.mobileSaveBar}>
          <Link
            to="/profile"
            className={styles.cancelButton}
            onClick={(event) => {
              event.preventDefault();
              requestNavigation("/profile");
            }}
          >
            Cancel
          </Link>

          <button
            type="submit"
            className={styles.saveButton}
            disabled={saving}
          >
            <Save size={15} />

            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;