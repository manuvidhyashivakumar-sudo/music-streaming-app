import { Link } from "react-router-dom";
import SongCard from "../components/SongCard";
import { useMusic } from "../context/MusicContext";

export default function Home() {
  const { songs, playlists, searchTerm, selectedGenre, setSelectedGenre } = useMusic();
  const recommended = songs.slice(0, 20);
  const filteredSongs = selectedGenre ? songs.filter((song) => song.genre === selectedGenre) : recommended;
  const displaySongs = selectedGenre ? filteredSongs : recommended;
  const topGenres = Array.from(new Set(songs.map((song) => song.genre))).slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-black/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm uppercase tracking-[0.32em] text-green-400">Musicify UI</p>
            <h1 className="text-4xl font-bold text-white">Listen, search, and stream music tailored to your preferences.</h1>
            <p className="text-slate-400">Discover recommended tracks, create playlists, and enjoy customizable playback controls with likes, comments, and downloads.</p>
          </div>
          <Link to="/search" className="inline-flex items-center justify-center rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400">
            Search music
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-green-400">Recommended</p>
                <h2 className="text-2xl font-bold text-white">Top picks for you</h2>
              </div>
              <Link to="/playlists" className="text-sm text-green-400 hover:text-green-300">Manage playlists</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {displaySongs.length > 0 ? (
                displaySongs.map((song) => <SongCard key={song._id} song={song} />)
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center text-slate-400">
                  No songs found for {selectedGenre ? `genre "${selectedGenre}"` : "your selection"}.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Top genres</h3>
            <div className="flex flex-wrap gap-3">
              {topGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    selectedGenre === genre
                      ? "border-green-500 bg-green-500 text-slate-950"
                      : "border-slate-800 bg-slate-950 text-slate-200 hover:border-green-500 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedGenre("")}
                className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-400 transition hover:border-green-500 hover:text-white"
              >
                Clear Genre
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">My playlists</h3>
            <div className="space-y-3">
              {playlists.slice(0, 3).map((playlist) => (
                <div key={playlist.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{playlist.title}</p>
                      <p className="text-sm text-slate-400">{playlist.songs.length} songs</p>
                    </div>
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-slate-950">View</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Search status</h3>
            <p className="text-slate-400">Search term: <span className="text-white">{searchTerm || 'Enter a term above'}</span></p>
          </section>
        </aside>
      </div>
    </div>
  );
}
