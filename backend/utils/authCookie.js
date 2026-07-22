const AUTH_COOKIE_NAME = "musicify_session";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = () => String(process.env.NODE_ENV || "").toLowerCase() === "production";

const getAuthCookieOptions = () => {
  const secure = isProduction();

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: ONE_WEEK_MS,
  };
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getAuthCookieOptions(),
    maxAge: undefined,
  });
};

module.exports = {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  setAuthCookie,
  clearAuthCookie,
};
