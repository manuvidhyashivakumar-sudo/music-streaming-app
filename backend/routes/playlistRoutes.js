const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const {
  createPlaylist,
  getPlaylists,
  addSongToPlaylist,
  removeSongFromPlaylist,
  updatePlaylist,
  likePlaylist,
  addPlaylistComment,
  deletePlaylist,
} = require("../controllers/playlistController");

router.use(authenticate);

router.get("/", getPlaylists);
router.post("/", createPlaylist);
router.patch("/:id", updatePlaylist);
router.patch("/:id/like", likePlaylist);
router.post("/:id/comments", addPlaylistComment);
router.patch("/:id/add", addSongToPlaylist);
router.patch("/:id/remove", removeSongFromPlaylist);
router.delete("/:id", deletePlaylist);

module.exports = router;
