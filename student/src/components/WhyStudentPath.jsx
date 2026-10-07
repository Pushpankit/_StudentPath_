import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Wrench,
  Route,
} from "lucide-react";
import styles from "./WhyStudentPath.module.css";

function WhyStudentPath() {
    return (
        <section id="why" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <span className={styles.label}>FOR STUDENTS</span>

                    <h2>
                        You shouldn't have to
                        <br />
                        figure everything out alone.
                    </h2>

                    <p>
                        Most students know they want a job. The difficult part
                        is understanding which jobs they should apply for,
                        whether their current skills are enough, and what they
                        should learn next.
                    </p>

                    <p>
                        StudentPath brings those decisions into one place.
                    </p>

                    <Link to="/signup" className={styles.button}>
                        Start building your profile
                    </Link>
                </div>

                <div className={styles.points}>
                    <div>
                        <div className={styles.pointIcon}>
                            <BriefcaseBusiness size={19} />
                        </div>

                        <strong>01</strong>

                        <h3>Know where you fit</h3>

                        <p>
                            Compare your current skills with real opportunities.
                        </p>
                    </div>

                    <div>
                        <div className={styles.pointIcon}>
                            <Wrench size={19} />
                        </div>

                        <strong>02</strong>

                        <h3>See what you're missing</h3>

                        <p>
                            Identify the skills that could improve your profile.
                        </p>
                    </div>

                    <div>
                        <div className={styles.pointIcon}>
                            <Route size={19} />
                        </div>

                        <strong>03</strong>

                        <h3>Know what to do next</h3>

                        <p>
                            Turn your career goal into practical next steps.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default WhyStudentPath;