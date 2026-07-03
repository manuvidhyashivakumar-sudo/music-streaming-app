import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useMusic } from "../context/MusicContext";

function fmt(s = 0) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function BottomBarPlayer() {
  const { currentSong, isPlaying, setIsPlaying, nextTrack, prevTrack, audioRef } = useMusic();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime || 0);
    const onMeta = () => setDuration(a.duration || 0);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
    };
  }, [audioRef, currentSong]);

  if (!currentSong) return null;

  return (
    <div className="h-20 rounded-xl bg-slate-900/90 p-3 shadow-lg backdrop-blur-sm flex items-center gap-4">
      <img src={currentSong.imageUrl} alt={currentSong.title} className="h-14 w-14 rounded-md object-cover" />

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-white">{currentSong.title}</div>
            <div className="text-xs text-slate-300">{currentSong.artist}</div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={prevTrack} className="p-2 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700">
              <FaStepBackward />
            </button>
            <button onClick={() => setIsPlaying((p) => !p)} className="p-3 rounded-full bg-green-500 text-slate-900">
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={nextTrack} className="p-2 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700">
              <FaStepForward />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-slate-300">{fmt(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={(e) => {
              const a = audioRef.current;
              if (!a) return;
              a.currentTime = Number(e.target.value);
              setProgress(Number(e.target.value));
            }}
            className="accent-green-500 h-1 w-full"
          />
          <span className="text-xs text-slate-300">{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
