const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";

/*
 * ==================================================
 * CONFIGURATION
 * ==================================================
 */

const getGoogleConfig = () => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  } = process.env;

  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "GOOGLE_CLIENT_ID is not configured."
    );
  }

  if (!GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "GOOGLE_CLIENT_SECRET is not configured."
    );
  }

  if (!GOOGLE_REDIRECT_URI) {
    throw new Error(
      "GOOGLE_REDIRECT_URI is not configured."
    );
  }

  return {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  };
};

/*
 * ==================================================
 * GOOGLE AUTH URL
 * ==================================================
 */

const getGoogleAuthUrl = (
  state
) => {
  if (!state) {
    throw new Error(
      "Google OAuth state is required."
    );
  }

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_REDIRECT_URI,
  } = getGoogleConfig();

  const params =
    new URLSearchParams({
      client_id:
        GOOGLE_CLIENT_ID,

      redirect_uri:
        GOOGLE_REDIRECT_URI,

      response_type:
        "code",

      scope:
        "openid email profile",

      state,

      prompt:
        "select_account",

      response_mode:
        "query",
    });

  return (
    `${GOOGLE_AUTH_URL}?` +
    params.toString()
  );
};

/*
 * ==================================================
 * GOOGLE TOKEN REQUEST
 * ==================================================
 */

const getGoogleTokens =
  async (code) => {
    if (!code) {
      throw new Error(
        "Google authorization code is required."
      );
    }

    const {
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI,
    } = getGoogleConfig();

    const body =
      new URLSearchParams({
        code,

        client_id:
          GOOGLE_CLIENT_ID,

        client_secret:
          GOOGLE_CLIENT_SECRET,

        redirect_uri:
          GOOGLE_REDIRECT_URI,

        grant_type:
          "authorization_code",
      });

    const response =
      await fetch(
        GOOGLE_TOKEN_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            body.toString(),
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      console.error(
        "Google token exchange failed:",
        data
      );

      throw new Error(
        data.error_description ||
          "Google token exchange failed."
      );
    }

    return data;
  };

/*
 * ==================================================
 * GOOGLE USER
 * ==================================================
 */

const getGoogleUser =
  async (code) => {
    const tokens =
      await getGoogleTokens(
        code
      );

    if (
      !tokens.access_token
    ) {
      throw new Error(
        "Google did not return an access token."
      );
    }

    const response =
      await fetch(
        GOOGLE_USERINFO_URL,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${tokens.access_token}`,
          },
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      console.error(
        "Google user info request failed:",
        data
      );

      throw new Error(
        data.error_description ||
          data.error ||
          "Unable to retrieve Google account information."
      );
    }

    if (
      !data.sub ||
      !data.email
    ) {
      throw new Error(
        "Google account information is incomplete."
      );
    }

    return {
      googleId:
        String(data.sub),

      email:
        String(data.email)
          .trim()
          .toLowerCase(),

      emailVerified:
        data.email_verified === true,

      name:
        data.name ||
        "",

      firstName:
        data.given_name ||
        "",

      lastName:
        data.family_name ||
        "",

      picture:
        data.picture ||
        "",
    };
  };

module.exports = {
  getGoogleAuthUrl,
  getGoogleUser,
};