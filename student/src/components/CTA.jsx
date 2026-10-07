import { Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import styles from "./CTA.module.css";

function CTA() {
  return (
    <section className={styles.section}>
  <div className={styles.container}>
    <div className={styles.ctaIcon}>
      <Compass size={21} />
    </div>

    <div>
      <span>START YOUR JOURNEY</span>

      <h2>Know where you stand.</h2>

      <p>
        Create your profile and start exploring opportunities
        relevant to your career goals.
      </p>
    </div>

    <Link to="/signup" className={styles.button}>
      Get started
      <ArrowRight size={16} />
    </Link>
  </div>
</section>
  );
}

export default CTA;