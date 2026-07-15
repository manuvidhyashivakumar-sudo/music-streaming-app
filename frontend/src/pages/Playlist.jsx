import { useState } from "react";
import { useMusic } from "../context/MusicContext";

export default function Playlist() {
  const {
    playlists,
    selectedPlaylist,
    playlistSongs,
    isLoadingPlaylists,
    createPlaylist,
    setSelectedPlaylistId,
    playSong,
    removeFromPlaylist,
  } = useMusic();
  const [playlistName, setPlaylistName] = useState("");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-green-400">Playlist management</p>
            <h1 className="text-3xl font-bold text-white">Create and manage your playlists.</h1>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            createPlaylist(playlistName);
            setPlaylistName("");
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={playlistName}
            onChange={(event) => setPlaylistName(event.target.value)}
            placeholder="New playlist name"
            className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
          />
          <button className="rounded-3xl bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400">
            Create playlist
          </button>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold text-white">Your playlists</h2>
          <div className="space-y-3">
            {isLoadingPlaylists ? (
              <p className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">Loading playlists...</p>
            ) : playlists.length ? (
              playlists.map((playlist) => (
                <button
                  key={playlist.id || playlist._id}
                  onClick={() => setSelectedPlaylistId(playlist.id || playlist._id)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                    String(selectedPlaylist?.id || selectedPlaylist?._id) === String(playlist.id || playlist._id)
                      ? "border-green-500 bg-slate-950"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <p className="font-semibold text-white">{playlist.title || "Untitled playlist"}</p>
                  <p className="text-sm text-slate-400">{playlist.songs?.length || 0} songs</p>
                </button>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">No playlists yet. Create one to get started.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-green-400">Playlist details</p>
              <h2 className="text-2xl font-bold text-white">{selectedPlaylist?.title || "Select a playlist"}</h2>
            </div>
          </div>

          {playlistSongs.length ? (
            <div className="space-y-4">
              {playlistSongs.map((song) => (
                <div key={song._id || song.id || song.title} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{song.title}</p>
                      <p className="text-sm text-slate-400">{song.artist}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => playSong(song)} className="rounded-3xl bg-green-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400">
                        Play
                      </button>
                      <button onClick={() => removeFromPlaylist(song._id || song.id, selectedPlaylist?.id || selectedPlaylist?._id)} className="rounded-3xl border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center text-slate-400">
              No songs added to this playlist yet. Add music from Home or Search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
