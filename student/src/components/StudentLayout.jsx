import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { StudentProvider } from "../context/StudentContext";
import styles from "./StudentLayout.module.css";

function StudentLayout() {
  return (
    <StudentProvider>
      <div className={styles.layout}>
        <Sidebar />

        <div className={styles.mainArea}>
          <TopNavbar />

          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </StudentProvider>
  );
}

export default StudentLayout;