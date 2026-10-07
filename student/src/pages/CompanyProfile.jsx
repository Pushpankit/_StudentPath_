import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  CalendarDays,
  BriefcaseBusiness,
  ExternalLink,
  Pencil,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ShieldCheck,
//   Linkedin,
  ChevronDown,
} from "lucide-react";

import CompanySidebar from "../components/CompanySidebar";
import styles from "./CompanyProfile.module.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getStatusInfo = (status) => {
  switch (status) {
    case "verified":
      return {
        label: "Verified",
        className: "verified",
        icon: <CheckCircle2 size={17} />,
        description:
          "Your company has been verified and can post jobs on StudentPath.",
      };

    case "pending":
      return {
        label: "Under Review",
        className: "pending",
        icon: <Clock3 size={17} />,
        description:
          "Your company profile is currently being reviewed.",
      };

    case "rejected":
      return {
        label: "Verification Rejected",
        className: "rejected",
        icon: <AlertCircle size={17} />,
        description:
          "Please review the verification notes and update your profile.",
      };

    default:
      return {
        label: "Not Verified",
        className: "unverified",
        icon: <ShieldCheck size={17} />,
        description:
          "Complete your company profile to begin the verification process.",
      };
  }
};

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const CompanyProfile = () => {
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
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

        const [companyResponse, jobsResponse, applicationsResponse] =
          await Promise.all([
            fetch(`${API_URL}/company/me`, {
              headers,
            }),

            fetch(`${API_URL}/company/jobs`, {
              headers,
            }),

            fetch(`${API_URL}/applications/company`, {
              headers,
            }),
          ]);

        if (
          companyResponse.status === 401 ||
          companyResponse.status === 403
        ) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!companyResponse.ok) {
          const data = await companyResponse.json().catch(() => ({}));
          throw new Error(
            data.message || "Unable to load company profile."
          );
        }

        const companyData = await companyResponse.json();
        const jobsData = jobsResponse.ok
          ? await jobsResponse.json()
          : {};
        const applicationsData = applicationsResponse.ok
          ? await applicationsResponse.json()
          : {};

        setCompany(
          companyData.company ||
            companyData.data ||
            companyData
        );

        setJobs(
          jobsData.jobs ||
            jobsData.data ||
            jobsData.results ||
            []
        );

        setApplications(
          applicationsData.applications ||
            applicationsData.data ||
            applicationsData.results ||
            []
        );
      } catch (err) {
        console.error("Company profile error:", err);
        setError(
          err.message || "Unable to load company profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, token]);

  const stats = useMemo(() => {
    const totalJobs = jobs.length;

    const activeJobs = jobs.filter(
      (job) =>
        job.status === "Approved" &&
        job.isActive === true
    ).length;

    const totalApplications = applications.length;

    return {
      totalJobs,
      activeJobs,
      totalApplications,
    };
  }, [jobs, applications]);

  if (loading) {
    return (
      <div className={styles.page}>
        <CompanySidebar />

        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.loadingHero} />
            <div className={styles.loadingGrid}>
              <div className={styles.loadingCard} />
              <div className={styles.loadingCard} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className={styles.page}>
        <CompanySidebar />

        <main className={styles.main}>
          <div className={styles.errorState}>
            <AlertCircle size={22} />

            <div>
              <h2>Unable to load profile</h2>
              <p>{error || "Company profile not found."}</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={styles.retryButton}
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const status = getStatusInfo(
    company.verificationStatus
  );

  const companyName =
    company.companyName || "Your Company";

  const description =
    company.description ||
    "Add a company description so students can learn more about your organization.";

  const headquarters =
    company.headquarters ||
    company.location ||
    "";

  const locations = Array.isArray(company.locations)
    ? company.locations
    : [];

  const hiringRoles = Array.isArray(company.hiringRoles)
    ? company.hiringRoles
    : [];

  const hiringLocations = Array.isArray(
    company.hiringLocations
  )
    ? company.hiringLocations
    : [];

  const hiringWorkModes = Array.isArray(
    company.hiringWorkModes
  )
    ? company.hiringWorkModes
    : [];

  const logoLetter =
    companyName.charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <CompanySidebar />

      <main className={styles.main}>
        {/* TOP BAR */}
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            Company
            <span>/</span>
            <strong>Profile</strong>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.companyMini}>
              <div className={styles.companyMiniLogo}>
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={companyName}
                  />
                ) : (
                  logoLetter
                )}
              </div>

              <span>{companyName}</span>

              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {/* PAGE HEADING */}
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.eyebrow}>
                COMPANY PROFILE
              </div>

              <h1>Your company profile</h1>

              <p>
                Keep your company information accurate and
                up to date for students.
              </p>
            </div>

            <button
              className={styles.editButton}
              onClick={() =>
                navigate("/company/profile/edit")
              }
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          </div>

          <div className={styles.profileLayout}>
            {/* MAIN COLUMN */}
            <section className={styles.mainColumn}>
              {/* HERO */}
              <section className={styles.heroCard}>
                <div className={styles.cover}>
                  <div className={styles.coverShapeOne} />
                  <div className={styles.coverShapeTwo} />
                  <div className={styles.coverGrid} />
                </div>

                <div className={styles.heroBody}>
                  <div className={styles.logo}>
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={companyName}
                      />
                    ) : (
                      <span>{logoLetter}</span>
                    )}
                  </div>

                  <div className={styles.heroInfo}>
                    <div className={styles.nameRow}>
                      <h2>{companyName}</h2>

                      {company.verificationStatus ===
                        "verified" && (
                        <span
                          className={styles.verifiedBadge}
                          title="Verified company"
                        >
                          <CheckCircle2 size={15} />
                        </span>
                      )}
                    </div>

                    <p className={styles.heroDescription}>
                      {company.industry ||
                        "Company on StudentPath"}
                    </p>

                    <div className={styles.heroMeta}>
                      {headquarters && (
                        <span>
                          <MapPin size={15} />
                          {headquarters}
                        </span>
                      )}

                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Globe size={15} />
                          Website
                          <ExternalLink size={12} />
                        </a>
                      )}

                      {company.companySize && (
                        <span>
                          <Users size={15} />
                          {company.companySize}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className={styles.heroEdit}
                    onClick={() =>
                      navigate("/company/profile/edit")
                    }
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </div>

                <div className={styles.heroVerification}>
                  <span className={styles.sectionLabel}>
                    Verification Status
                  </span>

                  <div
                    className={`${styles.statusLine} ${
                      styles[
                        `status${status.className}`
                      ]
                    }`}
                  >
                    {status.icon}

                    <strong>{status.label}</strong>
                  </div>

                  <p>{status.description}</p>

                  {company.verificationNotes && (
                    <div className={styles.verificationNote}>
                      {company.verificationNotes}
                    </div>
                  )}
                </div>
              </section>

              {/* ABOUT */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>About Us</h2>

                  <button
                    onClick={() =>
                      navigate("/company/profile/edit")
                    }
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </div>

                <p className={styles.aboutText}>
                  {description}
                </p>
              </section>

              {/* COMPANY DETAILS */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>Company Details</h2>

                  <button
                    onClick={() =>
                      navigate("/company/profile/edit")
                    }
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </div>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <Building2 size={17} />
                    </div>

                    <div>
                      <span>Company Name</span>
                      <strong>{companyName}</strong>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <BriefcaseBusiness size={17} />
                    </div>

                    <div>
                      <span>Industry</span>
                      <strong>
                        {company.industry || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <Users size={17} />
                    </div>

                    <div>
                      <span>Company Size</span>
                      <strong>
                        {company.companySize ||
                          "Not provided"}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <Building2 size={17} />
                    </div>

                    <div>
                      <span>Company Type</span>
                      <strong>
                        {company.companyType ||
                          "Not provided"}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <MapPin size={17} />
                    </div>

                    <div>
                      <span>Headquarters</span>
                      <strong>
                        {headquarters || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <CalendarDays size={17} />
                    </div>

                    <div>
                      <span>Founded</span>
                      <strong>
                        {company.foundedYear ||
                          "Not provided"}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <BriefcaseBusiness size={17} />
                    </div>

                    <div>
                      <span>Company Stage</span>
                      <strong>
                        {company.companyStage ||
                          "Not provided"}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* LOCATIONS */}
              {(locations.length > 0 ||
                headquarters) && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2>Locations</h2>

                    <button
                      onClick={() =>
                        navigate(
                          "/company/profile/edit"
                        )
                      }
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </div>

                  <div className={styles.locationList}>
                    {headquarters && (
                      <div className={styles.locationItem}>
                        <MapPin size={17} />

                        <div>
                          <strong>
                            {headquarters}
                          </strong>
                          <span>Headquarters</span>
                        </div>
                      </div>
                    )}

                    {locations
                      .filter(
                        (location) =>
                          location !== headquarters
                      )
                      .map((location, index) => (
                        <div
                          className={styles.locationItem}
                          key={`${location}-${index}`}
                        >
                          <MapPin size={17} />

                          <div>
                            <strong>
                              {location}
                            </strong>
                            <span>
                              Company location
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* HIRING */}
              {(hiringRoles.length > 0 ||
                hiringLocations.length > 0 ||
                hiringWorkModes.length > 0) && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2>Hiring Information</h2>

                    <button
                      onClick={() =>
                        navigate(
                          "/company/profile/edit"
                        )
                      }
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </div>

                  {hiringRoles.length > 0 && (
                    <div className={styles.hiringBlock}>
                      <span className={styles.blockLabel}>
                        Hiring Roles
                      </span>

                      <div className={styles.tags}>
                        {hiringRoles.map(
                          (role, index) => (
                            <span
                              key={`${role}-${index}`}
                            >
                              {role}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {hiringLocations.length > 0 && (
                    <div className={styles.hiringBlock}>
                      <span className={styles.blockLabel}>
                        Hiring Locations
                      </span>

                      <div className={styles.tags}>
                        {hiringLocations.map(
                          (location, index) => (
                            <span
                              key={`${location}-${index}`}
                            >
                              <MapPin size={13} />
                              {location}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {hiringWorkModes.length > 0 && (
                    <div className={styles.hiringBlock}>
                      <span className={styles.blockLabel}>
                        Work Modes
                      </span>

                      <div className={styles.tags}>
                        {hiringWorkModes.map(
                          (mode) => (
                            <span key={mode}>
                              {mode}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ONLINE PRESENCE */}
              {(company.website ||
                company.linkedinUrl) && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2>Online Presence</h2>

                    <button
                      onClick={() =>
                        navigate(
                          "/company/profile/edit"
                        )
                      }
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </div>

                  <div className={styles.socialGrid}>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.socialItem}
                      >
                        <div className={styles.socialIcon}>
                          <Globe size={18} />
                        </div>

                        <div>
                          <strong>Website</strong>
                          <span>
                            {company.website}
                          </span>
                        </div>

                        <ExternalLink size={14} />
                      </a>
                    )}

                    {company.linkedinUrl && (
                      <a
                        href={company.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.socialItem}
                      >
                        <div className={styles.linkedinIcon}>
                          in
                        </div>

                        <div>
                          <strong>LinkedIn</strong>
                          <span>
                            Company profile
                          </span>
                        </div>

                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </section>
              )}
            </section>

            {/* RIGHT COLUMN */}
            <aside className={styles.rightColumn}>
              {/* VERIFICATION */}
              <div
                className={`${styles.verificationCard} ${
                  styles[
                    `verification${status.className}`
                  ]
                }`}
              >
                <div className={styles.verificationIcon}>
                  {status.icon}
                </div>

                <div>
                  <strong>{status.label}</strong>
                  <p>{status.description}</p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className={styles.actionCard}>
                <button
                  className={styles.primaryAction}
                  onClick={() =>
                    navigate("/company/profile/edit")
                  }
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>

                {company.slug && (
                  <button
                    className={styles.secondaryAction}
                    onClick={() =>
                      navigate(
                        `/companies/${company.slug}`
                      )
                    }
                  >
                    <ExternalLink size={16} />
                    View Public Profile
                  </button>
                )}
              </div>

              {/* QUICK STATS */}
              <div className={styles.sideCard}>
                <h3>Quick Stats</h3>

                <div className={styles.statList}>
                  <div className={styles.statRow}>
                    <div
                      className={`${styles.statIcon} ${styles.blue}`}
                    >
                      <BriefcaseBusiness size={17} />
                    </div>

                    <div>
                      <span>Total Jobs Posted</span>
                      <strong>
                        {stats.totalJobs}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.statRow}>
                    <div
                      className={`${styles.statIcon} ${styles.green}`}
                    >
                      <CheckCircle2 size={17} />
                    </div>

                    <div>
                      <span>Active Jobs</span>
                      <strong>
                        {stats.activeJobs}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.statRow}>
                    <div
                      className={`${styles.statIcon} ${styles.purple}`}
                    >
                      <Users size={17} />
                    </div>

                    <div>
                      <span>Total Applications</span>
                      <strong>
                        {stats.totalApplications}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.statRow}>
                    <div
                      className={`${styles.statIcon} ${styles.orange}`}
                    >
                      <CalendarDays size={17} />
                    </div>

                    <div>
                      <span>Member Since</span>
                      <strong>
                        {formatDate(company.createdAt)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTACT */}
              <div className={styles.sideCard}>
                <h3>Contact Information</h3>

                <div className={styles.contactList}>
                  {company.contactEmail && (
                    <div className={styles.contactItem}>
                      <Mail size={17} />

                      <div>
                        <span>Email</span>
                        <strong>
                          {company.contactEmail}
                        </strong>
                      </div>
                    </div>
                  )}

                  {company.contactPhone && (
                    <div className={styles.contactItem}>
                      <Phone size={17} />

                      <div>
                        <span>Phone</span>
                        <strong>
                          {company.contactPhone}
                        </strong>
                      </div>
                    </div>
                  )}

                  {headquarters && (
                    <div className={styles.contactItem}>
                      <MapPin size={17} />

                      <div>
                        <span>Location</span>
                        <strong>
                          {headquarters}
                        </strong>
                      </div>
                    </div>
                  )}

                  {company.website && (
                    <div className={styles.contactItem}>
                      <Globe size={17} />

                      <div>
                        <span>Website</span>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* HIRING CTA */}
              {company.verificationStatus ===
                "verified" && (
                <div className={styles.hiringCta}>
                  <div className={styles.ctaIcon}>
                    <BriefcaseBusiness size={19} />
                  </div>

                  <h3>Grow your team</h3>

                  <p>
                    Find talented students for your
                    open positions.
                  </p>

                  <button
                    onClick={() =>
                      navigate("/company/jobs/create")
                    }
                  >
                    Post a Job
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyProfile;