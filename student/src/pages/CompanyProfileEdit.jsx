import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  BriefcaseBusiness,
  Users,
  MapPin,
  Globe,
  Mail,
  Phone,
  CalendarDays,
  Save,
  X,
  Plus,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import CompanySidebar from "../components/CompanySidebar";
import styles from "./CompanyProfileEdit.module.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COMPANY_TYPES = [
  "Startup",
  "Small Business",
  "Medium Business",
  "Enterprise",
  "MNC",
  "Non-Profit",
  "Government",
  "Educational Institution",
  "Agency",
  "Consulting Firm",
  "Other",
];

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10000+",
];

const COMPANY_STAGES = [
  "Bootstrapped",
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Established",
];

const WORK_MODES = [
  "On-site",
  "Hybrid",
  "Remote",
];

const emptyForm = {
  companyName: "",
  legalName: "",
  description: "",
  industry: "",
  companyType: "",
  companySize: "",
  foundedYear: "",
  companyStage: "",
  website: "",
  linkedinUrl: "",
  headquarters: "",
  locations: [],
  contactEmail: "",
  contactPhone: "",
  logoUrl: "",
  hiringRoles: [],
  hiringLocations: [],
  hiringWorkModes: [],
};

const getStatus = (status) => {
  if (status === "verified") {
    return {
      label: "Verified",
      className: "verified",
      icon: <CheckCircle2 size={17} />,
    };
  }

  if (status === "pending") {
    return {
      label: "Under Review",
      className: "pending",
      icon: <Clock3 size={17} />,
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      className: "rejected",
      icon: <AlertCircle size={17} />,
    };
  }

  return {
    label: "Not Verified",
    className: "unverified",
    icon: <ShieldCheck size={17} />,
  };
};

const CompanyProfileEdit = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [verificationStatus, setVerificationStatus] =
    useState("unverified");
  const [verificationNotes, setVerificationNotes] =
    useState("");

  const [locationInput, setLocationInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [hiringLocationInput, setHiringLocationInput] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCompany = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/company/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load company profile."
          );
        }

        const company =
          data.company ||
          data.data ||
          data;

        setForm({
          companyName: company.companyName || "",
          legalName: company.legalName || "",
          description: company.description || "",
          industry: company.industry || "",
          companyType: company.companyType || "",
          companySize: company.companySize || "",
          foundedYear: company.foundedYear || "",
          companyStage: company.companyStage || "",
          website: company.website || "",
          linkedinUrl: company.linkedinUrl || "",
          headquarters:
            company.headquarters ||
            company.location ||
            "",
          locations: Array.isArray(company.locations)
            ? company.locations
            : [],
          contactEmail: company.contactEmail || "",
          contactPhone: company.contactPhone || "",
          logoUrl: company.logoUrl || "",
          hiringRoles: Array.isArray(
            company.hiringRoles
          )
            ? company.hiringRoles
            : [],
          hiringLocations: Array.isArray(
            company.hiringLocations
          )
            ? company.hiringLocations
            : [],
          hiringWorkModes: Array.isArray(
            company.hiringWorkModes
          )
            ? company.hiringWorkModes
            : [],
        });

        setVerificationStatus(
          company.verificationStatus || "unverified"
        );

        setVerificationNotes(
          company.verificationNotes || ""
        );
      } catch (err) {
        console.error("Company edit profile error:", err);
        setError(
          err.message ||
            "Unable to load company profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [navigate, token]);

  const completion = useMemo(() => {
    const requiredFields = [
      form.companyName,
      form.industry,
      form.companySize,
      form.description,
      form.headquarters,
      form.contactEmail,
    ];

    const completed = requiredFields.filter(
      Boolean
    ).length;

    return Math.round(
      (completed / requiredFields.length) * 100
    );
  }, [form]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSuccess("");
    setError("");
  };

  const addToArray = (
    field,
    value,
    clearInput
  ) => {
    const cleanValue = value.trim();

    if (!cleanValue) return;

    if (form[field].includes(cleanValue)) {
      clearInput("");
      return;
    }

    setForm((previous) => ({
      ...previous,
      [field]: [
        ...previous[field],
        cleanValue,
      ],
    }));

    clearInput("");
    setSuccess("");
  };

  const removeFromArray = (
    field,
    index
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: previous[field].filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));

    setSuccess("");
  };

  const toggleWorkMode = (mode) => {
    setForm((previous) => {
      const exists =
        previous.hiringWorkModes.includes(mode);

      return {
        ...previous,
        hiringWorkModes: exists
          ? previous.hiringWorkModes.filter(
              (item) => item !== mode
            )
          : [
              ...previous.hiringWorkModes,
              mode,
            ],
      };
    });

    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.companyName.trim()) {
        throw new Error(
          "Company name is required."
        );
      }

      if (!form.industry.trim()) {
        throw new Error(
          "Industry is required."
        );
      }

      if (!form.companySize) {
        throw new Error(
          "Company size is required."
        );
      }

      if (!form.description.trim()) {
        throw new Error(
          "Company description is required."
        );
      }

      if (!form.headquarters.trim()) {
        throw new Error(
          "Headquarters is required."
        );
      }

      if (!form.contactEmail.trim()) {
        throw new Error(
          "Contact email is required."
        );
      }

      const payload = {
        companyName: form.companyName.trim(),
        legalName: form.legalName.trim(),
        description: form.description.trim(),
        industry: form.industry.trim(),
        companyType: form.companyType,
        companySize: form.companySize,
        foundedYear: form.foundedYear
          ? Number(form.foundedYear)
          : null,
        companyStage: form.companyStage,
        website: form.website.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        headquarters: form.headquarters.trim(),
        locations: form.locations,
        contactEmail:
          form.contactEmail.trim(),
        contactPhone:
          form.contactPhone.trim(),
        logoUrl: form.logoUrl.trim(),
        hiringRoles: form.hiringRoles,
        hiringLocations:
          form.hiringLocations,
        hiringWorkModes:
          form.hiringWorkModes,
      };

      const response = await fetch(
        `${API_URL}/company/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update company profile."
        );
      }

      const updatedCompany =
        data.company || data.data;

      if (updatedCompany) {
        setVerificationStatus(
          updatedCompany.verificationStatus ||
            "unverified"
        );

        setVerificationNotes(
          updatedCompany.verificationNotes ||
            ""
        );
      }

      setSuccess(
        "Company profile updated successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Update company profile error:",
        err
      );

      setError(
        err.message ||
          "Unable to update company profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <CompanySidebar />

        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.loadingHeader} />

            <div className={styles.loadingGrid}>
              <div className={styles.loadingCard} />
              <div className={styles.loadingSide} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const status = getStatus(
    verificationStatus
  );

  return (
    <div className={styles.page}>
      <CompanySidebar />

      <main className={styles.main}>
        {/* TOP BAR */}
        <header className={styles.topbar}>
          <button
            className={styles.backButton}
            onClick={() =>
              navigate("/company/profile")
            }
          >
            <ArrowLeft size={16} />
            Company Profile
          </button>

          <div className={styles.topbarTitle}>
            Edit Profile
          </div>

          <div className={styles.topbarSpacer} />
        </header>

        <div className={styles.content}>
          {/* HEADER */}
          <div className={styles.pageHeader}>
            <div>
              <div className={styles.eyebrow}>
                COMPANY PROFILE
              </div>

              <h1>Edit your company profile</h1>

              <p>
                Update the information students see
                about your company.
              </p>
            </div>
          </div>

          {/* VERIFICATION WARNING */}
          {verificationStatus === "verified" && (
            <div className={styles.warning}>
              <div className={styles.warningIcon}>
                <AlertCircle size={18} />
              </div>

              <div>
                <strong>
                  Profile changes require review
                </strong>

                <p>
                  Updating a verified company profile
                  will send it back for verification.
                  Your currently approved jobs may be
                  temporarily closed until verification
                  is complete.
                </p>
              </div>
            </div>
          )}

          {verificationStatus === "rejected" &&
            verificationNotes && (
              <div className={styles.rejection}>
                <div className={styles.rejectionIcon}>
                  <AlertCircle size={18} />
                </div>

                <div>
                  <strong>
                    Verification feedback
                  </strong>

                  <p>{verificationNotes}</p>
                </div>
              </div>
            )}

          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              <CheckCircle2 size={17} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.layout}>
              {/* MAIN FORM */}
              <div className={styles.formColumn}>
                {/* BASIC INFORMATION */}
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>Basic Information</h2>
                      <p>
                        The basic information students
                        will see first.
                      </p>
                    </div>

                    <div className={styles.cardIcon}>
                      <Building2 size={18} />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label>
                        Company name
                        <span>*</span>
                      </label>

                      <div className={styles.inputWrap}>
                        <Building2 size={16} />

                        <input
                          type="text"
                          value={form.companyName}
                          onChange={(event) =>
                            updateField(
                              "companyName",
                              event.target.value
                            )
                          }
                          placeholder="e.g. TechSolutions Inc."
                          maxLength={150}
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>
                        Legal name
                      </label>

                      <div className={styles.inputWrap}>
                        <Building2 size={16} />

                        <input
                          type="text"
                          value={form.legalName}
                          onChange={(event) =>
                            updateField(
                              "legalName",
                              event.target.value
                            )
                          }
                          placeholder="Registered legal name"
                          maxLength={200}
                        />
                      </div>
                    </div>

                    <div
                      className={`${styles.field} ${styles.full}`}
                    >
                      <label>
                        Company description
                        <span>*</span>
                      </label>

                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          updateField(
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Tell students what your company does, what you build, and what makes your company different."
                        maxLength={3000}
                        rows={6}
                      />

                      <div className={styles.characterCount}>
                        {form.description.length}/3000
                      </div>
                    </div>
                  </div>
                </section>

                {/* COMPANY DETAILS */}
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>Company Details</h2>
                      <p>
                        Help students understand your
                        organization.
                      </p>
                    </div>

                    <div className={styles.cardIcon}>
                      <BriefcaseBusiness size={18} />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label>
                        Industry
                        <span>*</span>
                      </label>

                      <div className={styles.inputWrap}>
                        <BriefcaseBusiness size={16} />

                        <input
                          type="text"
                          value={form.industry}
                          onChange={(event) =>
                            updateField(
                              "industry",
                              event.target.value
                            )
                          }
                          placeholder="e.g. Software Development"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>
                        Company type
                      </label>

                      <select
                        value={form.companyType}
                        onChange={(event) =>
                          updateField(
                            "companyType",
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Select company type
                        </option>

                        {COMPANY_TYPES.map(
                          (type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {type}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label>
                        Company size
                        <span>*</span>
                      </label>

                      <select
                        value={form.companySize}
                        onChange={(event) =>
                          updateField(
                            "companySize",
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Select company size
                        </option>

                        {COMPANY_SIZES.map(
                          (size) => (
                            <option
                              key={size}
                              value={size}
                            >
                              {size}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label>
                        Company stage
                      </label>

                      <select
                        value={form.companyStage}
                        onChange={(event) =>
                          updateField(
                            "companyStage",
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Select company stage
                        </option>

                        {COMPANY_STAGES.map(
                          (stage) => (
                            <option
                              key={stage}
                              value={stage}
                            >
                              {stage}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label>
                        Founded year
                      </label>

                      <div className={styles.inputWrap}>
                        <CalendarDays size={16} />

                        <input
                          type="number"
                          min="1800"
                          max={
                            new Date().getFullYear()
                          }
                          value={form.foundedYear}
                          onChange={(event) =>
                            updateField(
                              "foundedYear",
                              event.target.value
                            )
                          }
                          placeholder="e.g. 2018"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* LOCATION */}
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>Location</h2>
                      <p>
                        Tell students where your company
                        operates.
                      </p>
                    </div>

                    <div className={styles.cardIcon}>
                      <MapPin size={18} />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div
                      className={`${styles.field} ${styles.full}`}
                    >
                      <label>
                        Headquarters
                        <span>*</span>
                      </label>

                      <div className={styles.inputWrap}>
                        <MapPin size={16} />

                        <input
                          type="text"
                          value={form.headquarters}
                          onChange={(event) =>
                            updateField(
                              "headquarters",
                              event.target.value
                            )
                          }
                          placeholder="e.g. Noida, Uttar Pradesh, India"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.arraySection}>
                    <label>Additional locations</label>

                    <div className={styles.addRow}>
                      <div
                        className={styles.inputWrap}
                      >
                        <MapPin size={16} />

                        <input
                          type="text"
                          value={locationInput}
                          onChange={(event) =>
                            setLocationInput(
                              event.target.value
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter"
                            ) {
                              event.preventDefault();

                              addToArray(
                                "locations",
                                locationInput,
                                setLocationInput
                              );
                            }
                          }}
                          placeholder="Add another city or location"
                        />
                      </div>

                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={() =>
                          addToArray(
                            "locations",
                            locationInput,
                            setLocationInput
                          )
                        }
                      >
                        <Plus size={15} />
                        Add
                      </button>
                    </div>

                    {form.locations.length > 0 && (
                      <div className={styles.tags}>
                        {form.locations.map(
                          (location, index) => (
                            <span key={index}>
                              <MapPin size={13} />
                              {location}

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromArray(
                                    "locations",
                                    index
                                  )
                                }
                              >
                                <X size={13} />
                              </button>
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* ONLINE PRESENCE */}
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>Online Presence</h2>
                      <p>
                        Add links students can use to
                        learn more about your company.
                      </p>
                    </div>

                    <div className={styles.cardIcon}>
                      <Globe size={18} />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label>Website</label>

                      <div className={styles.inputWrap}>
                        <Globe size={16} />

                        <input
                          type="url"
                          value={form.website}
                          onChange={(event) =>
                            updateField(
                              "website",
                              event.target.value
                            )
                          }
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>LinkedIn</label>

                      <div className={styles.inputWrap}>
                        <span
                          className={
                            styles.linkedinMark
                          }
                        >
                          in
                        </span>

                        <input
                          type="url"
                          value={form.linkedinUrl}
                          onChange={(event) =>
                            updateField(
                              "linkedinUrl",
                              event.target.value
                            )
                          }
                          placeholder="https://linkedin.com/company/..."
                        />
                      </div>
                    </div>

                    <div
                      className={`${styles.field} ${styles.full}`}
                    >
                      <label>
                        Company logo URL
                      </label>

                      <div className={styles.inputWrap}>
                        <Globe size={16} />

                        <input
                          type="url"
                          value={form.logoUrl}
                          onChange={(event) =>
                            updateField(
                              "logoUrl",
                              event.target.value
                            )
                          }
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* HIRING */}
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>Hiring Information</h2>
                      <p>
                        Tell students what kinds of
                        opportunities you usually offer.
                      </p>
                    </div>

                    <div className={styles.cardIcon}>
                      <Users size={18} />
                    </div>
                  </div>

                  <div className={styles.arraySection}>
                    <label>Hiring roles</label>

                    <div className={styles.addRow}>
                      <div
                        className={styles.inputWrap}
                      >
                        <BriefcaseBusiness
                          size={16}
                        />

                        <input
                          type="text"
                          value={roleInput}
                          onChange={(event) =>
                            setRoleInput(
                              event.target.value
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter"
                            ) {
                              event.preventDefault();

                              addToArray(
                                "hiringRoles",
                                roleInput,
                                setRoleInput
                              );
                            }
                          }}
                          placeholder="e.g. Frontend Developer"
                        />
                      </div>

                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={() =>
                          addToArray(
                            "hiringRoles",
                            roleInput,
                            setRoleInput
                          )
                        }
                      >
                        <Plus size={15} />
                        Add
                      </button>
                    </div>

                    {form.hiringRoles.length > 0 && (
                      <div className={styles.tags}>
                        {form.hiringRoles.map(
                          (role, index) => (
                            <span key={index}>
                              {role}

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromArray(
                                    "hiringRoles",
                                    index
                                  )
                                }
                              >
                                <X size={13} />
                              </button>
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.arraySection}>
                    <label>
                      Hiring locations
                    </label>

                    <div className={styles.addRow}>
                      <div
                        className={styles.inputWrap}
                      >
                        <MapPin size={16} />

                        <input
                          type="text"
                          value={
                            hiringLocationInput
                          }
                          onChange={(event) =>
                            setHiringLocationInput(
                              event.target.value
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter"
                            ) {
                              event.preventDefault();

                              addToArray(
                                "hiringLocations",
                                hiringLocationInput,
                                setHiringLocationInput
                              );
                            }
                          }}
                          placeholder="e.g. Noida"
                        />
                      </div>

                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={() =>
                          addToArray(
                            "hiringLocations",
                            hiringLocationInput,
                            setHiringLocationInput
                          )
                        }
                      >
                        <Plus size={15} />
                        Add
                      </button>
                    </div>

                    {form.hiringLocations.length >
                      0 && (
                      <div className={styles.tags}>
                        {form.hiringLocations.map(
                          (location, index) => (
                            <span key={index}>
                              <MapPin size={13} />
                              {location}

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromArray(
                                    "hiringLocations",
                                    index
                                  )
                                }
                              >
                                <X size={13} />
                              </button>
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.arraySection}>
                    <label>
                      Preferred work modes
                    </label>

                    <div className={styles.workModes}>
                      {WORK_MODES.map((mode) => {
                        const active =
                          form.hiringWorkModes.includes(
                            mode
                          );

                        return (
                          <button
                            type="button"
                            key={mode}
                            className={
                              active
                                ? styles.workModeActive
                                : styles.workMode
                            }
                            onClick={() =>
                              toggleWorkMode(mode)
                            }
                          >
                            {active && (
                              <CheckCircle2
                                size={14}
                              />
                            )}

                            {mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* CONTACT */}
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>
                        Contact Information
                      </h2>
                      <p>
                        Contact details used for your
                        company profile.
                      </p>
                    </div>

                    <div className={styles.cardIcon}>
                      <Mail size={18} />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label>
                        Contact email
                        <span>*</span>
                      </label>

                      <div className={styles.inputWrap}>
                        <Mail size={16} />

                        <input
                          type="email"
                          value={form.contactEmail}
                          onChange={(event) =>
                            updateField(
                              "contactEmail",
                              event.target.value
                            )
                          }
                          placeholder="hr@company.com"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>
                        Contact phone
                      </label>

                      <div className={styles.inputWrap}>
                        <Phone size={16} />

                        <input
                          type="tel"
                          value={form.contactPhone}
                          onChange={(event) =>
                            updateField(
                              "contactPhone",
                              event.target.value
                            )
                          }
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT SIDEBAR */}
              <aside className={styles.sideColumn}>
                <div className={styles.sticky}>
                  {/* COMPLETION */}
                  <div className={styles.sideCard}>
                    <div className={styles.sideTitle}>
                      <h3>Profile completion</h3>

                      <strong>
                        {completion}%
                      </strong>
                    </div>

                    <div
                      className={
                        styles.progressTrack
                      }
                    >
                      <div
                        className={
                          styles.progressFill
                        }
                        style={{
                          width: `${completion}%`,
                        }}
                      />
                    </div>

                    <p className={styles.sideDescription}>
                      Complete all required information
                      to keep your profile ready for
                      students.
                    </p>

                    <div
                      className={styles.requiredList}
                    >
                      <div>
                        <span
                          className={
                            form.companyName
                              ? styles.done
                              : ""
                          }
                        >
                          {form.companyName
                            ? "✓"
                            : "○"}
                        </span>
                        Company name
                      </div>

                      <div>
                        <span
                          className={
                            form.industry
                              ? styles.done
                              : ""
                          }
                        >
                          {form.industry
                            ? "✓"
                            : "○"}
                        </span>
                        Industry
                      </div>

                      <div>
                        <span
                          className={
                            form.companySize
                              ? styles.done
                              : ""
                          }
                        >
                          {form.companySize
                            ? "✓"
                            : "○"}
                        </span>
                        Company size
                      </div>

                      <div>
                        <span
                          className={
                            form.description
                              ? styles.done
                              : ""
                          }
                        >
                          {form.description
                            ? "✓"
                            : "○"}
                        </span>
                        Description
                      </div>

                      <div>
                        <span
                          className={
                            form.headquarters
                              ? styles.done
                              : ""
                          }
                        >
                          {form.headquarters
                            ? "✓"
                            : "○"}
                        </span>
                        Headquarters
                      </div>

                      <div>
                        <span
                          className={
                            form.contactEmail
                              ? styles.done
                              : ""
                          }
                        >
                          {form.contactEmail
                            ? "✓"
                            : "○"}
                        </span>
                        Contact email
                      </div>
                    </div>
                  </div>

                  {/* STATUS */}
                  <div className={styles.sideCard}>
                    <h3>Verification</h3>

                    <div
                      className={`${styles.statusBox} ${
                        styles[
                          `status${status.className}`
                        ]
                      }`}
                    >
                      {status.icon}

                      <div>
                        <strong>
                          {status.label}
                        </strong>

                        <span>
                          {verificationStatus ===
                          "verified"
                            ? "Your company is verified."
                            : verificationStatus ===
                              "pending"
                            ? "Your profile is under review."
                            : verificationStatus ===
                              "rejected"
                            ? "Profile needs attention."
                            : "Verification has not started."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SAVE */}
                  <div className={styles.sideCard}>
                    <button
                      type="submit"
                      className={
                        styles.saveButton
                      }
                      disabled={saving}
                    >
                      <Save size={16} />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      className={
                        styles.cancelButton
                      }
                      onClick={() =>
                        navigate(
                          "/company/profile"
                        )
                      }
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <p className={styles.saveNote}>
                      Changes to verified company
                      profiles may require another
                      verification review.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CompanyProfileEdit;