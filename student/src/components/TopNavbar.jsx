import {
  Bell,
  ChevronDown,
  CheckCircle2,
  BriefcaseBusiness,
  Info,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import styles from "./TopNavbar.module.css";
import { useStudent } from "../context/StudentContext";

function TopNavbar() {
  const location = useLocation();
const { student: user } = useStudent();
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);

  /* =========================================
     PAGE TITLE
     ========================================= */

  const getPageTitle = () => {
    const pathname = location.pathname;

    if (pathname === "/dashboard") {
      return "Dashboard";
    }

    if (pathname === "/jobs") {
      return "Opportunities";
    }

    if (pathname.startsWith("/jobs/")) {
      return "Opportunity Details";
    }

    if (pathname === "/careers") {
      return "Careers";
    }

    if (pathname.startsWith("/careers/")) {
      return "Career Details";
    }

    if (pathname === "/action-plan") {
      return "Action Plan";
    }

    if (pathname === "/applications") {
      return "Applications";
    }

    if (pathname === "/saved") {
      return "Saved Jobs";
    }

    if (pathname === "/profile") {
      return "Profile";
    }

    if (pathname === "/skill-gap") {
      return "Skill Gap";
    }

    return "StudentPath";
  };

  /* =========================================
     CLOSE NOTIFICATIONS ON OUTSIDE CLICK
     ========================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================================
     CLOSE WITH ESC
     ========================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* =========================================
     USER INFORMATION
     ========================================= */

  const userName =
    user?.name ||
    user?.user?.name ||
    "Student";

  const userRole =
    user?.role ||
    user?.user?.role ||
    "Student";

  const firstLetter =
    userName
      .trim()
      .charAt(0)
      .toUpperCase() || "S";

  const pageTitle = getPageTitle();

  /* =========================================
     TEMPORARY NOTIFICATIONS
     ========================================= */

  const notifications = [
    {
      id: 1,
      type: "success",
      icon: CheckCircle2,
      title: "Profile updated",
      message: "Your profile information was saved successfully.",
      time: "Just now",
      unread: true,
    },
    {
      id: 2,
      type: "job",
      icon: BriefcaseBusiness,
      title: "New opportunity",
      message: "A new opportunity matches your profile.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 3,
      type: "info",
      icon: Info,
      title: "Complete your profile",
      message: "Add more skills to improve your profile match.",
      time: "Yesterday",
      unread: false,
    },
    {
      id: 4,
      type: "info",
      icon: Info,
      title: "Complete your profile",
      message: "Add more skills to improve your profile match.",
      time: "Yesterday",
      unread: false,
    },
    {
      id: 5,
      type: "info",
      icon: Info,
      title: "Complete your profile",
      message: "Add more skills to improve your profile match.",
      time: "Yesterday",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <header className={styles.navbar}>

      {/* =====================================
          LEFT
          ===================================== */}

      <div className={styles.left}>
        <div className={styles.pageTitle}>
          <h1>
            {pageTitle}
          </h1>

          <p>
            StudentPath
          </p>
        </div>
      </div>


      {/* =====================================
          RIGHT
          ===================================== */}

      <div className={styles.right}>

        {/* ===================================
            NOTIFICATIONS
            =================================== */}

        <div
          className={styles.notificationWrapper}
          ref={notificationRef}
        >

          <button
            type="button"
            className={`${styles.notificationButton} ${
              showNotifications
                ? styles.notificationButtonActive
                : ""
            }`}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            onClick={() =>
              setShowNotifications(
                (previous) => !previous
              )
            }
          >

            <Bell
              size={19}
              strokeWidth={1.9}
            />

            {unreadCount > 0 && (
  <span className={styles.notificationBadge}>
    {unreadCount > 9 ? "9+" : unreadCount}
  </span>
)}

          </button>


          {/* =================================
              NOTIFICATION POPUP
              ================================= */}

          {showNotifications && (
            <div
              className={
                styles.notificationPopup
              }
            >

              <div
                className={
                  styles.notificationHeader
                }
              >

                <div>
                  <h3>
                    Notifications
                  </h3>

                  <span>
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "No new notifications"}
                  </span>
                </div>

                <button
                  type="button"
                  className={
                    styles.closeButton
                  }
                  aria-label="Close notifications"
                  onClick={() =>
                    setShowNotifications(false)
                  }
                >
                  <X size={16} />
                </button>

              </div>


              <div
                className={
                  styles.notificationList
                }
              >

                {notifications.length > 0 ? (
                  notifications.map(
                    (notification) => {

                      const Icon =
                        notification.icon;

                      return (
                        <button
                          type="button"
                          key={
                            notification.id
                          }
                          className={`${styles.notificationItem} ${
                            notification.unread
                              ? styles.unread
                              : ""
                          }`}
                        >

                          <div
                            className={`${styles.notificationIcon} ${
                              styles[
                                `notificationIcon${notification.type}`
                              ]
                            }`}
                          >
                            <Icon
                              size={16}
                              strokeWidth={2}
                            />
                          </div>


                          <div
                            className={
                              styles.notificationContent
                            }
                          >

                            <div
                              className={
                                styles.notificationTitleRow
                              }
                            >
                              <strong>
                                {notification.title}
                              </strong>

                              {notification.unread && (
                                <span
                                  className={
                                    styles.unreadIndicator
                                  }
                                />
                              )}
                            </div>

                            <p>
                              {notification.message}
                            </p>

                            <span
                              className={
                                styles.notificationTime
                              }
                            >
                              {notification.time}
                            </span>

                          </div>

                        </button>
                      );
                    }
                  )
                ) : (

                  <div
                    className={
                      styles.emptyNotifications
                    }
                  >
                    <Bell
                      size={22}
                      strokeWidth={1.7}
                    />

                    <p>
                      You're all caught up.
                    </p>
                  </div>

                )}

              </div>


              <div
                className={
                  styles.notificationFooter
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowNotifications(false)
                  }
                >
                  Close
                </button>
              </div>

            </div>
          )}

        </div>


        {/* ===================================
            PROFILE
            =================================== */}

        <button
          type="button"
          className={styles.profile}
          aria-label="User profile"
        >

          <div className={styles.avatar}>
            {firstLetter}
          </div>

          <div className={styles.userInfo}>

            <span className={styles.name}>
              {userName}
            </span>

            <span className={styles.role}>
              {userRole}
            </span>

          </div>

          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className={styles.chevron}
          />

        </button>

      </div>

    </header>
  );
}

export default TopNavbar;