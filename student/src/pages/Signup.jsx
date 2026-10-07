
import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Signup.module.css";

const API_URL = (
  import.meta.env.VITE_API_URL
).replace(/\/+$/, "");

const initialForm = {
  name: "",
  username: "",
  email: "",
  password: "",
};

function Signup() {
  const [accountType, setAccountType] = useState("student");

  const [form, setForm] = useState(initialForm);

  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  /*
   * ----------------------------------------------
   * Input change
   * ----------------------------------------------
   */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  /*
   * ----------------------------------------------
   * Account type
   * ----------------------------------------------
   */

  const handleAccountTypeChange = (type) => {
    if (loading || googleLoading) {
      return;
    }

    setAccountType(type);
    setError("");

    /*
     * Company accounts currently do not use
     * usernames.
     */
    if (type === "company") {
      setForm((previous) => ({
        ...previous,
        username: "",
      }));
    }
  };

  /*
   * ----------------------------------------------
   * Validation
   * ----------------------------------------------
   */

  const validateForm = () => {
    const name = form.name.trim();

    const username = form.username
      .trim()
      .toLowerCase();

    const email = form.email
      .trim()
      .toLowerCase();

    const password = form.password;

    if (!name) {
      return "Please enter your name.";
    }

    if (name.length < 2 || name.length > 100) {
      return "Name must be between 2 and 100 characters.";
    }

    if (!email) {
      return "Please enter your email address.";
    }

    if (!password) {
      return "Please create a password.";
    }

    if (accountType === "student" && !username) {
      return "Please choose a username.";
    }

    if (
      accountType === "student" &&
      (username.length < 3 || username.length > 30)
    ) {
      return "Username must be between 3 and 30 characters.";
    }

    if (
      accountType === "student" &&
      !/^[a-z0-9_]+$/.test(username)
    ) {
      return (
        "Username can only contain lowercase " +
        "letters, numbers, and underscores."
      );
    }

    /*
     * Keep this aligned with the current
     * backend validation.
     */
    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (!agreed) {
      return (
        "Please agree to the Terms & Conditions " +
        "and Privacy Policy."
      );
    }

    return null;
  };

  /*
   * ----------------------------------------------
   * Email/password signup
   * ----------------------------------------------
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading || googleLoading) {
      return;
    }

    setError("");
    setSuccess(false);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const name = form.name.trim();

    const username = form.username
      .trim()
      .toLowerCase();

    const email = form.email
      .trim()
      .toLowerCase();

    const password = form.password;

    try {
      setLoading(true);

      const body = {
        name,
        email,
        password,
        accountType,
        termsAccepted: true,
      };

      if (accountType === "student") {
        body.username = username;
      }

      const response = await fetch(
        `${API_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create your account."
        );
      }

      /*
       * Signup does not authenticate the user.
       *
       * The user must verify their email and
       * then log in.
       */
      if (data.emailVerificationRequired === true) {
        setSuccess(true);
        return;
      }

      /*
       * Do not silently accept an unexpected
       * authentication response.
       */
      throw new Error(
        "Account created, but the server returned an unexpected response."
      );
    } catch (err) {
      console.error("Signup error:", err);

      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------------
   * Google signup
   * ----------------------------------------------
   */

const handleGoogleSignup = () => {
  if (
    loading ||
    googleLoading
  ) {
    return;
  }

  if (!agreed) {
    setError(
      "Please agree to the Terms & Conditions and Privacy Policy before continuing with Google."
    );

    return;
  }

  if (
    !["student", "company"].includes(
      accountType
    )
  ) {
    setError(
      "Please select a valid account type."
    );

    return;
  }

  setError("");
  setGoogleLoading(true);

  try {
    const googleUrl =
      new URL(
        `${API_URL}/auth/google/signup`
      );

    googleUrl.searchParams.set(
      "role",
      accountType
    );

    googleUrl.searchParams.set(
      "termsAccepted",
      "true"
    );

    window.location.assign(
      googleUrl.toString()
    );
  } catch (error) {
    console.error(
      "Google signup error:",
      error
    );

    setGoogleLoading(false);

    setError(
      "Unable to start Google signup. Please try again."
    );
  }
};

  /*
   * ----------------------------------------------
   * Email verification success
   * ----------------------------------------------
   */

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Link
              to="/"
              className={styles.logo}
            >
              <span
                className={styles.logoMark}
              >
                S
              </span>

              <span>
                StudentPath
              </span>
            </Link>

            <h1>
              Check your email
            </h1>

            <p>
              We've sent a verification
              link to:
            </p>

            <strong>
              {form.email}
            </strong>

            <p>
              Open the email and click
              the verification link to
              activate your account.
            </p>

            <p>
              The verification link will
              expire in 24 hours.
            </p>
          </div>

          <div
            className={styles.success}
            role="status"
          >
            Your account has been
            created. Verify your email,
            then log in to continue.
          </div>

          <Link
            to="/login"
            className={styles.submitButton}
          >
            Go to Login
          </Link>

          <p
            className={styles.loginText}
          >
            Didn't receive the email?{" "}
            <Link to="/login">
              Go to Login to resend it
            </Link>
          </p>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------
   * Signup UI
   * ----------------------------------------------
   */

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link
            to="/"
            className={styles.logo}
          >
            <span
              className={styles.logoMark}
            >
              S
            </span>

            <span>
              StudentPath
            </span>
          </Link>

          <h1>
            Create your account
          </h1>

          <p>
            Start building your path
            toward your next career
            opportunity.
          </p>
        </div>

        {/* Account type */}

        <div
          className={styles.accountType}
        >
          <button
            type="button"
            className={
              accountType === "student"
                ? styles.accountTypeActive
                : styles.accountTypeButton
            }
            onClick={() =>
              handleAccountTypeChange(
                "student"
              )
            }
            disabled={
              loading ||
              googleLoading
            }
          >
            Student
          </button>

          <button
            type="button"
            className={
              accountType === "company"
                ? styles.accountTypeActive
                : styles.accountTypeButton
            }
            onClick={() =>
              handleAccountTypeChange(
                "company"
              )
            }
            disabled={
              loading ||
              googleLoading
            }
          >
            Company
          </button>
        </div>

        {/* Google */}

        <button
          type="button"
          className={
            styles.googleButton
          }
          onClick={
            handleGoogleSignup
          }
          disabled={
            loading ||
            googleLoading
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
          className={styles.divider}
        >
          <span>
            or
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          {/* Name */}

          <div
            className={
              styles.formGroup
            }
          >
            <label htmlFor="name">
              {accountType === "student"
                ? "Full name"
                : "Name"}
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder={
                accountType === "student"
                  ? "Enter your full name"
                  : "Enter your name"
              }
              value={form.name}
              onChange={
                handleChange
              }
              autoComplete="name"
              disabled={loading}
            />
          </div>

          {/* Student username */}

          {accountType === "student" && (
            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={
                  form.username
                }
                onChange={
                  handleChange
                }
                autoComplete="username"
                disabled={loading}
              />

              <small
                className={
                  styles.inputHint
                }
              >
                3–30 characters. Use
                lowercase letters,
                numbers, and
                underscores.
              </small>
            </div>
          )}

          {/* Email */}

          <div
            className={
              styles.formGroup
            }
          >
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={
                handleChange
              }
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password */}

          <div
            className={
              styles.formGroup
            }
          >
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={
                form.password
              }
              onChange={
                handleChange
              }
              autoComplete="new-password"
              disabled={loading}
            />

            <small
              className={
                styles.inputHint
              }
            >
              Minimum 6 characters.
            </small>
          </div>

          {/* Terms */}

          <label
            className={styles.terms}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(
                  e.target.checked
                );

                if (error) {
                  setError("");
                }
              }}
              disabled={loading}
            />

            <span>
              I agree to the{" "}
              <Link
                to="/terms"
                target="_blank"
                rel="noreferrer"
              >
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {/* Error */}

          {error && (
            <div
              className={styles.error}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            className={
              styles.submitButton
            }
            disabled={
              loading ||
              googleLoading
            }
          >
            {loading
              ? "Creating account..."
              : accountType === "student"
              ? "Create student account"
              : "Create company account"}
          </button>
        </form>

        <p
          className={styles.loginText}
        >
          Already have an account?{" "}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
