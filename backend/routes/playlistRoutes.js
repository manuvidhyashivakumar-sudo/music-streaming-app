const express = require("express");
const router = express.Router();
const {
  createPlaylist,
  getPlaylists,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
} = require("../controllers/playlistController");

router.get("/", getPlaylists);
router.post("/", createPlaylist);
router.patch("/:id/add", addSongToPlaylist);
router.patch("/:id/remove", removeSongFromPlaylist);
router.delete("/:id", deletePlaylist);

module.exports = router;
