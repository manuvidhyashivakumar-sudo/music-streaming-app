const getJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || "").trim();
  const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";

  if (secret) {
    return secret;
  }

  if (isProduction) {
    throw new Error("JWT_SECRET must be set in production.");
  }

  return "dev-secret-change-me";
};

module.exports = { getJwtSecret };
