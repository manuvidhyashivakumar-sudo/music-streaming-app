const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { fallbackUsers, normalizeEmail, ensureSeedUser } = require("../config/fallbackStore");

exports.seedDefaultUser = async () => {
  if (mongoose.connection.readyState !== 1) {
    await ensureSeedUser();
    return;
  }

  const count = await User.countDocuments();
  if (count === 0) {
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
  }
};

const getUserStore = async () => {
  if (mongoose.connection.readyState !== 1) {
    await ensureSeedUser();
    return { model: null, fallback: true };
  }

  return { model: User, fallback: false };
};

exports.register = async (req, res) => {
  try {
    const { model, fallback } = await getUserStore();
    if (fallback) {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required." });
      }

      const normalizedEmail = normalizeEmail(email);
      const existingUser = fallbackUsers.find((user) => user.email === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Email is already registered." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: `${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      };
      fallbackUsers.push(newUser);

      const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.set("Authorization", `Bearer ${token}`);
      res.set("X-Auth-Token", token);
      return res.status(201).json({
        user: { id: newUser.id, _id: newUser.id, name: newUser.name, email: newUser.email },
        accessToken: token,
        token,
      });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existingUser = await model.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await model.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.set("Authorization", `Bearer ${token}`);
    res.set("X-Auth-Token", token);
    res.status(201).json({
      user: {
        id: newUser._id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
      accessToken: token,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to register user." });
  }
};

exports.login = async (req, res) => {
  try {
    const { model, fallback } = await getUserStore();
    if (fallback) {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const normalizedEmail = normalizeEmail(email);
      const user = fallbackUsers.find((item) => item.email === normalizedEmail);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.set("Authorization", `Bearer ${token}`);
      res.set("X-Auth-Token", token);
      return res.json({
        user: { id: user.id, _id: user.id, name: user.name, email: user.email },
        accessToken: token,
        token,
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await model.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.set("Authorization", `Bearer ${token}`);
    res.set("X-Auth-Token", token);
    res.json({
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken: token,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to login." });
  }
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

    const user = await User.findById(req.user._id);
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
