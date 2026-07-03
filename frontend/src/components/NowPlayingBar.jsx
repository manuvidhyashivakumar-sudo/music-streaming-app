import { useEffect, useState } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { useMusic } from "../context/MusicContext";

function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function NowPlayingBar() {
  const { currentSong, isPlaying, setIsPlaying, nextTrack, prevTrack, audioRef, setVolume, volume } = useMusic();
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

  const toggle = () => {
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

  if (!currentSong) return null;

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-4">
        <img src={currentSong.imageUrl} alt={currentSong.title} className="h-14 w-14 rounded-md object-cover" />

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{currentSong.title}</p>
              <p className="text-sm text-slate-400">{currentSong.artist}</p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={prevTrack} className="rounded-full bg-slate-950 p-2 text-slate-200 hover:bg-slate-800">
                <FaStepBackward />
              </button>
              <button onClick={toggle} className="rounded-full bg-green-500 p-2 text-slate-900">
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button onClick={nextTrack} className="rounded-full bg-slate-950 p-2 text-slate-200 hover:bg-slate-800">
                <FaStepForward />
              </button>
            </div>
          </div>

          <div className="mt-3">
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
              className="mt-2 w-full accent-green-500"
            />
          </div>
        </div>

        <div className="hidden sm:block w-36">
          <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-400">Volume</label>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
      </div>
    </div>
  );
}
