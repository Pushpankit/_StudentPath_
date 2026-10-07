import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL
).replace(/\/+$/, "");

const ResetPassword = () => {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError("Password reset token is missing or invalid.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reset your password."
        );
      }

      setSuccess(true);
      setMessage(
        data.message ||
          "Your password has been reset successfully."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <h2>Invalid Reset Link</h2>

        <p>
          This password reset link is missing a valid token.
          Please request a new password reset link.
        </p>

        <Link to="/forgot-password">
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <h2>Password Reset Successful</h2>

        <p>{message}</p>

        <Link to="/login">Continue to Login</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Reset Password</h2>

      <p>
        Enter a new password for your StudentPath account.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">
            New Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter new password"
            autoComplete="new-password"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">
            Confirm Password
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={loading}
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <p>
        Remember your password?{" "}
        <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default ResetPassword;