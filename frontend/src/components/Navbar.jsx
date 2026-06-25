import { useNavigate } from "react-router-dom";
import { FaBell, FaSearch } from "react-icons/fa";
import { useMusic } from "../context/MusicContext";

export default function Navbar() {
  const { searchTerm, setSearchTerm, user } = useMusic();
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 px-4 py-4 shadow-sm shadow-black/5 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            navigate("/search");
          }}
          className="flex-1"
        >
          <label className="sr-only">Search music</label>
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search songs, artists, albums, or genres"
              className="w-full rounded-full border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
            />
          </div>
        </form>

        <div className="flex items-center gap-4">
          <button className="rounded-full border border-slate-800 bg-slate-900 p-3 text-slate-300 transition hover:bg-slate-800">
            <FaBell />
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300">
              {user ? user.name.charAt(0).toUpperCase() : "G"}
            </span>
            <span>{user ? user.name : "Guest"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
