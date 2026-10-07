import { LogIn, ArrowRight, Building2, CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.logo}>
          StudentPath<span>.</span>
        </Link>

        <div className={styles.navLinks}>
          <a href="#how-it-works">
            How it works
          </a>

          <a href="#why">
            Why StudentPath
          </a>

          <a href="#for-companies">
            For companies
          </a>
        </div>

        <div className={styles.actions}>
          <Link to="/login" className={styles.login}>
            <LogIn size={15} />
            Login
          </Link>

          <Link to="/signup" className={styles.signup}>
            Get Started
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;