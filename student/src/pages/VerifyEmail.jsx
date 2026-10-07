import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL
).replace(/\/+$/, "");

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage(
        "Verification token is missing."
      );
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${API_URL}/auth/verify-email?token=${encodeURIComponent(
            token
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Email verification failed."
          );
        }

        setStatus("success");
        setMessage(
          data.message ||
            "Your email has been verified successfully."
        );
      } catch (error) {
        setStatus("error");
        setMessage(
          error.message ||
            "Unable to verify your email."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div>
      {status === "verifying" && (
        <>
          <h2>Verifying your email...</h2>
          <p>
            Please wait while we verify your
            email address.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <h2>Email verified</h2>

          <p>{message}</p>

          <Link to="/login">
            Continue to Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h2>Verification failed</h2>

          <p>{message}</p>

          <Link to="/login">
            Back to Login
          </Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;