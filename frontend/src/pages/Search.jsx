import SongCard from "../components/SongCard";
import { useMusic } from "../context/MusicContext";

export default function Search() {
  const { searchTerm, setSearchTerm, searchResults } = useMusic();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-green-400">Search music</p>
            <h1 className="text-3xl font-bold text-white">Find songs, albums, and artists.</h1>
          </div>
          <div className="w-full max-w-md">
            <label className="sr-only">Search songs</label>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, artist, album, movie, or genre"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-6 text-xl font-bold text-white">Search results</h2>
        {searchResults.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {searchResults.map((song) => (
              <SongCard key={song._id} song={song} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center text-slate-400">
            No songs match your search. Try another artist, album, or genre.
          </div>
        )}
      </section>
    </div>
  );
}
