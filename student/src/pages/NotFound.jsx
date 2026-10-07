import { useNavigate } from "react-router-dom";
import styles from "./NotFound.module.css";

function NotFound() {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <p>404</p>
      <h1>Page not found</h1>
      <span>The page you requested does not exist.</span>
      <button onClick={() => navigate("/")}>Go home</button>
    </main>
  );
}

export default NotFound;
