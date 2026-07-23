import { useEffect, useState } from "react";
import { FaHeart, FaPlay, FaPlus, FaShareAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { useMusic } from "../context/MusicContext";

export default function SongCard({ song }) {
  const {
    playSong,
    toggleLike,
    addToPlaylist,
    createPlaylist,
    setSelectedPlaylistId,
    playlists,
    user,
    isLoadingPlaylists,
  } = useMusic();
  const imageUrl = song.imageUrl || song.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f";
  const canAddToPlaylist = !isLoadingPlaylists;
  const addButtonTitle = !user
    ? "Login to add songs to playlists"
    : "Choose playlist to add song";
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [targetPlaylistId, setTargetPlaylistId] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closePicker = () => {
    setIsPickerOpen(false);
    setNewPlaylistName("");
    setIsSubmitting(false);
  };

  const openPicker = () => {
    setTargetPlaylistId("");
    setNewPlaylistName("");
    setIsPickerOpen(true);
  };

  const handleAddToPlaylist = async () => {
    if (!user) {
      toast.error("Login to add songs to playlists.");
      return;
    }

    openPicker();
  };

  const handleConfirmAdd = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let resolvedPlaylistId = targetPlaylistId;
    const normalizedNewPlaylistName = newPlaylistName.trim();

    try {
      if (normalizedNewPlaylistName) {
        const created = await createPlaylist(normalizedNewPlaylistName);
        const createdId = created?.id || created?._id;
        if (!createdId) {
          toast.error("Unable to create playlist.");
          setIsSubmitting(false);
          return;
        }
        resolvedPlaylistId = String(createdId);
      }

      if (!resolvedPlaylistId) {
        toast.error("Select a playlist or create one.");
        setIsSubmitting(false);
        return;
      }

      const selectedPlaylistTitle = playlists.find(
        (entry) => String(entry.id || entry._id || "") === String(resolvedPlaylistId),
      )?.title;

      setSelectedPlaylistId(resolvedPlaylistId);
      const result = await addToPlaylist(song, resolvedPlaylistId);
      if (!result) {
        toast.error("Unable to add song to playlist.");
        setIsSubmitting(false);
        return;
      }

      if (result.ok) {
        const destinationLabel = normalizedNewPlaylistName || selectedPlaylistTitle || "playlist";
        toast.success(result.message || `Song added to ${destinationLabel}.`);
        closePicker();
      } else {
        toast.error(result.message || "Unable to add song to playlist.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-slate-900 rounded-2xl overflow-hidden transition hover:scale-[1.01]">
        <img src={imageUrl} alt={song.title} loading="lazy" decoding="async" className="h-48 w-full object-cover" />

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{song.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{song.artist}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{song.genre || song.album}</p>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200">{song.likes ?? 0} likes</span>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={() => playSong(song)} className="inline-flex items-center justify-center gap-2 rounded-3xl bg-green-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400">
              <FaPlay /> Play
            </button>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => toggleLike(song)} className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800">
                <FaHeart />
              </button>
              <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(song.title)}&url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800">
                <FaShareAlt />
              </button>
              <button
                onClick={handleAddToPlaylist}
                disabled={!canAddToPlaylist}
                className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                title={addButtonTitle}
              >
                <FaPlus />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Add to playlist</h3>
            <p className="mt-2 text-sm text-slate-400">Choose one of your playlists or create a new one.</p>

            {playlists.length ? (
              <label className="mt-4 block text-sm text-slate-300">
                Select playlist
                <select
                  value={targetPlaylistId}
                  onChange={(event) => setTargetPlaylistId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-green-500"
                >
                  <option value="">Select playlist</option>
                  {playlists.map((playlist) => {
                    const id = String(playlist.id || playlist._id || "");
                    return (
                      <option key={id} value={id}>
                        {playlist.title || "Untitled playlist"}
                      </option>
                    );
                  })}
                </select>
              </label>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">
                You do not have a playlist yet. Create one below.
              </p>
            )}

            <label className="mt-4 block text-sm text-slate-300">
              Or create a new playlist
              <input
                value={newPlaylistName}
                onChange={(event) => setNewPlaylistName(event.target.value)}
                placeholder="Road trip mix"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-green-500"
              />
            </label>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closePicker}
                className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={isSubmitting}
                className="rounded-2xl bg-green-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400 disabled:opacity-60"
              >
                {isSubmitting ? "Adding..." : "Add song"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}