const Playlist = require("../models/Playlist");

let fallbackPlaylistStore = [{ _id: "default", title: "Favorites", songs: [] }];

const getPlaylistTitle = (payload = {}) => {
  const rawTitle = typeof payload.title === "string" ? payload.title : payload.name;
  if (typeof rawTitle !== "string") return "";
  return rawTitle.trim();
};

const isMongoAvailable = () => {
  try {
    return require("mongoose").connection.readyState === 1;
  } catch {
    return false;
  }
};

exports.createPlaylist = async (req, res) => {
  try {
    const title = getPlaylistTitle(req.body);
    if (!title) {
      return res.status(400).json({ message: "Playlist title is required" });
    }

    if (!isMongoAvailable()) {
      const newPlaylist = {
        _id: `${Date.now()}`,
        title,
        songs: [],
      };
      fallbackPlaylistStore = [...fallbackPlaylistStore, newPlaylist];
      return res.status(201).json(newPlaylist);
    }

    const playlist = await Playlist.create({
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
    if (!isMongoAvailable()) {
      return res.json(
        fallbackPlaylistStore.map((playlist) => ({
          ...playlist,
          title: playlist.title || playlist.name || "Untitled playlist",
          songs: Array.isArray(playlist.songs) ? playlist.songs : [],
        })),
      );
    }

    const playlists = await Playlist.find().populate("songs").exec();
    res.json(
      playlists.map((playlist) => ({
        ...playlist.toObject(),
        title: playlist.title || playlist.name || "Untitled playlist",
        songs: Array.isArray(playlist.songs) ? playlist.songs : [],
      })),
    );
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.addSongToPlaylist = async (req, res) => {
  try {
    const songId = req.body?.songId;
    if (!songId) {
      return res.status(400).json({ message: "songId is required" });
    }

    if (!isMongoAvailable()) {
      const playlist = fallbackPlaylistStore.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      if (!playlist.songs.some((id) => id.toString() === songId.toString())) {
        playlist.songs.push(songId);
      }
      return res.json({ ...playlist });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!playlist.songs.some((id) => id.toString() === songId.toString())) {
      playlist.songs.push(songId);
      await playlist.save();
    }

    const populated = await playlist.populate("songs");
    res.json(populated);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.removeSongFromPlaylist = async (req, res) => {
  try {
    const songId = req.body?.songId;
    if (!songId) {
      return res.status(400).json({ message: "songId is required" });
    }

    if (!isMongoAvailable()) {
      const playlist = fallbackPlaylistStore.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      playlist.songs = playlist.songs.filter((entrySongId) => entrySongId.toString() !== songId.toString());
      return res.json({ ...playlist });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    playlist.songs = playlist.songs.filter((entrySongId) => entrySongId.toString() !== songId.toString());
    await playlist.save();

    const populated = await playlist.populate("songs");
    res.json(populated);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      fallbackPlaylistStore = fallbackPlaylistStore.filter((entry) => entry._id !== req.params.id && entry.id !== req.params.id);
      return res.json({ message: "Playlist deleted" });
    }

    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: "Playlist deleted" });
  } catch (error) {
    res.status(500).json(error);
  }
};
