import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NowPlayingBar from "../components/NowPlayingBar";
import DetailedPlayer from "../components/DetailedPlayer";
import { useMusic } from "../context/MusicContext";

function AlbumCard({ song }) {
  return (
    <div className="w-44 rounded-lg overflow-hidden bg-slate-800 shadow-md">
      <img src={song.imageUrl} alt={song.title} className="h-44 w-full object-cover" />
      <div className="p-3">
        <p className="text-sm font-semibold text-white">{song.title}</p>
        <p className="text-xs text-slate-400">{song.artist}</p>
      </div>
    </div>
  );
}

export default function MusicifyUI() {
  const { songs, currentSong, playSong, isPlaying, setIsPlaying } = useMusic();

  useEffect(() => {
    if (!currentSong && songs.length) {
      playSong(songs[0]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="lg:flex lg:min-h-screen">
        <aside className="hidden lg:block lg:w-64">
          <Sidebar />
        </aside>

        <div className="flex-1 px-6 py-8 pb-32">
          <h1 className="mb-6 text-2xl font-bold">Popular albums and singles</h1>

          <div className="mb-10">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {songs.slice(0, 12).map((s) => (
                <AlbumCard key={s._id} song={s} />
              ))}
            </div>
          </div>

          <h2 className="mb-4 text-xl font-semibold">Popular radio</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {songs.slice(0, 8).map((s) => (
              <div key={s._id} className="rounded-lg bg-slate-900 p-4">
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-slate-400">{s.artist}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <NowPlayingBar />
          </div>
        </div>

        {/* Detailed player moved to fixed bottom bar on large screens */}
        <div className="fixed left-6 right-6 bottom-6 z-50 hidden lg:block">
          <div className="mx-auto max-w-6xl">
            <DetailedPlayer />
          </div>
        </div>
      </div>
    </div>
  );
}
