const Playlist = require("../models/Playlist");

let fallbackPlaylistStore = {};

const DEFAULT_PLAYLIST_TITLE = "Favorites";

const getPlaylistTitle = (payload = {}) => {
  const rawTitle = typeof payload.title === "string" ? payload.title : payload.name;
  if (typeof rawTitle !== "string") return "";
  return rawTitle.trim();
};

const getRequestUserId = (req) => String(req.user?._id || req.user?.id || "");

const createDefaultFallbackPlaylist = (userId) => ({
  _id: `default-${userId}`,
  userId,
  title: DEFAULT_PLAYLIST_TITLE,
  songs: [],
});

const getFallbackPlaylistsByUser = (userId) => {
  if (!fallbackPlaylistStore[userId]) {
    fallbackPlaylistStore[userId] = [createDefaultFallbackPlaylist(userId)];
  }
  return fallbackPlaylistStore[userId];
};

const normalizePlaylistResponse = (playlist) => ({
  ...playlist,
  title: playlist.title || playlist.name || "Untitled playlist",
  songs: Array.isArray(playlist.songs) ? playlist.songs : [],
  likes: typeof playlist.likes === "number" ? playlist.likes : 0,
  comments: Array.isArray(playlist.comments) ? playlist.comments : [],
});

const isMongoAvailable = () => {
  try {
    return require("mongoose").connection.readyState === 1;
  } catch {
    return false;
  }
};

exports.createPlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const title = getPlaylistTitle(req.body);
    if (!title) {
      return res.status(400).json({ message: "Playlist title is required" });
    }

    if (!isMongoAvailable()) {
      const newPlaylist = {
        _id: `${Date.now()}`,
        userId,
        title,
        songs: [],
        likes: 0,
        comments: [],
      };
      fallbackPlaylistStore[userId] = [...getFallbackPlaylistsByUser(userId), newPlaylist];
      return res.status(201).json(newPlaylist);
    }

    const playlist = await Playlist.create({
      user: userId,
      title,
      songs: [],
    });
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getPlaylists = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isMongoAvailable()) {
      return res.json(getFallbackPlaylistsByUser(userId).map(normalizePlaylistResponse));
    }

    const playlists = await Playlist.find({ user: userId }).populate("songs").exec();
    res.json(playlists.map((playlist) => normalizePlaylistResponse(playlist.toObject())));
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.addSongToPlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const songId = req.body?.songId;
    if (!songId) {
      return res.status(400).json({ message: "songId is required" });
    }

    if (!isMongoAvailable()) {
      const userPlaylists = getFallbackPlaylistsByUser(userId);
      const playlist = userPlaylists.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      if (!playlist.songs.some((id) => id.toString() === songId.toString())) {
        playlist.songs.push(songId);
      }
      return res.json(normalizePlaylistResponse({ ...playlist }));
    }

    if (!require("mongoose").Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid songId." });
    }

    const playlist = await Playlist.findOne({ _id: req.params.id, user: userId });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!playlist.songs.some((id) => id.toString() === songId.toString())) {
      playlist.songs.push(songId);
      await playlist.save();
    }

    const populated = await playlist.populate("songs");
    res.json(normalizePlaylistResponse(populated.toObject()));
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.removeSongFromPlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const songId = req.body?.songId;
    if (!songId) {
      return res.status(400).json({ message: "songId is required" });
    }

    if (!isMongoAvailable()) {
      const userPlaylists = getFallbackPlaylistsByUser(userId);
      const playlist = userPlaylists.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      playlist.songs = playlist.songs.filter((entrySongId) => entrySongId.toString() !== songId.toString());
      return res.json(normalizePlaylistResponse({ ...playlist }));
    }

    const playlist = await Playlist.findOne({ _id: req.params.id, user: userId });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    playlist.songs = playlist.songs.filter((entrySongId) => entrySongId.toString() !== songId.toString());
    await playlist.save();

    const populated = await playlist.populate("songs");
    res.json(normalizePlaylistResponse(populated.toObject()));
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updatePlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const title = getPlaylistTitle(req.body);
    if (!title) {
      return res.status(400).json({ message: "Playlist title is required" });
    }

    if (!isMongoAvailable()) {
      const userPlaylists = getFallbackPlaylistsByUser(userId);
      const playlist = userPlaylists.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      playlist.title = title;
      return res.json(normalizePlaylistResponse({ ...playlist }));
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { title },
      { returnDocument: "after" },
    ).populate("songs");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    return res.json(normalizePlaylistResponse(playlist.toObject()));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.likePlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isMongoAvailable()) {
      const userPlaylists = getFallbackPlaylistsByUser(userId);
      const playlist = userPlaylists.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      playlist.likes = (playlist.likes || 0) + 1;
      return res.json(normalizePlaylistResponse({ ...playlist }));
    }

    const playlist = await Playlist.findOne({ _id: req.params.id, user: userId }).populate("songs");
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    playlist.likes = (playlist.likes || 0) + 1;
    await playlist.save();
    return res.json(normalizePlaylistResponse(playlist.toObject()));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.addPlaylistComment = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const commentUser =
      typeof req.body?.user === "string" && req.body.user.trim()
        ? req.body.user.trim()
        : req.user?.name || "Guest";

    if (!isMongoAvailable()) {
      const userPlaylists = getFallbackPlaylistsByUser(userId);
      const playlist = userPlaylists.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      playlist.comments = Array.isArray(playlist.comments) ? playlist.comments : [];
      playlist.comments.push({ user: commentUser, text, createdAt: new Date().toISOString() });
      return res.json(normalizePlaylistResponse({ ...playlist }));
    }

    const playlist = await Playlist.findOne({ _id: req.params.id, user: userId }).populate("songs");
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    playlist.comments = Array.isArray(playlist.comments) ? playlist.comments : [];
    playlist.comments.push({ user: commentUser, text, createdAt: new Date() });
    await playlist.save();
    return res.json(normalizePlaylistResponse(playlist.toObject()));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isMongoAvailable()) {
      const userPlaylists = getFallbackPlaylistsByUser(userId).filter(
        (entry) => entry._id !== req.params.id && entry.id !== req.params.id,
      );
      fallbackPlaylistStore[userId] = userPlaylists.length
        ? userPlaylists
        : [createDefaultFallbackPlaylist(userId)];
      return res.json({ message: "Playlist deleted" });
    }

    await Playlist.findOneAndDelete({ _id: req.params.id, user: userId });
    res.json({ message: "Playlist deleted" });
  } catch (error) {
    res.status(500).json(error);
  }
};
