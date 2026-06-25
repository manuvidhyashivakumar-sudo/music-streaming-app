import { useEffect, useMemo, useState } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaRandom, FaRedo } from "react-icons/fa";
import { useMusic } from "../context/MusicContext";

function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    shuffle,
    setShuffle,
    repeat,
    audioRef,
    handleEnded,
    songs,
  } = useMusic();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const timeUpdate = () => setProgress(audio.currentTime);
    const loadedMeta = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", timeUpdate);
    audio.addEventListener("loadedmetadata", loadedMeta);

    return () => {
      audio.removeEventListener("timeupdate", timeUpdate);
      audio.removeEventListener("loadedmetadata", loadedMeta);
    };
  }, [audioRef, currentSong]);

  useEffect(() => {
    if (!currentSong) {
      setProgress(0);
      setDuration(0);
    }
  }, [currentSong]);

  const togglePlayPause = () => {
    if (!currentSong) return;
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(event.target.value);
    audio.currentTime = value;
    setProgress(value);
  };

  const queue = useMemo(() => {
    if (!currentSong || !songs.length) return [];
    const currentIndex = songs.findIndex((song) => song._id === currentSong._id);
    if (currentIndex === -1) return [];
    return songs.slice(currentIndex + 1).concat(songs.slice(0, currentIndex)).slice(0, 5);
  }, [currentSong, songs]);

  if (!currentSong) {
    return (
      <div className="w-full bg-slate-900 p-5 border-t border-slate-800 text-slate-400 lg:w-80 lg:border-l lg:border-t-0">
        <p>No song selected. Play a track from Home or Search.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 p-5 border-t border-slate-800 text-slate-100 lg:w-80 lg:border-l lg:border-t-0">
      <audio key={currentSong._id} ref={audioRef} src={currentSong.audioUrl} autoPlay={isPlaying} onEnded={handleEnded} />

      <div className="flex flex-col gap-4">
        <img src={currentSong.imageUrl || currentSong.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"} alt={currentSong.title} className="h-40 w-full rounded-3xl object-cover" />

        <div>
          <h2 className="text-lg font-semibold text-white">{currentSong.title}</h2>
          <p className="text-sm text-slate-400">{currentSong.artist} • {currentSong.album || currentSong.genre}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevTrack} className="rounded-full bg-slate-950 p-3 text-slate-200 transition hover:bg-slate-800">
              <FaStepBackward />
            </button>
            <button onClick={togglePlayPause} className="rounded-full bg-green-500 p-3 text-slate-950 transition hover:bg-green-400">
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={nextTrack} className="rounded-full bg-slate-950 p-3 text-slate-200 transition hover:bg-slate-800">
              <FaStepForward />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShuffle((prev) => !prev)} className={`rounded-full p-3 transition ${shuffle ? "bg-green-500 text-slate-950" : "bg-slate-950 text-slate-200 hover:bg-slate-800"}`}>
              <FaRandom />
            </button>
            <button onClick={() => setRepeat((prev) => !prev)} className={`rounded-full p-3 transition ${repeat ? "bg-green-500 text-slate-950" : "bg-slate-950 text-slate-200 hover:bg-slate-800"}`}>
              <FaRedo />
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            className="mt-3 w-full accent-green-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-400">Volume</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Up next</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {queue.length ? queue.map((song) => (
              <div key={song._id} className="rounded-3xl border border-slate-800 bg-slate-950 p-3">
                <p className="font-semibold text-white">{song.title}</p>
                <p className="text-slate-400">{song.artist}</p>
              </div>
            )) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3 text-slate-400">No upcoming songs yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}