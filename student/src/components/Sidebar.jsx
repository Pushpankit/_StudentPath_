
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Compass,
  ClipboardCheck,
  FileCheck2,
  Bookmark,
  Target,
  UserRound,
  LogOut,
  MoreHorizontal,
  X,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";

import styles from "./Sidebar.module.css";

function Sidebar() {
  const navigate = useNavigate();

  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      mobile: true,
    },
    {
      label: "Opportunities",
      path: "/jobs",
      icon: BriefcaseBusiness,
      mobile: true,
    },
    {
      label: "Careers",
      path: "/careers",
      icon: Compass,
      mobile: false,
    },
    {
      label: "Action Plan",
      path: "/action-plan",
      icon: ClipboardCheck,
      mobile: false,
    },
      {
      label: "Skill Gap",
      path: "/skill-gap",
      icon: Target,
      mobile: false,
    },
    {
      label: "Applications",
      path: "/applications",
      icon: FileCheck2,
      mobile: false,
    },
    {
      label: "Saved Jobs",
      path: "/saved",
      icon: Bookmark,
      mobile: false,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: UserRound,
      mobile: true,
    },
  ];

  const mobileItems = navItems.filter(
    (item) => item.mobile
  );

  const moreItems = navItems.filter(
    (item) => !item.mobile
  );

  const handleMoreItemClick = () => {
    setMoreOpen(false);
  };

  return (
    <>
      {/* =========================================
          DESKTOP SIDEBAR
          ========================================= */}

      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoMark}>
            S
          </div>

          <div className={styles.logoContent}>
            <span className={styles.logoText}>
              StudentPath
            </span>

            {/* <span className={styles.logoSubtext}>
              Your career journey
            </span> */}
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
                    {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? styles.activeLink
                    : styles.link
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={styles.iconWrapper}>
                      <Icon
                        size={18}
                        strokeWidth={
                          isActive ? 2.2 : 1.9
                        }
                      />
                    </span>

                    <span className={styles.linkText}>
                      {item.label}
                    </span>

                    {isActive && (
                      <span
                        className={styles.activeIndicator}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={styles.bottom}>
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
            type="button"
          >
            <span className={styles.logoutIcon}>
              <LogOut
                size={18}
                strokeWidth={1.9}
              />
            </span>

            <span>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* =========================================
          MOBILE MORE MENU
          ========================================= */}

      {moreOpen && (
        <>
          <div
            className={styles.mobileOverlay}
            onClick={() => setMoreOpen(false)}
          />

          <div className={styles.moreMenu}>
            <div className={styles.moreMenuHeader}>
              <div>
                <span className={styles.moreTitle}>
                  More
                </span>

                <span className={styles.moreSubtitle}>
                  More options
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
              >
                <X size={19} />
              </button>
            </div>

            <div className={styles.moreItems}>
              {moreItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleMoreItemClick}
                    className={({ isActive }) =>
                      isActive
                        ? styles.moreItemActive
                        : styles.moreItem
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={styles.moreIcon}>
                          <Icon
                            size={20}
                            strokeWidth={
                              isActive ? 2.1 : 1.9
                            }
                          />
                        </span>

                        <span>
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}

              <button
                type="button"
                className={styles.mobileLogout}
                onClick={handleLogout}
              >
                <span>
                  <LogOut
                    size={20}
                    strokeWidth={1.9}
                  />
                </span>

                <span>
                  Logout
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* =========================================
          MOBILE BOTTOM NAVIGATION
          ========================================= */}

      <nav className={styles.mobileBottomNav}>
        {mobileItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? styles.mobileNavItemActive
                  : styles.mobileNavItem
              }
              onClick={() => setMoreOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <span className={styles.mobileIcon}>
                    <Icon
                      size={21}
                      strokeWidth={
                        isActive ? 2.2 : 1.8
                      }
                    />
                  </span>

                  <span>
                    {item.label === "Dashboard"
                      ? "Home"
                      : item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          className={
            moreOpen
              ? styles.mobileMoreActive
              : styles.mobileNavItem
          }
          onClick={() =>
            setMoreOpen((previous) => !previous)
          }
          aria-label="More options"
          aria-expanded={moreOpen}
        >
          <span className={styles.mobileIcon}>
            <MoreHorizontal
              size={22}
              strokeWidth={
                moreOpen ? 2.2 : 1.8
              }
            />
          </span>

          <span>
            More
          </span>
        </button>
      </nav>
    </>
  );
}

export default Sidebar;

