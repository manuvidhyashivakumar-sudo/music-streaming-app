import { FaHeart, FaPlay, FaPlus, FaShareAlt } from "react-icons/fa";
import { useMusic } from "../context/MusicContext";

export default function SongCard({ song }) {
  const { playSong, toggleLike, addToPlaylist, selectedPlaylist } = useMusic();
  const imageUrl = song.imageUrl || song.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f";

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden transition hover:scale-[1.01]">
      <img src={imageUrl} alt={song.title} className="h-48 w-full object-cover" />

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
            {selectedPlaylist ? (
              <button onClick={() => addToPlaylist(song, selectedPlaylist?.id || selectedPlaylist?._id)} className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800">
                <FaPlus />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}