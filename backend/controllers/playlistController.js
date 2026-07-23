const mongoose = require("mongoose");
const crypto = require("crypto");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

let fallbackPlaylists = [];

const getPlaylistTitle = (payload = {}) => {
  const rawTitle = typeof payload.title === "string" ? payload.title : payload.name;
  if (typeof rawTitle !== "string") return "";
  return rawTitle.trim().slice(0, 100);
};

const getPlaylistDescription = (payload = {}) => {
  const rawDescription = typeof payload.description === "string" ? payload.description : "";
  return rawDescription.trim().slice(0, 500);
};

const getPlaylistPrivacy = (payload = {}, currentPrivacy = "private") => {
  const rawPrivacy = typeof payload.privacy === "string" ? payload.privacy.trim().toLowerCase() : "";
  if (["private", "public", "unlisted"].includes(rawPrivacy)) {
    return rawPrivacy;
  }

  if (typeof payload.isPublic === "boolean") {
    return payload.isPublic ? "public" : "private";
  }

  return currentPrivacy;
};

const getRequestUserId = (req) => String(req.user?._id || req.user?.id || "");

const normalizePlaylistResponse = (playlist) => {
  const rawLikedBy = Array.isArray(playlist.likedBy) ? playlist.likedBy : [];
  const likedBy = rawLikedBy.map((entry) => String(entry)).filter(Boolean);
  const privacy = ["private", "public", "unlisted"].includes(playlist.privacy)
    ? playlist.privacy
    : playlist.isPublic
      ? "public"
      : "private";

  return {
    ...playlist,
    title: playlist.title || playlist.name || "Untitled playlist",
    name: playlist.title || playlist.name || "Untitled playlist",
    description: typeof playlist.description === "string" ? playlist.description : "",
    privacy,
    isPublic: privacy === "public",
    songs: Array.isArray(playlist.songs) ? playlist.songs : [],
    likedBy,
    likes: typeof playlist.likes === "number" ? playlist.likes : likedBy.length,
    comments: Array.isArray(playlist.comments) ? playlist.comments : [],
  };
};

const isMongoAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const toFallbackPlaylistResponse = (playlist) => {
  const songs = Array.isArray(playlist.songs)
    ? playlist.songs.map((entry) => String(entry || "")).filter(Boolean)
    : [];
  const likedBy = Array.isArray(playlist.likedBy)
    ? playlist.likedBy.map((entry) => String(entry || "")).filter(Boolean)
    : [];

  return normalizePlaylistResponse({
    _id: playlist.id,
    id: playlist.id,
    user: playlist.user,
    title: playlist.title,
    description: playlist.description || "",
    privacy: playlist.privacy || "private",
    isPublic: (playlist.privacy || "private") === "public",
    songs,
    likedBy,
    likes: typeof playlist.likes === "number" ? playlist.likes : likedBy.length,
    comments: Array.isArray(playlist.comments) ? playlist.comments : [],
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  });
};

const findFallbackOwnedPlaylist = (playlistId, userId) =>
  fallbackPlaylists.find(
    (playlist) => String(playlist.id) === String(playlistId) && String(playlist.user) === String(userId),
  ) || null;

const touchFallbackPlaylist = (playlist) => {
  playlist.updatedAt = new Date().toISOString();
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findOwnedPlaylist = async (playlistId, userId, populateSongs = false) => {
  const query = Playlist.findOne({ _id: playlistId, user: userId });
  if (populateSongs) query.populate("songs");
  return query;
};

const extractLegacySongFields = (entry) => {
  if (!entry || typeof entry !== "object") {
    return {
      rawId: String(entry || "").trim(),
      title: "",
      artist: "",
      album: "",
      genre: "",
      imageUrl: "",
      audioUrl: "",
    };
  }

  return {
    rawId: String(entry._id || entry.id || entry.songId || "").trim(),
    title: typeof entry.title === "string" ? entry.title.trim() : "",
    artist: typeof entry.artist === "string" ? entry.artist.trim() : "",
    album: typeof entry.album === "string" ? entry.album.trim() : "",
    genre: typeof entry.genre === "string" ? entry.genre.trim() : "",
    imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : typeof entry.image === "string" ? entry.image : "",
    audioUrl: typeof entry.audioUrl === "string" ? entry.audioUrl : "",
  };
};

const resolveSongDocumentFromLegacyEntry = async (entry) => {
  const fields = extractLegacySongFields(entry);

  if (fields.rawId && mongoose.Types.ObjectId.isValid(fields.rawId)) {
    const existingSong = await Song.findById(fields.rawId);
    if (existingSong) {
      return existingSong;
    }
  }

  if (fields.title) {
    const matchedSong = await Song.findOne({
      title: { $regex: `^${escapeRegex(fields.title)}$`, $options: "i" },
      ...(fields.artist
        ? { artist: { $regex: `^${escapeRegex(fields.artist)}$`, $options: "i" } }
        : {}),
    });

    if (matchedSong) {
      return matchedSong;
    }

    return Song.create({
      title: fields.title,
      artist: fields.artist || "Unknown artist",
      album: fields.album,
      genre: fields.genre,
      imageUrl: fields.imageUrl,
      audioUrl: fields.audioUrl,
    });
  }

  return null;
};

exports.createPlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const title = getPlaylistTitle(req.body);
    const description = getPlaylistDescription(req.body);
    const privacy = getPlaylistPrivacy(req.body, "private");
    if (!title) {
      return res.status(400).json({ message: "Playlist title is required" });
    }

    if (!isMongoAvailable()) {
      const now = new Date().toISOString();
      const fallbackPlaylist = {
        id: crypto.randomUUID(),
        user: userId,
        title,
        description,
        privacy,
        songs: [],
        likedBy: [],
        likes: 0,
        comments: [],
        createdAt: now,
        updatedAt: now,
      };
      fallbackPlaylists.push(fallbackPlaylist);
      return res.status(201).json(toFallbackPlaylistResponse(fallbackPlaylist));
    }

    const playlist = await Playlist.create({
      user: userId,
      title,
      description,
      privacy,
      isPublic: privacy === "public",
      songs: [],
      likedBy: [],
      likes: 0,
    });

    return res.status(201).json(normalizePlaylistResponse(playlist.toObject()));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.getPlaylists = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isMongoAvailable()) {
      const userPlaylists = fallbackPlaylists
        .filter((playlist) => String(playlist.user) === String(userId))
        .map((playlist) => toFallbackPlaylistResponse(playlist));
      return res.json(userPlaylists);
    }

    const playlists = await Playlist.find({ user: userId }).populate("songs").exec();
    return res.json(playlists.map((playlist) => normalizePlaylistResponse(playlist.toObject())));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.getPlaylistById = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isMongoAvailable()) {
      const fallbackPlaylist = findFallbackOwnedPlaylist(req.params.id, userId);
      if (!fallbackPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      return res.json(toFallbackPlaylistResponse(fallbackPlaylist));
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    const playlist = await findOwnedPlaylist(req.params.id, userId, true);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    return res.json(normalizePlaylistResponse(playlist.toObject()));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.addSongToPlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const songId = req.body?.songId;
    const songPayload = req.body?.song;
    if (!songId) {
      return res.status(400).json({ message: "songId is required" });
    }

    if (!isMongoAvailable()) {
      const fallbackPlaylist = findFallbackOwnedPlaylist(req.params.id, userId);
      if (!fallbackPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const fallbackSongId = String(songId || "").trim();
      if (!fallbackSongId) {
        return res.status(400).json({ message: "Invalid songId." });
      }

      const alreadyExists = (fallbackPlaylist.songs || []).some((id) => String(id) === fallbackSongId);
      if (!alreadyExists) {
        fallbackPlaylist.songs = [...(fallbackPlaylist.songs || []), fallbackSongId];
        touchFallbackPlaylist(fallbackPlaylist);
      }

      return res.json({
        playlist: toFallbackPlaylistResponse(fallbackPlaylist),
        added: !alreadyExists,
        songId: fallbackSongId,
        song: songPayload && typeof songPayload === "object" ? songPayload : undefined,
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    let resolvedSongId = String(songId);
    if (!mongoose.Types.ObjectId.isValid(resolvedSongId)) {
      const title = typeof songPayload?.title === "string" ? songPayload.title.trim() : "";
      const artist = typeof songPayload?.artist === "string" ? songPayload.artist.trim() : "";

      if (!title) {
        return res.status(400).json({ message: "Invalid songId." });
      }

      let matchedSong = await Song.findOne({
        title: { $regex: `^${escapeRegex(title)}$`, $options: "i" },
        ...(artist
          ? { artist: { $regex: `^${escapeRegex(artist)}$`, $options: "i" } }
          : {}),
      }).select("_id");

      // If a backend song entry does not exist yet, create one so playlist add always works.
      if (!matchedSong) {
        matchedSong = await Song.create({
          title,
          artist: artist || "Unknown artist",
          album: typeof songPayload?.album === "string" ? songPayload.album.trim() : "",
          genre: typeof songPayload?.genre === "string" ? songPayload.genre.trim() : "",
          imageUrl: typeof songPayload?.imageUrl === "string" ? songPayload.imageUrl : "",
          audioUrl: typeof songPayload?.audioUrl === "string" ? songPayload.audioUrl : "",
        });
      }

      resolvedSongId = String(matchedSong._id);
    }

    const playlist = await findOwnedPlaylist(req.params.id, userId, false);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const alreadyExists = playlist.songs.some((id) => String(id) === resolvedSongId);
    if (!alreadyExists) {
      playlist.songs.push(resolvedSongId);
      await playlist.save();
    }

    const populated = await playlist.populate("songs");
    return res.json({
      playlist: normalizePlaylistResponse(populated.toObject()),
      added: !alreadyExists,
      songId: String(resolvedSongId),
    });
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.removeSongFromPlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const songId = req.body?.songId || req.params.songId;
    if (!songId) {
      return res.status(400).json({ message: "songId is required" });
    }

    if (!isMongoAvailable()) {
      const fallbackPlaylist = findFallbackOwnedPlaylist(req.params.id, userId);
      if (!fallbackPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const normalizedSongId = String(songId);
      fallbackPlaylist.songs = (fallbackPlaylist.songs || []).filter((entry) => String(entry) !== normalizedSongId);
      touchFallbackPlaylist(fallbackPlaylist);
      return res.json(toFallbackPlaylistResponse(fallbackPlaylist));
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    const playlist = await findOwnedPlaylist(req.params.id, userId, false);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    playlist.songs.pull(songId);
    await playlist.save();

    const populated = await playlist.populate("songs");
    return res.json(normalizePlaylistResponse(populated.toObject()));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.updatePlaylist = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isMongoAvailable()) {
      const fallbackPlaylist = findFallbackOwnedPlaylist(req.params.id, userId);
      if (!fallbackPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const title = getPlaylistTitle(req.body);
      const description = getPlaylistDescription(req.body);
      const privacy = getPlaylistPrivacy(req.body, fallbackPlaylist.privacy || "private");

      const hasTitle = Boolean(title);
      const hasDescription = Object.prototype.hasOwnProperty.call(req.body || {}, "description");
      const hasPrivacy = Boolean(req.body?.privacy) || typeof req.body?.isPublic === "boolean";
      if (!hasTitle && !hasDescription && !hasPrivacy) {
        return res.status(400).json({ message: "Playlist title, description, or privacy is required" });
      }

      if (hasTitle) fallbackPlaylist.title = title;
      if (hasDescription) fallbackPlaylist.description = description;
      if (hasPrivacy) fallbackPlaylist.privacy = privacy;
      touchFallbackPlaylist(fallbackPlaylist);

      return res.json(toFallbackPlaylistResponse(fallbackPlaylist));
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    const existingPlaylist = await findOwnedPlaylist(req.params.id, userId, false);
    if (!existingPlaylist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const title = getPlaylistTitle(req.body);
    const description = getPlaylistDescription(req.body);
    const privacy = getPlaylistPrivacy(req.body, existingPlaylist.privacy || "private");

    const hasTitle = Boolean(title);
    const hasDescription = Object.prototype.hasOwnProperty.call(req.body || {}, "description");
    const hasPrivacy = Boolean(req.body?.privacy) || typeof req.body?.isPublic === "boolean";
    if (!hasTitle && !hasDescription && !hasPrivacy) {
      return res.status(400).json({ message: "Playlist title, description, or privacy is required" });
    }

    if (hasTitle) existingPlaylist.title = title;
    if (hasDescription) existingPlaylist.description = description;
    if (hasPrivacy) {
      existingPlaylist.privacy = privacy;
      existingPlaylist.isPublic = privacy === "public";
    }

    await existingPlaylist.save();
    const populated = await existingPlaylist.populate("songs");
    return res.json(normalizePlaylistResponse(populated.toObject()));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.reorderPlaylistSongs = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orderedSongIds = Array.isArray(req.body?.songIds)
      ? req.body.songIds.map((entry) => String(entry || "")).filter(Boolean)
      : [];

    if (!orderedSongIds.length) {
      return res.status(400).json({ message: "songIds array is required." });
    }

    if (!isMongoAvailable()) {
      const fallbackPlaylist = findFallbackOwnedPlaylist(req.params.id, userId);
      if (!fallbackPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const currentIds = (fallbackPlaylist.songs || []).map((entry) => String(entry));
      if (currentIds.length !== orderedSongIds.length) {
        return res.status(400).json({ message: "songIds length does not match playlist." });
      }

      const currentSet = new Set(currentIds);
      if (orderedSongIds.some((entry) => !currentSet.has(entry))) {
        return res.status(400).json({ message: "songIds contain invalid songs for this playlist." });
      }

      if (new Set(orderedSongIds).size !== orderedSongIds.length) {
        return res.status(400).json({ message: "songIds contains duplicates." });
      }

      fallbackPlaylist.songs = orderedSongIds;
      touchFallbackPlaylist(fallbackPlaylist);
      return res.json(toFallbackPlaylistResponse(fallbackPlaylist));
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    const playlist = await findOwnedPlaylist(req.params.id, userId, false);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const currentIds = playlist.songs.map((entry) => String(entry));
    if (currentIds.length !== orderedSongIds.length) {
      return res.status(400).json({ message: "songIds length does not match playlist." });
    }

    const currentSet = new Set(currentIds);
    if (orderedSongIds.some((entry) => !currentSet.has(entry))) {
      return res.status(400).json({ message: "songIds contain invalid songs for this playlist." });
    }

    if (new Set(orderedSongIds).size !== orderedSongIds.length) {
      return res.status(400).json({ message: "songIds contains duplicates." });
    }

    playlist.songs = orderedSongIds;
    await playlist.save();

    const populated = await playlist.populate("songs");
    return res.json(normalizePlaylistResponse(populated.toObject()));
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.repairPlaylistSongs = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isMongoAvailable()) {
      const fallbackPlaylist = findFallbackOwnedPlaylist(req.params.id, userId);
      if (!fallbackPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const seenSongIds = new Set();
      let repairedCount = 0;
      const repairedSongIds = [];

      for (const entry of fallbackPlaylist.songs || []) {
        const normalizedSongId = String(entry || "").trim();
        if (!normalizedSongId || seenSongIds.has(normalizedSongId)) {
          repairedCount += 1;
          continue;
        }
        seenSongIds.add(normalizedSongId);
        repairedSongIds.push(normalizedSongId);
      }

      fallbackPlaylist.songs = repairedSongIds;
      touchFallbackPlaylist(fallbackPlaylist);

      return res.json({
        playlist: toFallbackPlaylistResponse(fallbackPlaylist),
        repairedCount,
        songCount: repairedSongIds.length,
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    const playlist = await findOwnedPlaylist(req.params.id, userId, false);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const legacyEntries = Array.isArray(playlist.songs) ? [...playlist.songs] : [];
    const repairedSongIds = [];
    const seenSongIds = new Set();
    let repairedCount = 0;

    for (const entry of legacyEntries) {
      const resolvedSong = await resolveSongDocumentFromLegacyEntry(entry);
      const resolvedSongId = String(resolvedSong?._id || "");
      if (!resolvedSongId || seenSongIds.has(resolvedSongId)) {
        continue;
      }

      seenSongIds.add(resolvedSongId);
      repairedSongIds.push(resolvedSongId);

      const entryString = typeof entry === "object" ? String(entry?._id || entry?.id || entry?.songId || "") : String(entry || "");
      if (entryString !== resolvedSongId) {
        repairedCount += 1;
      }
    }

    playlist.songs = repairedSongIds;
    await playlist.save();

    const populated = await playlist.populate("songs");
    return res.json({
      playlist: normalizePlaylistResponse(populated.toObject()),
      repairedCount,
      songCount: repairedSongIds.length,
    });
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
      const fallbackPlaylist = findFallbackOwnedPlaylist(req.params.id, userId);
      if (!fallbackPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const normalizedUserId = String(userId);
      const likedBySet = new Set((fallbackPlaylist.likedBy || []).map((entry) => String(entry)));
      let liked = false;

      if (likedBySet.has(normalizedUserId)) {
        fallbackPlaylist.likedBy = (fallbackPlaylist.likedBy || []).filter((entry) => String(entry) !== normalizedUserId);
      } else {
        fallbackPlaylist.likedBy = [...(fallbackPlaylist.likedBy || []), normalizedUserId];
        liked = true;
      }

      fallbackPlaylist.likes = fallbackPlaylist.likedBy.length;
      touchFallbackPlaylist(fallbackPlaylist);

      return res.json({
        playlist: toFallbackPlaylistResponse(fallbackPlaylist),
        liked,
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    const playlist = await findOwnedPlaylist(req.params.id, userId, true);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const normalizedUserId = String(userId);
    const likedBySet = new Set((playlist.likedBy || []).map((entry) => String(entry)));
    let liked = false;

    if (likedBySet.has(normalizedUserId)) {
      playlist.likedBy = (playlist.likedBy || []).filter((entry) => String(entry) !== normalizedUserId);
      liked = false;
    } else {
      playlist.likedBy = [...(playlist.likedBy || []), normalizedUserId];
      liked = true;
    }

    playlist.likes = (playlist.likedBy || []).length;
    await playlist.save();

    return res.json({
      playlist: normalizePlaylistResponse(playlist.toObject()),
      liked,
    });
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

    if (!isMongoAvailable()) {
      const fallbackPlaylist = findFallbackOwnedPlaylist(req.params.id, userId);
      if (!fallbackPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const text = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, 500) : "";
      if (!text) {
        return res.status(400).json({ message: "Comment text is required." });
      }

      const commentUser =
        typeof req.body?.user === "string" && req.body.user.trim()
          ? req.body.user.trim().slice(0, 80)
          : req.user?.name || "Guest";

      fallbackPlaylist.comments = Array.isArray(fallbackPlaylist.comments) ? fallbackPlaylist.comments : [];
      fallbackPlaylist.comments.push({ user: commentUser, text, createdAt: new Date().toISOString() });
      touchFallbackPlaylist(fallbackPlaylist);
      return res.json(toFallbackPlaylistResponse(fallbackPlaylist));
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    const text = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, 500) : "";
    if (!text) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const commentUser =
      typeof req.body?.user === "string" && req.body.user.trim()
        ? req.body.user.trim().slice(0, 80)
        : req.user?.name || "Guest";

    const playlist = await findOwnedPlaylist(req.params.id, userId, true);
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
      const before = fallbackPlaylists.length;
      fallbackPlaylists = fallbackPlaylists.filter(
        (playlist) =>
          !(String(playlist.id) === String(req.params.id) && String(playlist.user) === String(userId)),
      );

      if (before === fallbackPlaylists.length) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      return res.json({ message: "Playlist deleted" });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid playlist id." });
    }

    await Playlist.findOneAndDelete({ _id: req.params.id, user: userId });
    return res.json({ message: "Playlist deleted" });
  } catch (error) {
    return res.status(500).json(error);
  }
};