import {
  UserRound,
  Search,
  Target,
  ClipboardCheck,
} from "lucide-react";

import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "01",
    icon: UserRound,
    title: "Build your profile",
    description:
      "Add your education, skills, projects and career goal.",
  },
  {
    number: "02",
    icon: Search,
    title: "Find opportunities",
    description:
      "Discover internships and fresher jobs relevant to your profile.",
  },
  {
    number: "03",
    icon: Target,
    title: "Understand your gaps",
    description:
      "See which skills you already have and which ones you need to improve.",
  },
  {
    number: "04",
    icon: ClipboardCheck,
    title: "Apply and track",
    description:
      "Apply to opportunities and keep your applications organized.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.heading}>
        <span>HOW IT WORKS</span>

        <h2>
          Your career search,
          <br />
          made clearer.
        </h2>

        <p>
          StudentPath helps you understand where you fit,
          what you are missing and what to do next.
        </p>
      </div>

      <div className={styles.steps}>
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <article
              key={step.number}
              className={styles.step}
            >
              <div className={styles.iconWrapper}>
                <Icon size={20} strokeWidth={1.8} />
              </div>

              <span className={styles.number}>
                {step.number}
              </span>

              <h3>{step.title}</h3>

              <p>{step.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default HowItWorks;