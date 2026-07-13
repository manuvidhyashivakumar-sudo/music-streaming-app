const Playlist = require("../models/Playlist");

let fallbackPlaylistStore = [{ _id: "default", title: "Favorites", songs: [] }];

const isMongoAvailable = () => {
  try {
    return require("mongoose").connection.readyState === 1;
  } catch {
    return false;
  }
};

exports.createPlaylist = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const newPlaylist = {
        _id: `${Date.now()}`,
        title: req.body.title,
        songs: [],
      };
      fallbackPlaylistStore = [...fallbackPlaylistStore, newPlaylist];
      return res.status(201).json(newPlaylist);
    }

    const playlist = await Playlist.create({
      title: req.body.title,
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
      return res.json(fallbackPlaylistStore.map((playlist) => ({ ...playlist })));
    }

    const playlists = await Playlist.find().populate("songs").exec();
    res.json(playlists);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.addSongToPlaylist = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const playlist = fallbackPlaylistStore.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      if (!playlist.songs.includes(req.body.songId)) {
        playlist.songs.push(req.body.songId);
      }
      return res.json({ ...playlist });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!playlist.songs.includes(req.body.songId)) {
      playlist.songs.push(req.body.songId);
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
    if (!isMongoAvailable()) {
      const playlist = fallbackPlaylistStore.find((entry) => entry._id === req.params.id || entry.id === req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      playlist.songs = playlist.songs.filter((songId) => songId.toString() !== req.body.songId);
      return res.json({ ...playlist });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    playlist.songs = playlist.songs.filter((songId) => songId.toString() !== req.body.songId);
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
