const bcrypt = require("bcryptjs");

const fallbackUsers = [];
const fallbackSeedEmail = "user@example.com";

const normalizeEmail = (email) => email.toLowerCase().trim();

const ensureSeedUser = async () => {
  const existingSeedUser = fallbackUsers.find((entry) => normalizeEmail(entry.email) === fallbackSeedEmail);
  if (existingSeedUser) {
    return fallbackUsers;
  }

  const hashedPassword = await bcrypt.hash("password123", 10);
  fallbackUsers.push({
    id: "fallback-demo-user",
    name: "Demo User",
    email: fallbackSeedEmail,
    password: hashedPassword,
  });

  return fallbackUsers;
};

module.exports = {
  fallbackUsers,
  normalizeEmail,
  ensureSeedUser,
};
