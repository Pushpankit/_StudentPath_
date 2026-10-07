import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            StudentPath<span>.</span>
          </Link>

          <p>
            Helping students navigate the path to their first job.
          </p>
        </div>

        <div className={styles.links}>
          <div>
            <h4>Platform</h4>

            <a href="#how-it-works">How it works</a>
            <a href="#why">For students</a>
          </div>

          <div id="for-companies">
            <h4>For companies</h4>

            <Link to="/signup">Create company account</Link>
            <Link to="/login">Company login</Link>
          </div>

          <div>
            <h4>Account</h4>

            <Link to="/login">Login</Link>
            <Link to="/signup">Get started</Link>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div>
          © {new Date().getFullYear()} StudentPath. All rights reserved.
        </div>

        <div>
          Built for students and early-career professionals.
        </div>
      </div>
    </footer>
  );
}

export default Footer;