import { useEffect, useMemo, useState } from "react";
import { FaHeart, FaMusic, FaPause, FaPlay, FaRandom, FaShareAlt, FaStepBackward, FaStepForward, FaTrashAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useMusic } from "../context/MusicContext";
import InteractionPanel from "../components/InteractionPanel";

export default function Playlist() {
  const {
    playlists,
    selectedPlaylist,
    playlistSongs,
    songs,
    isLoadingPlaylists,
    createPlaylist,
    setSelectedPlaylistId,
    playSong,
    playPlaylist,
    currentSong,
    isPlaying,
    setIsPlaying,
    nextTrack,
    prevTrack,
    removeFromPlaylist,
    addToPlaylist,
    renamePlaylist,
    updatePlaylistDetails,
    updatePlaylistPrivacy,
    reorderPlaylistSongs,
    repairPlaylist,
    deletePlaylist,
    likePlaylist,
    addPlaylistComment,
    sharePlaylistUrl,
    playlistCounterPulse,
    user,
    authError,
    setAuthError,
  } = useMusic();
  const { id: routePlaylistId } = useParams();
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [playlistPrivacy, setPlaylistPrivacy] = useState("private");
  const [renameTitle, setRenameTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [sortMode, setSortMode] = useState("recent");
  const [orderedSongs, setOrderedSongs] = useState([]);
  const [dragSongId, setDragSongId] = useState("");
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [isRepairingPlaylist, setIsRepairingPlaylist] = useState(false);
  const [quickAddFeedback, setQuickAddFeedback] = useState("");
  const navigate = useNavigate();

  const selectedPlaylistId = selectedPlaylist?.id || selectedPlaylist?._id;
  const selectedPlaylistSongCount = selectedPlaylist?.songCount ?? selectedPlaylist?.songs?.length ?? 0;

  const resolvePlaylistCover = (playlist) => {
    const firstDetail = playlist?.songDetails?.[0];
    return firstDetail?.imageUrl || firstDetail?.image || "https://images.unsplash.com/photo-1511379938547-c1f69419868d";
  };

  useEffect(() => {
    setOrderedSongs(Array.isArray(playlistSongs) ? playlistSongs : []);
  }, [playlistSongs, selectedPlaylistId]);

  useEffect(() => {
    setQuickAddFeedback("");
  }, [selectedPlaylistId]);

  useEffect(() => {
    if (routePlaylistId) {
      setSelectedPlaylistId(routePlaylistId);
    }
  }, [routePlaylistId, setSelectedPlaylistId]);

  useEffect(() => {
    setEditDescription(String(selectedPlaylist?.description || ""));
  }, [selectedPlaylist?.id, selectedPlaylist?._id, selectedPlaylist?.description]);

  const displayedSongs = useMemo(() => {
    if (sortMode === "custom") {
      return orderedSongs;
    }

    if (sortMode === "artist") {
      return [...orderedSongs].sort((a, b) => String(a.artist || "").localeCompare(String(b.artist || "")));
    }

    if (sortMode === "title") {
      return [...orderedSongs].sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    }

    return [...orderedSongs].reverse();
  }, [orderedSongs, sortMode]);

  const onDropSong = async (targetSong) => {
    if (sortMode !== "custom" || !selectedPlaylistId) return;

    const draggedId = String(dragSongId || "");
    const targetId = String(targetSong?._id || targetSong?.id || targetSong?.title || "");
    if (!draggedId || !targetId || draggedId === targetId) return;

    const previousSongs = [...orderedSongs];
    const dragIndex = previousSongs.findIndex((entry) => String(entry?._id || entry?.id || entry?.title || "") === draggedId);
    const dropIndex = previousSongs.findIndex((entry) => String(entry?._id || entry?.id || entry?.title || "") === targetId);
    if (dragIndex < 0 || dropIndex < 0) return;

    const nextSongs = [...previousSongs];
    const [movedSong] = nextSongs.splice(dragIndex, 1);
    nextSongs.splice(dropIndex, 0, movedSong);
    setOrderedSongs(nextSongs);
    setIsSavingOrder(true);

    const nextIds = nextSongs
      .map((entry) => String(entry?._id || entry?.id || ""))
      .filter(Boolean);

    const success = await reorderPlaylistSongs(selectedPlaylistId, nextIds);
    if (!success) {
      setOrderedSongs(previousSongs);
    }
    setIsSavingOrder(false);
  };

  const privacyBadgeClasses = {
    private: "border-rose-700/50 bg-rose-900/20 text-rose-200",
    public: "border-emerald-700/50 bg-emerald-900/20 text-emerald-200",
    unlisted: "border-amber-700/50 bg-amber-900/20 text-amber-200",
  };

  const handleQuickAddSongs = async () => {
    if (!selectedPlaylistId || !songs.length || isQuickAdding) return;

    if (!user) {
      const loginMessage = "Please login to add songs to this playlist.";
      setAuthError(loginMessage);
      setQuickAddFeedback(loginMessage);
      return;
    }

    setIsQuickAdding(true);
    try {
      const existingIds = new Set(
        (selectedPlaylist?.songs || []).map((songId) => String(songId || "")).filter(Boolean),
      );
      const sourceSongs = songs
        .filter((song) => !existingIds.has(String(song?._id || song?.id || "")))
        .slice(0, 5);

      if (!sourceSongs.length) {
        setQuickAddFeedback("This playlist already contains available songs from your library.");
        return;
      }

      let addedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (const song of sourceSongs) {
        const result = await addToPlaylist(song, selectedPlaylistId);
        if (result?.ok && /added to playlist/i.test(String(result?.message || ""))) {
          addedCount += 1;
        } else if (result?.ok) {
          skippedCount += 1;
        } else {
          failedCount += 1;
        }
      }

      if (addedCount > 0) {
        setQuickAddFeedback(
          `Added ${addedCount} song${addedCount === 1 ? "" : "s"} to this playlist.` +
            (skippedCount ? ` Skipped ${skippedCount}.` : "") +
            (failedCount ? ` Failed ${failedCount}.` : ""),
        );
      } else if (failedCount > 0) {
        setQuickAddFeedback("Could not add songs right now. Please try again.");
      } else {
        setQuickAddFeedback("No new songs were added.");
      }
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleRepairPlaylist = async () => {
    if (!selectedPlaylistId || isRepairingPlaylist) return;

    setIsRepairingPlaylist(true);
    try {
      const result = await repairPlaylist(selectedPlaylistId);
      if (result?.ok) {
        const repairedMessage =
          result.repairedCount > 0
            ? `Playlist repaired. ${result.songCount} song${result.songCount === 1 ? "" : "s"} available now.`
            : result.songCount > 0
              ? `Playlist refreshed. ${result.songCount} song${result.songCount === 1 ? "" : "s"} available now.`
              : "Repair completed, but no recoverable songs were found.";
        setQuickAddFeedback(repairedMessage);
        toast.success(repairedMessage);
      } else if (result?.message) {
        setQuickAddFeedback(result.message);
        toast.error(result.message);
      }
    } finally {
      setIsRepairingPlaylist(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-green-400">Playlist management</p>
            <h1 className="text-3xl font-bold text-white">Create and manage your playlists.</h1>
          </div>
          {!user ? (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Login to manage playlists
            </button>
          ) : null}
        </div>

        {!user ? <p className="mt-5 text-sm text-amber-300">Playlists are account-specific. Please login to view or edit your playlists.</p> : null}

        {authError ? <p className="mt-4 text-sm text-red-400">{authError}</p> : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setAuthError("");
            createPlaylist(playlistName, {
              description: playlistDescription,
              privacy: playlistPrivacy,
            });
            setPlaylistName("");
            setPlaylistDescription("");
            setPlaylistPrivacy("private");
          }}
          className="mt-6 space-y-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={playlistName}
              onChange={(event) => setPlaylistName(event.target.value)}
              placeholder="Playlist name"
              disabled={!user}
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
            />
            <select
              value={playlistPrivacy}
              onChange={(event) => setPlaylistPrivacy(event.target.value)}
              disabled={!user}
              className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-green-500"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={playlistDescription}
              onChange={(event) => setPlaylistDescription(event.target.value)}
              placeholder="Description (optional)"
              disabled={!user}
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
            />
            <button disabled={!user} className="rounded-3xl bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50">
              Create playlist
            </button>
          </div>
        </form>

        {user && selectedPlaylist ? (
          <div className="mt-6 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              value={renameTitle}
              onChange={(event) => setRenameTitle(event.target.value)}
              placeholder={selectedPlaylist.title || "Rename playlist"}
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
            />
            <button
              type="button"
              onClick={async () => {
                const nextTitle = renameTitle.trim() || selectedPlaylist.title;
                const success = await renamePlaylist(selectedPlaylistId, nextTitle);
                if (success) setRenameTitle("");
              }}
              className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm("Delete this playlist? This action cannot be undone.");
                if (!confirmed) return;
                const success = await deletePlaylist(selectedPlaylistId);
                if (success) setRenameTitle("");
              }}
              className="rounded-3xl border border-red-900 bg-red-950/40 px-6 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-900/30"
            >
              Delete
            </button>
          </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder="Playlist description"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
              />
              <button
                type="button"
                onClick={() => updatePlaylistDetails(selectedPlaylistId, { description: editDescription })}
                className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Save details
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold text-white">Your playlists</h2>
          <p className="text-sm text-slate-400">Pick a playlist to open a full track view.</p>
          <div className="space-y-3">
            {isLoadingPlaylists ? (
              <p className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">Loading playlists...</p>
            ) : playlists.length ? (
              playlists.map((playlist) => (
                <button
                  key={playlist.id || playlist._id}
                  onClick={() => setSelectedPlaylistId(playlist.id || playlist._id)}
                  className={`w-full rounded-3xl border p-3 text-left transition ${
                    String(selectedPlaylist?.id || selectedPlaylist?._id) === String(playlist.id || playlist._id)
                      ? "border-green-500 bg-slate-950"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={resolvePlaylistCover(playlist)}
                      alt={playlist.title || "Playlist cover"}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{playlist.title || "Untitled playlist"}</p>
                      <p className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300 border-slate-700">
                        {playlist.privacy || "private"}
                      </p>
                      {(() => {
                        const playlistId = String(playlist.id || playlist._id || "");
                        const isPulsing = playlistCounterPulse.id === playlistId;
                        const pulseKey = isPulsing
                          ? `${playlistId}-${playlistCounterPulse.tick}`
                          : `${playlistId}-static`;
                        return (
                          <p
                            key={pulseKey}
                            className={`text-sm ${isPulsing ? "animate-pulse text-green-300" : "text-slate-400"}`}
                          >
                            {playlist.songCount ?? playlist.songs?.length ?? 0} songs
                          </p>
                        );
                      })()}
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200">Open</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">No playlists yet. Create one to get started.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="sticky top-4 z-20 mb-6 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <img
                src={currentSong?.imageUrl || currentSong?.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"}
                alt={currentSong?.title || "Now playing"}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{currentSong?.title || "No song selected"}</p>
                <p className="truncate text-xs text-slate-400">{currentSong?.artist || "Pick a song from this playlist"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={prevTrack} className="rounded-full border border-slate-700 p-2 text-slate-200 transition hover:bg-slate-800">
                  <FaStepBackward />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((previous) => !previous)}
                  className="rounded-full bg-green-500 p-2 text-slate-950 transition hover:bg-green-400"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button type="button" onClick={nextTrack} className="rounded-full border border-slate-700 p-2 text-slate-200 transition hover:bg-slate-800">
                  <FaStepForward />
                </button>
              </div>
            </div>
          </div>

          {selectedPlaylist ? (
            <section className="mb-6 rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <img
                  src={resolvePlaylistCover(selectedPlaylist)}
                  alt={selectedPlaylist.title || "Playlist cover"}
                  className="h-40 w-40 rounded-3xl object-cover shadow-xl shadow-black/30"
                />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.32em] text-green-300">Playlist</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">{selectedPlaylist.title || "Untitled playlist"}</h2>
                  {selectedPlaylist.description ? (
                    <p className="mt-2 text-sm text-slate-400">{selectedPlaylist.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-slate-300">{selectedPlaylistSongCount} songs • Curated by you</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${privacyBadgeClasses[selectedPlaylist.privacy || "private"] || privacyBadgeClasses.private}`}>
                      {selectedPlaylist.privacy || "private"}
                    </span>
                    <label className="text-xs text-slate-300">
                      Privacy
                      <select
                        value={selectedPlaylist.privacy || "private"}
                        onChange={(event) => updatePlaylistPrivacy(selectedPlaylistId, event.target.value)}
                        className="ml-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 outline-none focus:border-green-500"
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        playPlaylist(playlistSongs, { shuffle: false });
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400"
                    >
                      <FaPlay /> Play all
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playPlaylist(playlistSongs, { shuffle: true });
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                      <FaRandom /> Shuffle
                    </button>
                    <button
                      type="button"
                      onClick={() => likePlaylist(selectedPlaylistId)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                      <FaHeart /> Like ({selectedPlaylist.likes ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const link = sharePlaylistUrl(selectedPlaylistId);
                        if (!link) return;
                        try {
                          await navigator.clipboard.writeText(link);
                          toast.success("Playlist link copied successfully.");
                        } catch {
                          toast.error("Unable to copy link.");
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                      <FaShareAlt /> Share
                    </button>
                    <button
                      type="button"
                      onClick={handleRepairPlaylist}
                      disabled={isRepairingPlaylist}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-700/40 bg-amber-950/20 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/30 disabled:opacity-60"
                    >
                      {isRepairingPlaylist ? "Repairing..." : "Repair playlist"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="mb-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-400">
              Select a playlist to view tracks and manage it.
            </div>
          )}

          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-green-400">Track list</p>
              <h3 className="text-2xl font-bold text-white">{selectedPlaylist?.title || "No playlist selected"}</h3>
              {selectedPlaylist ? (
                <p className="mt-2 text-sm text-slate-300">
                  Songs in current playlist: <span className="font-semibold text-green-300">{selectedPlaylistSongCount}</span>
                  {displayedSongs.length !== selectedPlaylistSongCount ? (
                    <span className="ml-2 text-xs text-slate-400">(showing {displayedSongs.length})</span>
                  ) : null}
                </p>
              ) : null}
            </div>
            {selectedPlaylist ? (
              <div className="flex items-center gap-2">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Sort</label>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-green-500"
                >
                  <option value="recent">Recently Added</option>
                  <option value="artist">Artist</option>
                  <option value="title">Title</option>
                  <option value="custom">Custom Order</option>
                </select>
              </div>
            ) : null}
          </div>

          {sortMode === "custom" && isSavingOrder ? (
            <p className="mb-3 text-xs text-green-300">Saving playlist order...</p>
          ) : null}

          {sortMode !== "custom" && selectedPlaylist ? (
            <p className="mb-3 text-xs text-slate-400">Switch to Custom Order to drag and reorder tracks.</p>
          ) : null}

          {displayedSongs.length ? (
            <div className="space-y-2">
              {displayedSongs.map((song, index) => (
                <div
                  key={song._id || song.id || song.title}
                  draggable={sortMode === "custom"}
                  onDragStart={() => setDragSongId(String(song._id || song.id || song.title || ""))}
                  onDragOver={(event) => {
                    if (sortMode === "custom") {
                      event.preventDefault();
                    }
                  }}
                  onDrop={async () => {
                    await onDropSong(song);
                    setDragSongId("");
                  }}
                  className={`rounded-2xl border border-slate-800 bg-slate-950 p-3 ${sortMode === "custom" ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <div className="grid items-center gap-3 sm:grid-cols-[auto_56px_1fr_auto]">
                    <p className="text-center text-sm font-semibold text-slate-400">{index + 1}</p>
                    <img
                      src={song.imageUrl || song.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"}
                      alt={song.title || "Song"}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{song.title}</p>
                      <p className="truncate text-sm text-slate-400">{song.artist}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{song.genre || song.album || "Track"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playSong(song)}
                        className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-green-400"
                      >
                        <FaPlay /> Play
                      </button>
                      <button
                        onClick={() => removeFromPlaylist(song._id || song.id, selectedPlaylist?.id || selectedPlaylist?._id)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                      >
                        <FaTrashAlt /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center text-slate-400">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <FaMusic />
              </div>
              No songs added to this playlist yet.
              {selectedPlaylist ? (
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Viewing: {selectedPlaylist.title || "Untitled playlist"}
                </p>
              ) : null}
              <p className="mt-2">Add songs from Home/Search and they will show up here.</p>
              {quickAddFeedback ? <p className="mt-2 text-xs text-green-300">{quickAddFeedback}</p> : null}
              {selectedPlaylist ? (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleQuickAddSongs}
                    disabled={isQuickAdding || !songs.length}
                    className="rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400 disabled:opacity-60"
                  >
                    {isQuickAdding ? "Adding songs..." : "Add songs now"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Browse library
                  </button>
                  <button
                    type="button"
                    onClick={handleRepairPlaylist}
                    disabled={isRepairingPlaylist}
                    className="rounded-full border border-amber-700/40 bg-amber-950/20 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/30 disabled:opacity-60"
                  >
                    {isRepairingPlaylist ? "Repairing..." : "Repair playlist"}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {selectedPlaylist ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="mb-4 text-lg font-bold text-white">Playlist interactions</h3>
              <InteractionPanel
                item={selectedPlaylist}
                label="playlist"
                onLike={() => likePlaylist(selectedPlaylistId)}
                onComment={(text) => addPlaylistComment(selectedPlaylistId, text)}
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
