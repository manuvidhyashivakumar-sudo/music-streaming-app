const express = require("express");
const router = express.Router();
const {
  createSong,
  getSongs,
  getSongById,
  likeSong,
  addComment,
} = require("../controllers/songController");

router.get("/", getSongs);
router.get("/:id", getSongById);
router.post("/", createSong);
router.patch("/:id/like", likeSong);
router.post("/:id/comments", addComment);

module.exports = router;
