const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { fallbackUsers, ensureSeedUser } = require("../config/fallbackStore");
const { getJwtSecret } = require("../utils/jwtSecret");
const { AUTH_COOKIE_NAME } = require("../utils/authCookie");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";
  const tokenFromCookie = req.cookies?.[AUTH_COOKIE_NAME] || "";
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (mongoose.connection.readyState !== 1) {
      await ensureSeedUser();
      const fallbackUser = fallbackUsers.find((entry) => entry.id === String(decoded.id || ""));
      if (!fallbackUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user = {
        id: fallbackUser.id,
        _id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
      };
      return next();
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
