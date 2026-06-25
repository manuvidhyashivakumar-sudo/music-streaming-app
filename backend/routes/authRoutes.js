const express = require("express");
const { register, login, getProfile, updatePassword } = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticate, getProfile);
router.patch("/profile/password", authenticate, updatePassword);

module.exports = router;
