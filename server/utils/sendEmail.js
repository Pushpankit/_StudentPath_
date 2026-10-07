const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);

/*
 * ==================================================
 * CONFIGURATION
 * ==================================================
 */

const getClientUrl = () => {
  const url =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL;

  if (!url) {
    throw new Error(
      "CLIENT_URL is not configured."
    );
  }

  return url.replace(
    /\/+$/,
    ""
  );
};

const getFromEmail = () => {
  const email =
    process.env.EMAIL_FROM;

  if (!email) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  return email;
};

/*
 * ==================================================
 * VERIFICATION EMAIL
 * ==================================================
 */

const sendVerificationEmail =
  async ({
    email,
    name,
    token,
  }) => {
    if (!email) {
      throw new Error(
        "Verification email address is required."
      );
    }

    if (!token) {
      throw new Error(
        "Verification token is required."
      );
    }

    const verificationUrl =
      `${getClientUrl()}/verify-email?token=${encodeURIComponent(
        token
      )}`;

    const displayName =
      name
        ? String(name)
        : "there";

    const { error } =
      await resend.emails.send({
        from:
          getFromEmail(),

        to: [email],

        subject:
          "Verify your StudentPath account",

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
              color: #222;
            "
          >
            <h2>
              Welcome to StudentPath, ${displayName}!
            </h2>

            <p>
              Thanks for creating your account.
              Please verify your email address to
              activate your StudentPath account.
            </p>

            <p style="margin: 30px 0;">
              <a
                href="${verificationUrl}"
                style="
                  display: inline-block;
                  padding: 12px 20px;
                  background: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 6px;
                "
              >
                Verify Email
              </a>
            </p>

            <p>
              This verification link will expire
              in 24 hours.
            </p>

            <p>
              If you did not create this account,
              you can safely ignore this email.
            </p>

            <p>
              Regards,<br />
              StudentPath Team
            </p>
          </div>
        `,
      });

    if (error) {
      console.error(
        "Resend verification email error:",
        error
      );

      throw new Error(
        "Failed to send verification email."
      );
    }
  };

/*
 * ==================================================
 * PASSWORD RESET EMAIL
 * ==================================================
 */

const sendPasswordResetEmail =
  async ({
    email,
    name,
    token,
  }) => {
    if (!email) {
      throw new Error(
        "Password reset email address is required."
      );
    }

    if (!token) {
      throw new Error(
        "Password reset token is required."
      );
    }

    const resetUrl =
      `${getClientUrl()}/reset-password?token=${encodeURIComponent(
        token
      )}`;

    const displayName =
      name
        ? String(name)
        : "there";

    const { error } =
      await resend.emails.send({
        from:
          getFromEmail(),

        to: [email],

        subject:
          "Reset your StudentPath password",

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
              color: #222;
            "
          >
            <h2>
              Password Reset
            </h2>

            <p>
              Hi ${displayName},
            </p>

            <p>
              We received a request to reset
              your StudentPath password.
            </p>

            <p style="margin: 30px 0;">
              <a
                href="${resetUrl}"
                style="
                  display: inline-block;
                  padding: 12px 20px;
                  background: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 6px;
                "
              >
                Reset Password
              </a>
            </p>

            <p>
              This link will expire in 1 hour.
            </p>

            <p>
              If you did not request a password
              reset, you can safely ignore this email.
            </p>

            <p>
              Regards,<br />
              StudentPath Team
            </p>
          </div>
        `,
      });

    if (error) {
      console.error(
        "Resend password reset email error:",
        error
      );

      throw new Error(
        "Failed to send password reset email."
      );
    }
  };

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};