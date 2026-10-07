import {
  Check,
  Code2,
  ExternalLink,
  Lightbulb,
  MapPin,
} from "lucide-react";

import styles from "./ProductPreview.module.css";

function ProductPreview() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.top}>
          <div>
            <span className={styles.label}>
              PROFILE MATCH
            </span>

            <h3>Frontend Developer Intern</h3>

            <p className={styles.companyInfo}>
              <span>Technology company</span>
              <span>·</span>
              <MapPin size={13} />
              <span>Noida</span>
              <span>·</span>
              <span>Internship</span>
            </p>
          </div>

          <div className={styles.match}>
            <strong>84%</strong>
            <span>match</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.skillBlock}>
          <p>
            <Check size={14} />
            Skills you already have
          </p>

          <div className={styles.skills}>
            <span>
              <Code2 size={13} />
              React
            </span>

            <span>JavaScript</span>
            <span>Git</span>
          </div>
        </div>

        <div className={styles.skillBlock}>
          <p>
            <Lightbulb size={14} />
            Skills you could improve
          </p>

          <div className={styles.missing}>
            <span>TypeScript</span>
            <span>REST APIs</span>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>3 of 5 required skills</span>

          <button>
            View opportunity
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      <div className={styles.floatingCard}>
        <div className={styles.floatingIcon}>
          <Lightbulb size={15} />
        </div>

        <div>
          <span>Next step</span>
          <strong>Improve TypeScript</strong>
          <small>
            Recommended for your target role
          </small>
        </div>
      </div>
    </div>
  );
}

export default ProductPreview;