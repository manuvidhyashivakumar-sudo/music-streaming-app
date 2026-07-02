const bcrypt = require("bcryptjs");

const fallbackUsers = [];

const normalizeEmail = (email) => email.toLowerCase().trim();

const ensureSeedUser = async () => {
  if (fallbackUsers.length > 0) {
    return fallbackUsers;
  }

  const hashedPassword = await bcrypt.hash("password123", 10);
  fallbackUsers.push({
    id: "fallback-demo-user",
    name: "Demo User",
    email: "user@example.com",
    password: hashedPassword,
  });

  return fallbackUsers;
};

module.exports = {
  fallbackUsers,
  normalizeEmail,
  ensureSeedUser,
};
