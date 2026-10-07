import { useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function GoogleCallback() {
  const [status, setStatus] = useState("Processing Google login...");

  useEffect(() => {
    const handleGoogleCallback = async () => {
      console.log("====================================");
      console.log("GOOGLE CALLBACK FRONTEND START");
      console.log("====================================");

      console.log("Current URL:", window.location.href);
      console.log("Current pathname:", window.location.pathname);
      console.log("Current search:", window.location.search);
      console.log("Current hash:", window.location.hash);

      console.log("API URL:", API_URL);

      try {
        // ----------------------------------------------------
        // CHECK QUERY PARAMETERS
        // ----------------------------------------------------

        const queryParams =
          new URLSearchParams(
            window.location.search
          );

        const queryError =
          queryParams.get("error");

        console.log("Query error:", queryError);


        if (queryError) {
          console.error(
            "Google returned query error:",
            queryError
          );

          setStatus(
            `Google authentication failed: ${queryError}`
          );

          return;
        }


        // ----------------------------------------------------
        // CHECK HASH
        // ----------------------------------------------------

        const rawHash =
          window.location.hash;

        console.log(
          "Raw hash:",
          rawHash
        );

        console.log(
          "Hash length:",
          rawHash.length
        );


        if (!rawHash) {
          console.error(
            "NO HASH FOUND IN GOOGLE CALLBACK"
          );

          console.error(
            "Full URL:",
            window.location.href
          );

          setStatus(
            "Google authentication did not return a valid session."
          );

          return;
        }


        // ----------------------------------------------------
        // PARSE HASH
        // ----------------------------------------------------

        const hashString =
          rawHash.replace(/^#/, "");

        console.log(
          "Hash string:",
          hashString
        );

        const params =
          new URLSearchParams(
            hashString
          );


        const token =
          params.get("token");

        const role =
          params.get("role") || "";

        const nextStep =
          params.get("nextStep") ||
          "onboarding";


        console.log(
          "Token present:",
          Boolean(token)
        );

        console.log(
          "Token length:",
          token?.length || 0
        );

        console.log(
          "Role:",
          role
        );

        console.log(
          "Next step:",
          nextStep
        );


        // ----------------------------------------------------
        // TOKEN CHECK
        // ----------------------------------------------------

        if (!token) {
          console.error(
            "TOKEN NOT FOUND IN HASH"
          );

          console.error(
            "Parsed hash parameters:",
            Object.fromEntries(params.entries())
          );

          setStatus(
            "Google authentication did not return a valid session."
          );

          return;
        }


        // ----------------------------------------------------
        // STORE TOKEN
        // ----------------------------------------------------

        console.log(
          "Saving token to localStorage..."
        );

        localStorage.setItem(
          "token",
          token
        );

        console.log(
          "Token saved successfully."
        );


        // ----------------------------------------------------
        // VERIFY TOKEN WAS STORED
        // ----------------------------------------------------

        const storedToken =
          localStorage.getItem("token");

        console.log(
          "Stored token exists:",
          Boolean(storedToken)
        );

        console.log(
          "Stored token length:",
          storedToken?.length || 0
        );


        // ----------------------------------------------------
        // REMOVE HASH
        // ----------------------------------------------------

        console.log(
          "Removing token from browser URL..."
        );

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        console.log(
          "URL after replaceState:",
          window.location.href
        );


        // ----------------------------------------------------
        // DETERMINE REDIRECT
        // ----------------------------------------------------

        console.log(
          "Determining next page..."
        );

        if (role === "student") {
          if (nextStep === "dashboard") {
            console.log(
              "Redirecting student to dashboard"
            );

            window.location.replace(
              "/dashboard"
            );

            return;
          }

          console.log(
            "Redirecting student to onboarding"
          );

          window.location.replace(
            "/onboarding"
          );

          return;
        }


        if (role === "company") {
          if (nextStep === "dashboard") {
            console.log(
              "Redirecting company to dashboard"
            );

            window.location.replace(
              "/company"
            );

            return;
          }

          console.log(
            "Redirecting company to onboarding"
          );

          window.location.replace(
            "/company/onboarding"
          );

          return;
        }


        console.log(
          "Unknown role. Redirecting to login."
        );

        window.location.replace(
          "/login"
        );

      } catch (error) {
        console.error(
          "===================================="
        );

        console.error(
          "GOOGLE CALLBACK FRONTEND ERROR"
        );

        console.error(
          error
        );

        console.error(
          "===================================="
        );

        setStatus(
          error?.message ||
          "Google authentication failed."
        );
      }
    };


    handleGoogleCallback();

  }, []);


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        <h2>
          Google Authentication
        </h2>

        <p>
          {status}
        </p>

        <p
          style={{
            fontSize: "13px",
            color: "#666",
            wordBreak: "break-word",
          }}
        >
          Check the browser console for
          detailed debugging information.
        </p>
      </div>
    </div>
  );
}