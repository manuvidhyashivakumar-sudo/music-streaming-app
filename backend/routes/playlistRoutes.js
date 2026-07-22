const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const {
  createPlaylist,
  getPlaylists,
  getPlaylistById,
  addSongToPlaylist,
  removeSongFromPlaylist,
  repairPlaylistSongs,
  updatePlaylist,
  reorderPlaylistSongs,
  likePlaylist,
  addPlaylistComment,
  deletePlaylist,
} = require("../controllers/playlistController");

router.use(authenticate);

router.get("/", getPlaylists);
router.post("/", createPlaylist);
router.get("/:id", getPlaylistById);
router.put("/:id", updatePlaylist);
router.patch("/:id", updatePlaylist);
router.post("/:id/repair", repairPlaylistSongs);
router.patch("/:id/reorder", reorderPlaylistSongs);
router.patch("/:id/like", likePlaylist);
router.post("/:id/comments", addPlaylistComment);
router.post("/:id/add-song", addSongToPlaylist);
router.patch("/:id/add", addSongToPlaylist);
router.delete("/:id/remove-song/:songId", removeSongFromPlaylist);
router.patch("/:id/remove", removeSongFromPlaylist);
router.delete("/:id", deletePlaylist);

module.exports = router;
