import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import styles from "./Login.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL 
).replace(/\/+$/, "");

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [resendLoading, setResendLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [
    verificationEmail,
    setVerificationEmail,
  ] = useState("");

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (status) {
      setStatus("");
    }

    if (verificationEmail) {
      setVerificationEmail("");
    }
  };

  const redirectStudent = async (
    token
  ) => {
    const response = await fetch(
      `${API_URL}/student/me`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to load your student profile."
      );
    }

    if (
      data.profileCompleted === true
    ) {
      navigate("/dashboard");
    } else {
      navigate("/onboarding");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setStatus("");
    setVerificationEmail("");

    const identifier =
      form.identifier.trim();

    const password =
      form.password;

    if (
      !identifier ||
      !password
    ) {
      setError(
        "Please enter your username/email and password."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              identifier,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          data.emailVerificationRequired
        ) {
          setVerificationEmail(
            data.email ||
              identifier
          );

          setError(
            "Please verify your email before logging in."
          );

          return;
        }

        throw new Error(
          data.message ||
            "Invalid username/email or password."
        );
      }

      if (
        !data.token ||
        !data.user
      ) {
        throw new Error(
          "Invalid response from server."
        );
      }

      localStorage.setItem(
        "token",
        data.token
      );

      /*
       * Student:
       *
       * Never assume Dashboard.
       * Ask backend whether onboarding
       * is complete.
       */
      if (
        data.user.role ===
        "student"
      ) {
        await redirectStudent(
          data.token
        );

        return;
      }

      if (data.user.role === "company") {
        const companyResponse = await fetch(
          `${API_URL}/company/me`,
          {
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          }
        );

        const companyData = await companyResponse.json();

        if (companyResponse.status === 401) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please log in again.");
        }

        if (!companyResponse.ok) {
          throw new Error(
            companyData.message ||
              "Unable to load your company profile."
          );
        }

        navigate(
          companyData.profileCompleted === true
            ? "/company"
            : "/company/onboarding",
          { replace: true }
        );

        return;
      }

      if (
        data.user.role ===
        "admin"
      ) {
        navigate(
          "/admin/dashboard"
        );

        return;
      }

      navigate("/");
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      localStorage.removeItem(
        "token"
      );

      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

 const handleGoogleLogin = () => {
  if (googleLoading) {
    return;
  }

  setError("");
  setStatus("");
  setVerificationEmail("");
  setGoogleLoading(true);

  try {
    const googleUrl =
      new URL(
        `${API_URL}/auth/google/login`
      );

    window.location.assign(
      googleUrl.toString()
    );
  } catch (error) {
    console.error(
      "Google login error:",
      error
    );

    setGoogleLoading(false);

    setError(
      "Unable to start Google login. Please try again."
    );
  }
};

  const handleResendVerification =
    async () => {
      const email =
        verificationEmail.trim();

      if (!email) {
        setError(
          "Please enter the email address you used to sign up."
        );

        return;
      }

      try {
        setResendLoading(true);
        setError("");
        setStatus("");

        const response =
          await fetch(
            `${API_URL}/auth/resend-verification`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to resend verification email."
          );
        }

        setStatus(
          "A new verification email has been sent. Please check your inbox."
        );
      } catch (err) {
        console.error(
          "Resend verification error:",
          err
        );

        setError(
          err.message ||
            "Unable to resend verification email."
        );
      } finally {
        setResendLoading(
          false
        );
      }
    };

  const formDisabled =
    loading ||
    googleLoading ||
    resendLoading;

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <div className={styles.header}>
          <Link
            to="/"
            className={styles.logo}
          >
            <span
              className={
                styles.logoMark
              }
            >
              S
            </span>

            <span>
              StudentPath
            </span>
          </Link>

          <h1>
            Welcome back
          </h1>

          <p>
            Log in to continue working
            on your career path.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.googleButton
          }
          onClick={
            handleGoogleLogin
          }
          disabled={
            formDisabled
          }
        >
          <span
            className={
              styles.googleIcon
            }
          >
            G
          </span>

          {googleLoading
            ? "Connecting to Google..."
            : "Continue with Google"}
        </button>

        <div
          className={
            styles.divider
          }
        >
          <span>
            or
          </span>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div
            className={
              styles.formGroup
            }
          >
            <label htmlFor="identifier">
              Username or email
            </label>

            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="Enter your username or email"
              value={
                form.identifier
              }
              onChange={
                handleChange
              }
              autoComplete="username"
              disabled={
                formDisabled
              }
            />
          </div>

          <div
            className={
              styles.formGroup
            }
          >
            <div
              className={
                styles.passwordLabel
              }
            >
              <label htmlFor="password">
                Password
              </label>

              <Link
                to="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={
                form.password
              }
              onChange={
                handleChange
              }
              autoComplete="current-password"
              disabled={
                formDisabled
              }
            />
          </div>

          {error && (
            <div
              className={
                styles.error
              }
              role="alert"
            >
              {error}
            </div>
          )}

          {status && (
            <div
              className={
                styles.success
              }
              role="status"
            >
              {status}
            </div>
          )}

          {verificationEmail && (
            <button
              type="button"
              onClick={
                handleResendVerification
              }
              disabled={
                formDisabled
              }
              className={
                styles.resendButton
              }
            >
              {resendLoading
                ? "Sending..."
                : "Resend verification email"}
            </button>
          )}

          <button
            type="submit"
            className={
              styles.submitButton
            }
            disabled={
              formDisabled
            }
          >
            {loading
              ? "Logging in..."
              : "Log in"}
          </button>
        </form>

        <p
          className={
            styles.signupText
          }
        >
          Don't have an account?{" "}
          <Link to="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;