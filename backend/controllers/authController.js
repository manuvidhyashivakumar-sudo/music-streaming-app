const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { fallbackUsers, normalizeEmail, ensureSeedUser } = require("../config/fallbackStore");
const { getJwtSecret } = require("../utils/jwtSecret");
const { setAuthCookie, clearAuthCookie } = require("../utils/authCookie");

const normalizeAuthPayload = (payload = {}) => {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const name = typeof safePayload.name === "string" ? safePayload.name.trim() : "";
  const email = typeof safePayload.email === "string" ? safePayload.email.trim().toLowerCase() : "";
  const password = typeof safePayload.password === "string" ? safePayload.password : "";
  return { name, email, password };
};

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const toFallbackUserResponse = (fallbackUser) => ({
  id: fallbackUser.id,
  _id: fallbackUser.id,
  name: fallbackUser.name,
  email: fallbackUser.email,
});

const createAuthResponse = (account, token) => {
  const userId = String(account?._id || account?.id || "");
  const userName = typeof account?.name === "string" ? account.name : "";
  const userEmail = typeof account?.email === "string" ? account.email : "";

  const safeToken = typeof token === "string" ? token.trim() : "";
  if (!userId || !safeToken || !userName || !userEmail) {
    throw new Error("Auth response contract violation");
  }

  return {
    token: safeToken,
    accessToken: safeToken,
    user: {
      id: userId,
      _id: userId,
      name: userName,
      email: userEmail,
    },
  };
};

exports.seedDefaultUser = async () => {
  if (!isDatabaseConnected()) {
    await ensureSeedUser();
    return;
  }

  const defaultEmail = "user@example.com";
  const existing = await User.findOne({ email: defaultEmail });
  if (!existing) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.create({
      name: "Demo User",
      email: defaultEmail,
      password: hashedPassword,
    });
    console.log("Seeded default user: user@example.com / password123");
  }
};

const getUserModel = () => {
  if (!isDatabaseConnected()) {
    return null;
  }

  return User;
};

exports.register = async (req, res) => {
  try {
    const model = getUserModel();
    await ensureSeedUser();

    const { name, email, password } = normalizeAuthPayload(req.body);
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    let existingUser = null;
    if (model) {
      existingUser = await model.findOne({ email });
    } else {
      existingUser = fallbackUsers.find((entry) => normalizeEmail(entry.email) === normalizeEmail(email)) || null;
    }

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered. Please login instead." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser = null;

    if (model) {
      newUser = await model.create({
        name,
        email,
        password: hashedPassword,
      });
    } else {
      const fallbackUser = {
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
      };
      fallbackUsers.push(fallbackUser);
      newUser = toFallbackUserResponse(fallbackUser);
    }

    const token = jwt.sign({ id: newUser._id || newUser.id }, getJwtSecret(), { expiresIn: "7d" });
    const authResponse = createAuthResponse(newUser, token);
    setAuthCookie(res, token);
    res.status(201).json(authResponse);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to register user." });
  }
};

exports.login = async (req, res) => {
  try {
    const model = getUserModel();
    await ensureSeedUser();

    const { email, password } = normalizeAuthPayload(req.body);
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    let user = null;
    if (model) {
      user = await model.findOne({ email });
    } else {
      user = fallbackUsers.find((entry) => normalizeEmail(entry.email) === normalizeEmail(email)) || null;
      if (user) {
        user = toFallbackUserResponse(user);
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    let hashedPassword = user.password;
    if (!hashedPassword && !model) {
      const fallbackEntry = fallbackUsers.find((entry) => entry.id === user.id);
      hashedPassword = fallbackEntry?.password;
    }

    const isMatch = await bcrypt.compare(password, hashedPassword || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: "7d" });
    const authResponse = createAuthResponse(user, token);
    setAuthCookie(res, token);
    res.json(authResponse);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to login." });
  }
};

exports.logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out successfully." });
};

exports.getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({
    id: req.user._id || req.user.id,
    name: req.user.name,
    email: req.user.email,
  });
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    if (!isDatabaseConnected()) {
      await ensureSeedUser();
      const fallbackUser = fallbackUsers.find((entry) => entry.id === String(req.user.id || req.user._id));
      if (!fallbackUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isMatch = await bcrypt.compare(currentPassword, fallbackUser.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }

      fallbackUser.password = await bcrypt.hash(newPassword, 10);
      return res.json({ message: "Password updated successfully." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update password." });
  }
};
