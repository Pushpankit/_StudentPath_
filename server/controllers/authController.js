
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Student = require("../models/Student");
const Company = require("../models/Company");

const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/sendEmail");

const {
  getGoogleAuthUrl,
  getGoogleUser,
} = require("../utils/googleAuth");

// ============================================================
// HELPERS
// ============================================================

const getClientUrl = () => {
  const clientUrl =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL;

  if (!clientUrl) {
    throw new Error(
      "CLIENT_URL or FRONTEND_URL is not configured."
    );
  }

  return clientUrl.replace(/\/+$/, "");
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return process.env.JWT_SECRET;
};

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usernameRegex =
  /^[a-z0-9_]+$/;

const validRoles = [
  "student",
  "company",
];

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const createJwt = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
    }
  );
};

const getSafeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    authProvider: user.authProvider,
    signupMethod: user.signupMethod,
    status: user.status,
  };
};

const isDuplicateKeyError = (error) => {
  return error?.code === 11000;
};

// ============================================================
// STUDENT PROFILE
// ============================================================

const ensureStudentProfile = async (user) => {
  let student = await Student.findOne({
    user: user._id,
  });

  if (student) {
    return student;
  }

  student = await Student.create({
    user: user._id,
    name: user.name,
    profileCompleted: false,
    onboardingStep: "basic",
  });

  return student;
};

// ============================================================
// COMPANY PROFILE
// ============================================================

const ensureCompanyProfile = async (user) => {
  let company = await Company.findOne({
    user: user._id,
  });

  if (company) {
    return company;
  }

  company = await Company.create({
    user: user._id,
    companyName: user.name,
    contactEmail: user.email,
    profileCompleted: false,
    onboardingStep: "basic",
    verificationStatus: "unverified",
  });

  return company;
};

// ============================================================
// ROLE PROFILE
// ============================================================

const ensureRoleProfile = async (user) => {
  if (user.role === "student") {
    return ensureStudentProfile(user);
  }

  if (user.role === "company") {
    return ensureCompanyProfile(user);
  }

  return null;
};

// ============================================================
// PROFILE COMPLETION
// ============================================================

const getProfileCompletion = (profile) => {
  if (!profile) {
    return false;
  }

  return Boolean(profile.profileCompleted);
};

const getNextStep = (profile) => {
  if (!profile) {
    return "onboarding";
  }

  if (profile.profileCompleted) {
    return "dashboard";
  }

  return "onboarding";
};

// ============================================================
// LOCAL SIGNUP
// ============================================================

const signup = async (req, res) => {
  let createdUser = null;
  let createdProfile = null;

  try {
    const {
      name,
      username,
      email,
      password,
      accountType,
      termsAccepted,
    } = req.body || {};

    const cleanName = String(name || "").trim();

    const cleanUsername =
      String(username || "")
        .trim()
        .toLowerCase();

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !cleanName ||
      cleanName.length < 2 ||
      cleanName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid name.",
      });
    }

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    if (!validRoles.includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type.",
      });
    }

    if (termsAccepted !== true) {
      return res.status(400).json({
        success: false,
        message:
          "You must accept the terms and conditions.",
      });
    }

    if (accountType === "student") {
      if (
        !cleanUsername ||
        cleanUsername.length < 3 ||
        cleanUsername.length > 30 ||
        !usernameRegex.test(cleanUsername)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid username.",
        });
      }
    }

    // --------------------------------------------------------
    // DUPLICATE EMAIL
    // --------------------------------------------------------

    const existingEmailUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        code: "ACCOUNT_ALREADY_EXISTS",
        message:
          "An account with the provided email already exists.",
      });
    }

    // --------------------------------------------------------
    // DUPLICATE USERNAME
    // --------------------------------------------------------

    if (accountType === "student") {
      const existingUsernameUser =
        await User.findOne({
          username: cleanUsername,
        });

      if (existingUsernameUser) {
        return res.status(409).json({
          success: false,
          message:
            "This username is already taken.",
        });
      }
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    const passwordHash =
      await bcrypt.hash(password, 12);

    // --------------------------------------------------------
    // EMAIL VERIFICATION TOKEN
    // --------------------------------------------------------

    const rawVerificationToken =
      generateRandomToken();

    const verificationToken =
      hashToken(rawVerificationToken);

    const verificationExpires =
      new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

    // --------------------------------------------------------
    // CREATE USER
    // --------------------------------------------------------

    createdUser = await User.create({
      name: cleanName,

      username:
        accountType === "student"
          ? cleanUsername
          : undefined,

      email: cleanEmail,

      passwordHash,

      authProvider: "local",

      signupMethod: "local",

      emailVerified: false,

      emailVerificationToken:
        verificationToken,

      emailVerificationExpires:
        verificationExpires,

      role: accountType,

      termsAccepted: true,

      termsAcceptedAt: new Date(),

      status: "active",

      tokenVersion: 0,
    });

    // --------------------------------------------------------
    // CREATE PROFILE
    // --------------------------------------------------------

    if (accountType === "student") {
      createdProfile =
        await Student.create({
          user: createdUser._id,
          name: cleanName,
          profileCompleted: false,
          onboardingStep: "basic",
        });
    }

    if (accountType === "company") {
      createdProfile =
        await Company.create({
          user: createdUser._id,
          companyName: cleanName,
          contactEmail: cleanEmail,
          profileCompleted: false,
          onboardingStep: "basic",
          verificationStatus: "unverified",
        });
    }

    // --------------------------------------------------------
    // SEND VERIFICATION EMAIL
    // --------------------------------------------------------

    try {
      await sendVerificationEmail({
        email: cleanEmail,
        name: cleanName,
        token: rawVerificationToken,
      });
    } catch (emailError) {
      if (createdProfile) {
        try {
          await createdProfile.deleteOne();
        } catch {
          // Rollback failure intentionally ignored.
        }
      }

      if (createdUser) {
        try {
          await createdUser.deleteOne();
        } catch {
          // Rollback failure intentionally ignored.
        }
      }

      return res.status(503).json({
        success: false,
        code: "EMAIL_DELIVERY_FAILED",
        message:
          "We could not send the verification email. Please try again later.",
      });
    }

    // --------------------------------------------------------
    // SIGNUP SUCCESS
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      code: "EMAIL_VERIFICATION_REQUIRED",
      message:
        "Account created. Please verify your email.",
      emailVerificationRequired: true,
      email: cleanEmail,
      role: accountType,
    });
  } catch (error) {
    if (createdProfile) {
      try {
        await createdProfile.deleteOne();
      } catch {
        // Rollback failure intentionally ignored.
      }
    }

    if (createdUser) {
      try {
        await createdUser.deleteOne();
      } catch {
        // Rollback failure intentionally ignored.
      }
    }

    if (isDuplicateKeyError(error)) {
      return res.status(409).json({
        success: false,
        code: "ACCOUNT_ALREADY_EXISTS",
        message:
          "An account with the provided information already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "SIGNUP_FAILED",
      message:
        "Unable to create your account.",
    });
  }
};

// ============================================================
// LOGIN
// ============================================================

const login = async (req, res) => {
  try {
    const {
      identifier,
      password,
    } = req.body || {};

    const cleanIdentifier =
      String(identifier || "")
        .trim()
        .toLowerCase();

    if (!cleanIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email/username and password are required.",
      });
    }

    const user =
      await User.findOne({
        $or: [
          {
            email: cleanIdentifier,
          },
          {
            username: cleanIdentifier,
          },
        ],
      }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email/username or password.",
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended.",
      });
    }

    if (
      user.authProvider === "google" &&
      !user.passwordHash
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This account uses Google login. Please continue with Google.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email/username or password.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_VERIFICATION_REQUIRED",
        emailVerificationRequired: true,
        email: user.email,
        message:
          "Please verify your email before logging in.",
      });
    }

    const profile =
      await ensureRoleProfile(user);

    user.lastLoginAt = new Date();

    await user.save();

    const token = createJwt(user);

    const nextStep =
      getNextStep(profile);

    return res.json({
      success: true,
      token,
      user: getSafeUser(user),
      nextStep,
      profileCompleted:
        getProfileCompletion(profile),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message:
        "Unable to login.",
    });
  }
};

// ============================================================
// RESEND VERIFICATION EMAIL
// ============================================================

const resendVerificationEmail = async (
  req,
  res
) => {
  try {
    const cleanEmail =
      String(req.body?.email || "")
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email: cleanEmail,
      }).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists, a verification email has been sent.",
      });
    }

    if (user.emailVerified) {
      return res.json({
        success: true,
        message:
          "Your email is already verified.",
      });
    }

    const rawToken =
      generateRandomToken();

    user.emailVerificationToken =
      hashToken(rawToken);

    user.emailVerificationExpires =
      new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

    await user.save();

    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: rawToken,
      });
    } catch {
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;

      await user.save();

      return res.status(503).json({
        success: false,
        code: "EMAIL_DELIVERY_FAILED",
        message:
          "Unable to send verification email.",
      });
    }

    return res.json({
      success: true,
      message:
        "Verification email sent.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message:
        "Unable to resend verification email.",
    });
  }
};

// ============================================================
// VERIFY EMAIL
// ============================================================

const verifyEmail = async (
  req,
  res
) => {
  try {
    const rawToken =
      String(req.query?.token || "");

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message:
          "Verification token is required.",
      });
    }

    const hashedToken =
      hashToken(rawToken);

    const user =
      await User.findOne({
        emailVerificationToken:
          hashedToken,

        emailVerificationExpires: {
          $gt: new Date(),
        },
      }).select(
        "+emailVerificationToken +emailVerificationExpires"
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired verification link.",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.json({
      success: true,
      message:
        "Email verified successfully.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message:
        "Unable to verify email.",
    });
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

const forgotPassword = async (
  req,
  res
) => {
  try {
    const cleanEmail =
      String(req.body?.email || "")
        .trim()
        .toLowerCase();

    const genericResponse = {
      success: true,
      message:
        "If an account exists, a password reset email has been sent.",
    };

    const user =
      await User.findOne({
        email: cleanEmail,
      }).select(
        "+passwordResetToken +passwordResetExpires"
      );

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken =
      generateRandomToken();

    user.passwordResetToken =
      hashToken(rawToken);

    user.passwordResetExpires =
      new Date(
        Date.now() + 60 * 60 * 1000
      );

    await user.save();

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token: rawToken,
      });
    } catch {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      await user.save();
    }

    return res.json(genericResponse);
  } catch {
    return res.json({
      success: true,
      message:
        "If an account exists, a password reset email has been sent.",
    });
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================

const resetPassword = async (
  req,
  res
) => {
  try {
    const {
      token,
      password,
    } = req.body || {};

    if (!token) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token is required.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    const hashedToken =
      hashToken(token);

    const user =
      await User.findOne({
        passwordResetToken:
          hashedToken,

        passwordResetExpires: {
          $gt: new Date(),
        },
      }).select(
        "+passwordResetToken +passwordResetExpires +passwordHash"
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired reset token.",
      });
    }

    user.passwordHash =
      await bcrypt.hash(password, 12);

    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    if (user.authProvider === "google") {
      user.authProvider = "local_google";
    }

    user.tokenVersion =
      (user.tokenVersion || 0) + 1;

    await user.save();

    return res.json({
      success: true,
      message:
        "Password reset successfully.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password.",
    });
  }
};

// ============================================================
// GOOGLE LOGIN
// ============================================================

const startGoogleLogin = async (
  req,
  res
) => {
  try {
    const state = generateRandomToken();

    res.cookie(
      "google_oauth_state",
      JSON.stringify({
        state,
        action: "login",
        role: null,
        termsAccepted: false,
        createdAt: Date.now(),
      }),
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
        path: "/",
      }
    );

    const googleUrl =
      getGoogleAuthUrl(state);

    return res.redirect(googleUrl);
  } catch {
    return res.status(500).json({
      success: false,
      message:
        "Unable to start Google authentication.",
    });
  }
};

// ============================================================
// GOOGLE SIGNUP
// ============================================================

const startGoogleSignup = async (
  req,
  res
) => {
  try {
    const role =
      String(req.query?.role || "")
        .trim()
        .toLowerCase();

    const termsAccepted =
      req.query?.termsAccepted === "true";

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid signup role.",
      });
    }

    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        message:
          "Terms acceptance is required.",
      });
    }

    const state = generateRandomToken();

    res.cookie(
      "google_oauth_state",
      JSON.stringify({
        state,
        action: "signup",
        role,
        termsAccepted: true,
        createdAt: Date.now(),
      }),
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
        path: "/",
      }
    );

    const googleUrl =
      getGoogleAuthUrl(state);

    return res.redirect(googleUrl);
  } catch {
    return res.status(500).json({
      success: false,
      message:
        "Unable to start Google signup.",
    });
  }
};

// ============================================================
// GOOGLE USERNAME
// ============================================================

const createGoogleUsername = async (
  email
) => {
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20) || "student";

  let username = base;
  let counter = 1;

  while (
    await User.exists({
      username,
    })
  ) {
    username =
      `${base}${counter}`;
    counter += 1;
  }

  return username;
};

// ============================================================
// GOOGLE CALLBACK
// ============================================================

const googleCallback = async (
  req,
  res
) => {
  try {
    // --------------------------------------------------------
    // GOOGLE ERROR
    // --------------------------------------------------------

    if (req.query?.error) {
      return res.redirect(
        `${getClientUrl()}/login?error=${encodeURIComponent(
          req.query.error
        )}`
      );
    }

    // --------------------------------------------------------
    // CODE + STATE
    // --------------------------------------------------------

    const code =
      String(req.query?.code || "");

    const state =
      String(req.query?.state || "");

    if (!code || !state) {
      return res.redirect(
        `${getClientUrl()}/login?error=missing_google_parameters`
      );
    }

    // --------------------------------------------------------
    // READ STATE COOKIE
    // --------------------------------------------------------

    const rawStateCookie =
      req.cookies?.google_oauth_state;

    if (!rawStateCookie) {
      return res.redirect(
        `${getClientUrl()}/login?error=missing_google_state`
      );
    }

    let savedState;

    try {
      savedState =
        JSON.parse(rawStateCookie);
    } catch {
      return res.redirect(
        `${getClientUrl()}/login?error=invalid_google_state`
      );
    }

    // --------------------------------------------------------
    // STATE MATCH
    // --------------------------------------------------------

    if (
      !savedState.state ||
      savedState.state !== state
    ) {
      return res.redirect(
        `${getClientUrl()}/login?error=google_state_mismatch`
      );
    }

    // --------------------------------------------------------
    // STATE AGE
    // --------------------------------------------------------

    const stateAge =
      Date.now() -
      Number(savedState.createdAt || 0);

    if (
      !savedState.createdAt ||
      stateAge > 10 * 60 * 1000
    ) {
      return res.redirect(
        `${getClientUrl()}/login?error=google_state_expired`
      );
    }

    // --------------------------------------------------------
    // CLEAR COOKIE
    // --------------------------------------------------------

    res.clearCookie(
      "google_oauth_state",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }
    );

    // --------------------------------------------------------
    // GET GOOGLE USER
    // --------------------------------------------------------

    let googleUser;

    try {
      googleUser =
        await getGoogleUser(code);
    } catch {
      return res.redirect(
        `${getClientUrl()}/login?error=google_user_fetch_failed`
      );
    }

    // --------------------------------------------------------
    // NORMALIZE GOOGLE DATA
    // --------------------------------------------------------

    const googleEmail =
      String(
        googleUser.email || ""
      )
        .trim()
        .toLowerCase();

    const googleId =
      String(
        googleUser.googleId || ""
      ).trim();

    const googleName =
      String(
        googleUser.name ||
        googleUser.firstName ||
        "Google User"
      ).trim();

    if (!googleEmail || !googleId) {
      return res.redirect(
        `${getClientUrl()}/login?error=invalid_google_profile`
      );
    }

    // --------------------------------------------------------
    // SIGNUP REQUIRES VERIFIED EMAIL
    // --------------------------------------------------------

    if (
      savedState.action === "signup" &&
      !googleUser.emailVerified
    ) {
      return res.redirect(
        `${getClientUrl()}/signup?error=google_email_not_verified`
      );
    }

    // --------------------------------------------------------
    // FIND EXISTING USER BY GOOGLE ID
    // --------------------------------------------------------

    let user =
      await User.findOne({
        googleId,
      }).select(
        "+googleId +passwordHash"
      );

    // --------------------------------------------------------
    // FIND USER BY EMAIL
    // --------------------------------------------------------

    if (!user) {
      user =
        await User.findOne({
          email: googleEmail,
        }).select(
          "+googleId +passwordHash"
        );
    }

    // ========================================================
    // GOOGLE SIGNUP
    // ========================================================

    if (
      savedState.action === "signup"
    ) {
      if (user) {
        return res.redirect(
          `${getClientUrl()}/signup?error=account_already_exists`
        );
      }

      const role =
        savedState.role;

      let username;

      if (role === "student") {
        username =
          await createGoogleUsername(
            googleEmail
          );
      }

      user =
        await User.create({
          name: googleName,

          username,

          email: googleEmail,

          passwordHash: null,

          googleId,

          authProvider: "google",

          signupMethod: "google",

          emailVerified: true,

          role,

          termsAccepted: true,

          termsAcceptedAt:
            new Date(),

          status: "active",

          tokenVersion: 0,
        });
    }

    // ========================================================
    // GOOGLE LOGIN
    // ========================================================

    if (
      savedState.action === "login"
    ) {
      if (!user) {
        return res.redirect(
          `${getClientUrl()}/login?error=google_account_not_found`
        );
      }

      user.googleId = googleId;
      user.emailVerified = true;

      if (
        user.authProvider === "local"
      ) {
        user.authProvider =
          "local_google";
      }

      await user.save();
    }

    // --------------------------------------------------------
    // ENSURE ROLE PROFILE
    // --------------------------------------------------------

    let profile;

    try {
      profile =
        await ensureRoleProfile(user);
    } catch {
      return res.redirect(
        `${getClientUrl()}/login?error=profile_creation_failed`
      );
    }

    // --------------------------------------------------------
    // UPDATE LAST LOGIN
    // --------------------------------------------------------

    user.lastLoginAt =
      new Date();

    try {
      await user.save();
    } catch {
      return res.redirect(
        `${getClientUrl()}/login?error=user_save_failed`
      );
    }

    // --------------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------------

    let token;

    try {
      token =
        createJwt(user);
    } catch {
      return res.redirect(
        `${getClientUrl()}/login?error=jwt_creation_failed`
      );
    }

    // --------------------------------------------------------
    // NEXT STEP
    // --------------------------------------------------------

    const nextStep =
      getNextStep(profile);

    // --------------------------------------------------------
    // FINAL REDIRECT
    // --------------------------------------------------------

    const clientUrl =
      getClientUrl();

    const callbackUrl =
      `${clientUrl}/google-callback`;

    const finalRedirectUrl =
      `${callbackUrl}#token=${encodeURIComponent(
        token
      )}&role=${encodeURIComponent(
        user.role
      )}&nextStep=${encodeURIComponent(
        nextStep
      )}`;

    return res.redirect(
      finalRedirectUrl
    );
  } catch {
    try {
      const errorRedirect =
        `${getClientUrl()}/login?error=google_callback_failed`;

      return res.redirect(
        errorRedirect
      );
    } catch {
      return res.status(500).json({
        success: false,
        message:
          "Google authentication failed.",
      });
    }
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  signup,
  login,

  resendVerificationEmail,
  verifyEmail,

  forgotPassword,
  resetPassword,

  startGoogleLogin,
  startGoogleSignup,
  googleCallback,
};

