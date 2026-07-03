import { useEffect, useMemo, useState } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaRandom, FaRedo } from "react-icons/fa";
import { useMusic } from "../context/MusicContext";

function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function DetailedPlayer() {
  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    nextTrack,
    prevTrack,
    audioRef,
    setVolume,
    volume,
    songs,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
  } = useMusic();

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress(audio.currentTime || 0);
    const onMeta = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, [audioRef, currentSong]);

  useEffect(() => {
    if (!currentSong) {
      setProgress(0);
      setDuration(0);
    }
  }, [currentSong]);

  const togglePlay = () => {
    if (!currentSong) return;
    setIsPlaying((p) => !p);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const v = Number(e.target.value);
    audio.currentTime = v;
    setProgress(v);
  };

  const queue = useMemo(() => {
    if (!currentSong || !songs.length) return [];
    const currentIndex = songs.findIndex((s) => s._id === currentSong._id);
    if (currentIndex === -1) return [];
    return songs.slice(currentIndex + 1).concat(songs.slice(0, currentIndex));
  }, [currentSong, songs]);

  if (!currentSong) {
    return (
      <div className="w-full rounded-3xl bg-slate-900 p-6 text-slate-400">No song selected</div>
    );
  }

  return (
    <div className="relative flex h-full flex-col gap-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-xl scale-105 opacity-40"
        style={{ backgroundImage: `url(${currentSong.imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/90" />

      <div className="relative z-10 flex-1">
        <div className="rounded-3xl bg-slate-900/80 p-6 backdrop-blur-sm">
          <img src={currentSong.imageUrl} alt={currentSong.title} className="mb-4 h-48 w-full rounded-xl object-cover shadow-lg" />
          <h2 className="text-2xl font-bold text-white">{currentSong.title}</h2>
          <p className="text-sm text-slate-300">{currentSong.artist} • {currentSong.album || currentSong.genre}</p>

          <div className="mt-6 flex items-center gap-4">
            <button onClick={prevTrack} className="h-12 w-12 rounded-full bg-slate-800 text-slate-200 grid place-items-center hover:bg-slate-700">
              <FaStepBackward />
            </button>

            <button onClick={togglePlay} className="h-16 w-16 rounded-full bg-green-500 text-slate-900 grid place-items-center shadow-[0_6px_18px_rgba(16,185,129,0.25)]">
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <button onClick={nextTrack} className="h-12 w-12 rounded-full bg-slate-800 text-slate-200 grid place-items-center hover:bg-slate-700">
              <FaStepForward />
            </button>

            <div className="ml-4 flex items-center gap-3">
              <button onClick={() => setShuffle((p) => !p)} className={`h-10 w-10 rounded-full grid place-items-center ${shuffle ? 'bg-green-500 text-slate-900' : 'bg-slate-800 text-slate-200'}`}>
                <FaRandom />
              </button>
              <button onClick={() => setRepeat((p) => !p)} className={`h-10 w-10 rounded-full grid place-items-center ${repeat ? 'bg-green-500 text-slate-900' : 'bg-slate-800 text-slate-200'}`}>
                <FaRedo />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="mt-3 h-2 w-full appearance-none rounded-full accent-green-500"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-400">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="mb-3 text-lg font-semibold text-white">Up next</h3>
        <div className="space-y-3">
          {queue.length ? queue.slice(0, 6).map((s) => (
            <div key={s._id} className="rounded-2xl bg-slate-900/80 p-3">
              <p className="font-semibold text-white">{s.title}</p>
              <p className="text-sm text-slate-300">{s.artist}</p>
            </div>
          )) : (
            <div className="rounded-2xl bg-slate-900/80 p-3 text-slate-400">No upcoming songs yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
