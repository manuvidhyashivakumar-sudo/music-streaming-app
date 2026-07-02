const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { fallbackUsers } = require("../config/fallbackStore");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (mongoose.connection.readyState !== 1) {
      const fallbackUser = fallbackUsers.find((user) => user.id === decoded.id);
      if (!fallbackUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user = fallbackUser;
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
