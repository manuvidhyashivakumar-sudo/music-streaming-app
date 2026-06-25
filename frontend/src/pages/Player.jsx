import { useMemo, useState } from "react";
import { useMusic } from "../context/MusicContext";
import ShareButtons from "../components/ShareButtons";

export default function Player() {
  const { currentSong, toggleLike, addComment, playSong } = useMusic();
  const [commentText, setCommentText] = useState("");
  const shareUrl = typeof window !== "undefined" ? window.location.href : "http://localhost:5175";
  const comments = useMemo(() => currentSong?.comments || [], [currentSong]);

  if (!currentSong) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
        No song is selected. Play a track from Home or Search.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-green-400">Now playing</p>
            <h1 className="text-3xl font-bold text-white">{currentSong.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{currentSong.artist} • {currentSong.album}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => toggleLike(currentSong._id)} className="rounded-3xl bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400">
              Like ({currentSong.likes})
            </button>
            <button onClick={() => playSong(currentSong)} className="rounded-3xl border border-slate-800 bg-slate-950 px-6 py-3 text-sm text-slate-200 transition hover:bg-slate-800">
              Replay
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
            <img src={currentSong.imageUrl} alt={currentSong.title} className="rounded-3xl object-cover" />
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <h2 className="text-xl font-bold text-white">Download</h2>
              <p className="mt-2 text-sm text-slate-400">Save this track for offline listening.</p>
              <a href={currentSong.audioUrl} download className="mt-4 inline-flex rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Download Song
              </a>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <h2 className="text-xl font-bold text-white">Share</h2>
              <p className="mt-2 text-sm text-slate-400">Share this track with friends on social media.</p>
              <div className="mt-4">
                <ShareButtons url={shareUrl} title={currentSong.title} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-2xl font-bold text-white">Comments</h2>

        <form onSubmit={(event) => {
          event.preventDefault();
          addComment(currentSong._id, commentText);
          setCommentText("");
        }} className="flex flex-col gap-3">
          <textarea rows="4" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment" className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30" />
          <button type="submit" className="w-full rounded-3xl bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400">Post comment</button>
        </form>

        <div className="mt-6 space-y-4">
          {comments.length ? comments.map((comment, index) => (
            <div key={index} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-white">{comment.user}</p>
              <p className="mt-2 text-sm text-slate-300">{comment.text}</p>
            </div>
          )) : (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-400">No comments yet. Be the first to share how this track makes you feel.</div>
          )}
        </div>
      </section>
    </div>
  );
}
