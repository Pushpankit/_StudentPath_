const jwt = require("jsonwebtoken");

const User = require("../models/User");

/*
 * --------------------------------------------------
 * AUTHENTICATION
 * --------------------------------------------------
 *
 * Verifies:
 *
 * 1. Authorization header
 * 2. JWT
 * 3. User exists
 * 4. User account is active
 * 5. Token version is still valid
 *
 * Then attaches the current user to req.user.
 * --------------------------------------------------
 */

const protect = async (req, res, next) => {
  try {
    /*
     * ------------------------------------------------
     * JWT CONFIGURATION
     * ------------------------------------------------
     */

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        code: "SERVER_CONFIGURATION_ERROR",
        message:
          "Authentication service is not configured correctly.",
      });
    }

    /*
     * ------------------------------------------------
     * AUTHORIZATION HEADER
     * ------------------------------------------------
     */

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        code: "NOT_AUTHENTICATED",
        message:
          "Authentication is required.",
      });
    }

    const token =
      authHeader
        .slice(7)
        .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "MISSING_TOKEN",
        message:
          "Authentication token is missing.",
      });
    }

    /*
     * ------------------------------------------------
     * VERIFY JWT
     * ------------------------------------------------
     */

    let decoded;

    try {
      decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );
    } catch (error) {
      if (
        error.name ===
        "TokenExpiredError"
      ) {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message:
            "Your session has expired. Please log in again.",
        });
      }

      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message:
          "Invalid authentication token.",
      });
    }

    /*
     * ------------------------------------------------
     * BASIC TOKEN VALIDATION
     * ------------------------------------------------
     */

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message:
          "Invalid authentication token.",
      });
    }

    /*
     * ------------------------------------------------
     * LOAD CURRENT USER
     * ------------------------------------------------
     *
     * Do not trust role/status information from the
     * token alone.
     *
     * The database is the current source of truth.
     * ------------------------------------------------
     */

    const user =
      await User.findById(
        decoded.userId
      ).select(
        "_id name username email role status tokenVersion emailVerified authProvider"
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message:
          "Your account could not be found.",
      });
    }

    /*
     * ------------------------------------------------
     * ACCOUNT STATUS
     * ------------------------------------------------
     */

    if (
      user.status !== "active"
    ) {
      if (
        user.status ===
        "suspended"
      ) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message:
            "Your account has been suspended.",
        });
      }

      if (
        user.status ===
        "deleted"
      ) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DELETED",
          message:
            "This account is no longer available.",
        });
      }

      return res.status(403).json({
        success: false,
        code: "ACCOUNT_UNAVAILABLE",
        message:
          "Your account is currently unavailable.",
      });
    }

    /*
     * ------------------------------------------------
     * TOKEN VERSION
     * ------------------------------------------------
     *
     * A JWT contains the tokenVersion that existed
     * when the session was created.
     *
     * If the account's tokenVersion changes,
     * previously issued JWTs become invalid.
     *
     * Example:
     *
     * tokenVersion = 0
     *      ↓
     * User changes password
     *      ↓
     * tokenVersion = 1
     *      ↓
     * Old JWT → rejected
     * ------------------------------------------------
     */

    const tokenVersion =
      Number.isInteger(
        decoded.tokenVersion
      )
        ? decoded.tokenVersion
        : 0;

    if (
      tokenVersion !==
      user.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        code: "SESSION_REVOKED",
        message:
          "Your session is no longer valid. Please log in again.",
      });
    }

    /*
     * ------------------------------------------------
     * EMAIL VERIFICATION
     * ------------------------------------------------
     *
     * We don't globally require verification here
     * because some authenticated endpoints may need
     * to handle an unverified account.
     *
     * Individual protected routes can enforce it
     * when necessary.
     * ------------------------------------------------
     */

    /*
     * ------------------------------------------------
     * ATTACH USER
     * ------------------------------------------------
     *
     * Database values are used rather than trusting
     * role information from the JWT.
     * ------------------------------------------------
     */

    req.user = {
      userId:
        user._id.toString(),

      role:
        user.role,

      name:
        user.name,

      username:
        user.username || null,

      email:
        user.email,

      emailVerified:
        Boolean(
          user.emailVerified
        ),

      authProvider:
        user.authProvider,

      tokenVersion:
        user.tokenVersion,
    };

    /*
     * Continue to the requested route.
     */

    next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      code:
        "AUTHENTICATION_SERVICE_ERROR",
      message:
        "Unable to authenticate your request.",
    });
  }
};

module.exports = protect;