import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  RefreshCw,
  MoreHorizontal,
  ExternalLink,
  Mail,
  MapPin,
  CalendarDays,
  BriefcaseBusiness,
  AlertCircle,
  X,
} from "lucide-react";

import styles from "./AdminDashboard.module.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    companies: 0,
    verifiedCompanies: 0,
    unverifiedCompanies: 0,
  });

  const [companies, setCompanies] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const [verificationNotes, setVerificationNotes] = useState("");

  const token = localStorage.getItem("token");

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      const response = await fetch(
        `${API_URL}/admin/dashboard/stats`,
        {
          headers: getHeaders(),
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load dashboard statistics."
        );
      }

      setStats(
        data.stats || {
          students: 0,
          companies: 0,
          verifiedCompanies: 0,
          unverifiedCompanies: 0,
        }
      );
    } catch (error) {
      console.error("Admin stats error:", error);
      showToast(
        error.message || "Unable to load dashboard statistics.",
        "error"
      );
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);

      const response = await fetch(`${API_URL}/admin/companies`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load companies."
        );
      }

      setCompanies(data.companies || []);
    } catch (error) {
      console.error("Companies error:", error);
      showToast(
        error.message || "Unable to load companies.",
        "error"
      );
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadDashboard = async () => {
    await Promise.all([fetchStats(), fetchCompanies()]);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadDashboard();

    setRefreshing(false);
    showToast("Dashboard refreshed.");
  };

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return companies.filter((company) => {
      const user = company.user || {};

      const matchesSearch =
        !query ||
        company.companyName?.toLowerCase().includes(query) ||
        company.industry?.toLowerCase().includes(query) ||
        company.headquarters?.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);

      const currentStatus =
        company.verificationStatus === "approved"
          ? "verified"
          : company.verificationStatus;

      const matchesStatus =
        statusFilter === "all" ||
        currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [companies, search, statusFilter]);

  const openCompany = (company) => {
    setSelectedCompany(company);
    setVerificationNotes(company.verificationNotes || "");
  };

  const closeCompany = () => {
    if (actionLoading) return;

    setSelectedCompany(null);
    setVerificationNotes("");
  };

  const updateCompanyStatus = async (status) => {
    if (!selectedCompany || actionLoading) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_URL}/admin/companies/${selectedCompany._id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            status,
            notes: verificationNotes,
          }),
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update company status."
        );
      }

      const updatedCompany = data.company;

      setCompanies((previous) =>
        previous.map((company) =>
          company._id === updatedCompany._id
            ? updatedCompany
            : company
        )
      );

      setSelectedCompany(updatedCompany);

      await fetchStats();

      showToast(
        status === "verified"
          ? "Company verified successfully."
          : "Company marked as unverified."
      );
    } catch (error) {
      console.error("Company status update error:", error);

      showToast(
        error.message || "Unable to update company status.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatus = (company) => {
    if (company.verificationStatus === "approved") {
      return "verified";
    }

    return company.verificationStatus || "unverified";
  };

  const getStatusLabel = (status) => {
    const labels = {
      verified: "Verified",
      unverified: "Unverified",
      pending: "Pending",
      rejected: "Rejected",
      approved: "Verified",
    };

    return labels[status] || status;
  };

  const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/);

    if (!parts.length) return "C";

    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <ShieldCheck size={22} />
          </div>

          <div>
            <strong>StudentPath</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className={styles.navigation}>
          <div className={styles.navSection}>
            <span className={styles.navLabel}>Overview</span>

            <a
              href="/admin/dashboard"
              className={`${styles.navItem} ${styles.activeNav}`}
            >
              <ShieldCheck size={18} />
              Dashboard
            </a>
          </div>

          <div className={styles.navSection}>
            <span className={styles.navLabel}>Management</span>

            <a href="/admin/companies" className={styles.navItem}>
              <Building2 size={18} />
              Companies
            </a>

            <a href="/admin/students" className={styles.navItem}>
              <Users size={18} />
              Students
            </a>

            <a href="/admin/jobs" className={styles.navItem}>
              <BriefcaseBusiness size={18} />
              Jobs
            </a>
          </div>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.adminCard}>
            <div className={styles.adminAvatar}>A</div>

            <div>
              <strong>Administrator</strong>
              <span>Platform Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>
              Admin
              <span>/</span>
              Dashboard
            </div>

            <h1>Admin Dashboard</h1>

            <p>
              Monitor companies, students and verification activity
              across StudentPath.
            </p>
          </div>

          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? styles.spin : ""}
            />
            Refresh
          </button>
        </header>

        {/* Stats */}
        <section className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                <Users size={21} />
              </div>

              <span className={styles.statTag}>Students</span>
            </div>

            <div className={styles.statValue}>
              {loadingStats ? "—" : stats.students.toLocaleString()}
            </div>

            <span className={styles.statDescription}>
              Active student accounts
            </span>
          </div>

          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                <Building2 size={21} />
              </div>

              <span className={styles.statTag}>Companies</span>
            </div>

            <div className={styles.statValue}>
              {loadingStats ? "—" : stats.companies.toLocaleString()}
            </div>

            <span className={styles.statDescription}>
              Registered companies
            </span>
          </div>

          <div className={`${styles.statCard} ${styles.statVerified}`}>
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                <CheckCircle2 size={21} />
              </div>

              <span className={styles.statTag}>Verified</span>
            </div>

            <div className={styles.statValue}>
              {loadingStats
                ? "—"
                : stats.verifiedCompanies.toLocaleString()}
            </div>

            <span className={styles.statDescription}>
              Companies approved for hiring
            </span>
          </div>

          <div className={`${styles.statCard} ${styles.statOrange}`}>
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                <Clock3 size={21} />
              </div>

              <span className={styles.statTag}>Unverified</span>
            </div>

            <div className={styles.statValue}>
              {loadingStats
                ? "—"
                : stats.unverifiedCompanies.toLocaleString()}
            </div>

            <span className={styles.statDescription}>
              Companies requiring attention
            </span>
          </div>
        </section>

        {/* Company management */}
        <section className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitleRow}>
                <h2>Company Verification</h2>

                <span className={styles.countBadge}>
                  {filteredCompanies.length}
                </span>
              </div>

              <p>
                Review registered companies and manage their
                verification status.
              </p>
            </div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} />

              <input
                type="text"
                placeholder="Search company, industry or email..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setSearch("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className={styles.filters}>
              {[
                ["all", "All"],
                ["verified", "Verified"],
                ["unverified", "Unverified"],
                ["pending", "Pending"],
                ["rejected", "Rejected"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`${styles.filterButton} ${
                    statusFilter === value
                      ? styles.activeFilter
                      : ""
                  }`}
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {loadingCompanies ? (
              <div className={styles.loadingState}>
                <RefreshCw
                  size={22}
                  className={styles.spin}
                />
                <span>Loading companies...</span>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Building2 size={25} />
                </div>

                <h3>No companies found</h3>

                <p>
                  Try changing your search or verification filter.
                </p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Industry</th>
                    <th>Location</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCompanies.map((company) => {
                    const status = getStatus(company);
                    const user = company.user || {};

                    return (
                      <tr key={company._id}>
                        <td>
                          <div className={styles.companyCell}>
                            <div className={styles.companyLogo}>
                              {company.logoUrl ? (
                                <img
                                  src={company.logoUrl}
                                  alt=""
                                />
                              ) : (
                                getInitials(
                                  company.companyName
                                )
                              )}
                            </div>

                            <div>
                              <strong>
                                {company.companyName ||
                                  "Unnamed Company"}
                              </strong>

                              <span>
                                {user.email ||
                                  company.contactEmail ||
                                  "No email"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={styles.industry}>
                            {company.industry || "—"}
                          </span>
                        </td>

                        <td>
                          <div className={styles.locationCell}>
                            <MapPin size={14} />

                            <span>
                              {company.headquarters || "—"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className={styles.dateCell}>
                            <CalendarDays size={14} />
                            {formatDate(company.createdAt)}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              styles[`status_${status}`]
                            }`}
                          >
                            <span />
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td>
                          <button
                            className={styles.viewButton}
                            onClick={() =>
                              openCompany(company)
                            }
                          >
                            Review
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Company drawer */}
      {selectedCompany && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCompany();
            }
          }}
        >
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <span className={styles.drawerEyebrow}>
                  Company Review
                </span>

                <h2>
                  {selectedCompany.companyName ||
                    "Company"}
                </h2>
              </div>

              <button
                className={styles.closeButton}
                onClick={closeCompany}
              >
                <X size={19} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.profileHero}>
                <div className={styles.largeLogo}>
                  {selectedCompany.logoUrl ? (
                    <img
                      src={selectedCompany.logoUrl}
                      alt=""
                    />
                  ) : (
                    getInitials(
                      selectedCompany.companyName
                    )
                  )}
                </div>

                <div>
                  <h3>
                    {selectedCompany.companyName ||
                      "Unnamed Company"}
                  </h3>

                  <p>
                    {selectedCompany.industry ||
                      "Industry not provided"}
                  </p>

                  <span
                    className={`${styles.statusBadge} ${
                      styles[
                        `status_${getStatus(
                          selectedCompany
                        )}`
                      ]
                    }`}
                  >
                    <span />
                    {getStatusLabel(
                      getStatus(selectedCompany)
                    )}
                  </span>
                </div>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span>Company type</span>
                  <strong>
                    {selectedCompany.companyType || "—"}
                  </strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Company size</span>
                  <strong>
                    {selectedCompany.companySize || "—"}
                  </strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Founded</span>
                  <strong>
                    {selectedCompany.foundedYear || "—"}
                  </strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Stage</span>
                  <strong>
                    {selectedCompany.companyStage || "—"}
                  </strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Headquarters</span>
                  <strong>
                    {selectedCompany.headquarters || "—"}
                  </strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Joined</span>
                  <strong>
                    {formatDate(
                      selectedCompany.createdAt
                    )}
                  </strong>
                </div>
              </div>

              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>
                  <span>About company</span>
                </div>

                <p className={styles.description}>
                  {selectedCompany.description ||
                    "No company description provided."}
                </p>
              </div>

              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>
                  <span>Contact</span>
                </div>

                <div className={styles.contactList}>
                  <div>
                    <Mail size={16} />
                    <span>
                      {selectedCompany.contactEmail ||
                        selectedCompany.user?.email ||
                        "—"}
                    </span>
                  </div>

                  <div>
                    <span className={styles.phoneIcon}>☎</span>
                    <span>
                      {selectedCompany.contactPhone ||
                        "—"}
                    </span>
                  </div>

                  {selectedCompany.website && (
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={16} />
                      <span>Company website</span>
                    </a>
                  )}
                </div>
              </div>

              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>
                  <span>Verification notes</span>
                  <span>
                    {verificationNotes.length}/2000
                  </span>
                </div>

                <textarea
                  value={verificationNotes}
                  onChange={(event) =>
                    setVerificationNotes(
                      event.target.value.slice(0, 2000)
                    )
                  }
                  placeholder="Add notes about the verification decision..."
                  className={styles.notesInput}
                  maxLength={2000}
                />
              </div>

              {selectedCompany.verificationNotes && (
                <div className={styles.existingNote}>
                  <AlertCircle size={16} />

                  <div>
                    <strong>Previous note</strong>

                    <p>
                      {selectedCompany.verificationNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.drawerFooter}>
              <button
                className={styles.cancelAction}
                onClick={closeCompany}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <div className={styles.statusActions}>
                <button
                  className={styles.unverifyButton}
                  onClick={() =>
                    updateCompanyStatus("unverified")
                  }
                  disabled={actionLoading}
                >
                  <XCircle size={16} />
                  Unverify
                </button>

                <button
                  className={styles.verifyButton}
                  onClick={() =>
                    updateCompanyStatus("verified")
                  }
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw
                      size={16}
                      className={styles.spin}
                    />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}

                  Verify company
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "error"
              ? styles.toastError
              : styles.toastSuccess
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}

          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;