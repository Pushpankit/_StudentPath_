import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Compass,
  Target,
  Briefcase,
  Clipboard,
  BarChart3,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import styles from "./Landing.module.css";

function Landing() {
  return (
    <div className={styles.page}>
      <Navbar />

      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.badgeDot}></span>
              YOUR FUTURE STARTS WITH DIRECTION
            </div>

            <h1>
              Make your next
              <br />
              move <span>mean</span>
              <br />
              something.
            </h1>

            <p>
              Find the right career path, build the right skills, and
              discover internships and jobs that match where you are now.
            </p>

            <div className={styles.heroActions}>
              <Link to="/signup" className={styles.primaryButton}>
                Start your journey
                <ArrowRight size={17} />
              </Link>

              <a
                href="#how-it-works"
                className={styles.secondaryButton}
              >
                Explore the platform
              </a>
            </div>

            <div className={styles.heroNote}>
              <div className={styles.avatarStack}>
                <span>PS</span>
                <span>RK</span>
                <span>AM</span>
              </div>

              <div>
                <strong>Built for students & fresh graduates</strong>
                <small>
                  Clarity for your career, one step at a time.
                </small>
              </div>
            </div>
          </div>

          {/* PRODUCT PREVIEW */}
          <div className={styles.heroVisual}>
            <div className={`${styles.orbit} ${styles.orbitOne}`} />
            <div className={`${styles.orbit} ${styles.orbitTwo}`} />

            <div className={styles.floatingCardTop}>
              <div className={styles.miniIcon}>
                <Target size={17} />
              </div>

              <div>
                <strong>Your path is taking shape</strong>
                <span>Robotic Developer · 86% match</span>
              </div>
            </div>

            <div className={styles.dashboardPreview}>
              <div className={styles.previewSidebar}>
                <div className={styles.previewLogo}>S</div>

                <div
                  className={`${styles.previewNavItem} ${styles.active}`}
                >
                  <BarChart3 size={16} />
                </div>

                <div className={styles.previewNavItem}>
                  <Compass size={16} />
                </div>

                <div className={styles.previewNavItem}>
                  <Briefcase size={16} />
                </div>

                <div className={styles.previewNavItem}>
                  <Target size={16} />
                </div>
              </div>

              <div className={styles.previewMain}>
                <div className={styles.previewHeader}>
                  <div>
                    <small>Good morning, Alex</small>
                    <h3>A clearer path to what's next.</h3>
                  </div>

                  <div className={styles.previewAvatar}>AM</div>
                </div>

                <div className={styles.previewCards}>
                  <div className={styles.pathCard}>
                    <span className={styles.cardLabel}>
                      RECOMMENDED PATH
                    </span>

                    <div className={styles.pathIcon}>
                      <Target size={19} />
                    </div>

                    <h4>
                      Robotic
                      <br />
                      Developer
                    </h4>

                    <div className={styles.match}>
                      86% match
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  <div className={styles.skillCard}>
                    <span className={styles.cardLabel}>
                      SKILL READINESS
                    </span>

                    <div className={styles.progressCircle}>
                      <strong>
                        5<span>/7</span>
                      </strong>
                    </div>

                    <small>Almost there</small>
                    <p>Just 2 skills to focus on</p>
                  </div>
                </div>

                <div className={styles.jobPreview}>
                  <div className={styles.companyLogo}>L</div>

                  <div className={styles.jobInfo}>
                    <strong>Robotic Developer Intern</strong>
                    <span>Linear Labs · Remote</span>
                  </div>

                  <div className={styles.jobMatch}>92% match</div>
                </div>
              </div>
            </div>

            <div className={styles.floatingCardBottom}>
              <div className={styles.successIcon}>
                <Check size={18} />
              </div>

              <div>
                <strong>One step closer</strong>
                <span>Your plan is ready to explore</span>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className={styles.trustStrip}>
          <span>A more thoughtful way to navigate your career</span>

          <div>
            <span>
              <Compass size={16} />
              Explore your options
            </span>

            <span>
              <Target size={16} />
              Know your skill gaps
            </span>

            <span>
              <Check size={16} />
              Meet verified companies
            </span>
          </div>
        </section>

        {/* BUILT AROUND YOU */}
        <section className={styles.aboutSection}>
          <div className={styles.aboutContent}>
            <div className={styles.sectionEyebrow}>
              BUILT AROUND YOU
            </div>

            <h2>
              Less guessing.
              <br />
              <span>More growing.</span>
            </h2>

            <p>
              You don't need to have it all figured out. StudentPath
              connects your profile to real career paths, helps you focus
              on the right skills, and keeps your next steps within reach.
            </p>

            <div className={styles.featureList}>
              <div className={styles.feature}>
                <div className={styles.checkCircle}>
                  <Check size={14} />
                </div>

                <div>
                  <strong>A path that fits your profile</strong>
                  <span>
                    Understand how your interests and skills connect to
                    different careers.
                  </span>
                </div>
              </div>

              <div className={styles.feature}>
                <div className={styles.checkCircle}>
                  <Check size={14} />
                </div>

                <div>
                  <strong>Progress you can actually see</strong>
                  <span>
                    Turn skill gaps into a practical plan you can work
                    through.
                  </span>
                </div>
              </div>

              <div className={styles.feature}>
                <div className={styles.checkCircle}>
                  <Check size={14} />
                </div>

                <div>
                  <strong>Opportunities worth your time</strong>
                  <span>
                    See why a role matches, then track every application
                    in one place.
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/signup"
              className={styles.blueButton}
            >
              Create your free account
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.aboutImage}>
            <div className={styles.imagePlaceholder}>
              <div className={styles.peopleGraphic}>
                <div
                  className={`${styles.person} ${styles.personOne}`}
                />

                <div
                  className={`${styles.person} ${styles.personTwo}`}
                />

                <div
                  className={`${styles.person} ${styles.personThree}`}
                />

                <div className={styles.laptop}>
                  <div className={styles.laptopScreen}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>

              <div className={styles.imageOverlay}>
                <div className={styles.imageCheck}>
                  <Check size={18} />
                </div>

                <div>
                  <strong>Grow at your own pace</strong>
                  <span>One meaningful step at a time.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          className={styles.howSection}
          id="how-it-works"
        >
          <div className={styles.howHeader}>
            <div>
              <div className={styles.sectionEyebrow}>
                HOW IT WORKS
              </div>

              <h2>
                From "what's next?"
                <br />
                to a plan that makes sense.
              </h2>
            </div>

            <p>
              Career growth isn't one big leap. It's a series of
              informed, achievable steps. StudentPath helps you see them
              clearly.
            </p>
          </div>

          <div className={styles.steps}>
            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>
                01 / DISCOVER
              </span>

              <div className={styles.stepIcon}>
                <Compass size={20} />
              </div>

              <h3>Find your direction</h3>

              <p>
                Explore career paths that fit your interests, education,
                and the skills you already have.
              </p>

              <a href="#how-it-works">
                Explore careers
                <ArrowRight size={15} />
              </a>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>
                02 / DEVELOP
              </span>

              <div className={styles.stepIcon}>
                <Target size={20} />
              </div>

              <h3>Know what to build</h3>

              <p>
                See where your skills stand, what's missing, and the
                practical steps to close the gap.
              </p>

              <a href="#how-it-works">
                See skill matching
                <ArrowRight size={15} />
              </a>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>
                03 / CONNECT
              </span>

              <div className={styles.stepIcon}>
                <Briefcase size={20} />
              </div>

              <h3>Find the right fit</h3>

              <p>
                Discover opportunities at verified companies, with clear
                match insights before you apply.
              </p>

              <a href="#how-it-works">
                Browse jobs
                <ArrowRight size={15} />
              </a>
            </div>

              <div className={styles.stepCard}>
              <span className={styles.stepNumber}>
                04 / Apply and track
              </span>

              <div className={styles.stepIcon}>
                <Clipboard size={20} />
              </div>

              <h3>Apply and track</h3>

              <p>
                Apply to opportunities and keep your applications organized.
              </p>

              <a href="#how-it-works">
                Browse jobs
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* SKILL MATCHING */}
        <section className={styles.matchSection}>
          <div className={styles.matchVisual}>
            <div className={styles.matchPanel}>
              <div className={styles.matchPanelHeader}>
                <div>
                  <span>YOUR CAREER MATCH</span>
                  <h3>Robotic Developer</h3>
                </div>

                <strong>86%</strong>
              </div>

              <div className={styles.matchBar}>
                <span />
              </div>

              <div className={styles.skillGrid}>
                <div className={`${styles.skill} ${styles.skillActive}`}>
                  <span>
                    <Check size={13} />
                  </span>
                  React
                </div>

                <div className={`${styles.skill} ${styles.skillActive}`}>
                  <span>
                    <Check size={13} />
                  </span>
                  JavaScript
                </div>

                <div className={`${styles.skill} ${styles.skillActive}`}>
                  <span>
                    <Check size={13} />
                  </span>
                  HTML / CSS
                </div>

                <div className={`${styles.skill} ${styles.skillActive}`}>
                  <span>
                    <Check size={13} />
                  </span>
                  Git
                </div>

                <div className={styles.skill}>
                  <span>
                    <Target size={13} />
                  </span>
                  TypeScript
                </div>

                <div className={styles.skill}>
                  <span>
                    <Target size={13} />
                  </span>
                  REST APIs
                </div>
              </div>

              <div className={styles.matchFooter}>
                <span>4 matched skills</span>
                <span>2 skills to improve</span>
              </div>
            </div>
          </div>

          <div className={styles.matchContent}>
            <div className={styles.sectionEyebrow}>
              BUILT FOR REAL PROGRESS
            </div>

            <h2>
              Know what you're
              <br />
              missing before
              <br />
              you apply.
            </h2>

            <p>
              Applying to hundreds of jobs doesn't solve the problem if
              you don't know why you're getting rejected. StudentPath shows
              how your current profile lines up with the roles you're
              targeting.
            </p>

            <ul>
              <li>
                <Check size={16} />
                See your matched skills
              </li>

              <li>
                <Check size={16} />
                Identify missing skills
              </li>

              <li>
                <Check size={16} />
                Follow a practical improvement plan
              </li>
            </ul>
          </div>
        </section>

        {/* COMPANIES */}
        <section className={styles.companySection}>
          <div>
            <div className={styles.sectionEyebrow}>
              FOR COMPANIES
            </div>

            <h2>
              Meet emerging talent
              <br />
              with potential to grow.
            </h2>
          </div>

          <div className={styles.companyContent}>
            <p>
              Find students whose skills and interests align with your
              roles. Create opportunities, review applicants, and build a
              stronger early-career pipeline — all in a trusted space.
            </p>

            <ul>
              <li>
                <Check size={16} />
                Verified company profiles
              </li>

              <li>
                <Check size={16} />
                Skill-based applicant insights
              </li>

              <li>
                <Check size={16} />
                Simple application management
              </li>
            </ul>

            <Link
              to="/signup"
              className={styles.companyButton}
            >
              Join as a company
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaPattern}></div>

          <div className={styles.ctaContent}>
            <div className={styles.sectionEyebrow}>
              YOUR NEXT CHAPTER
            </div>

            <h2>
              Start with a little clarity.
              <br />
              Go somewhere great.
            </h2>

            <p>
              Explore your options and take the next step with confidence.
            </p>

            <Link
              to="/signup"
              className={styles.ctaButton}
            >
              Get started for free
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Landing;