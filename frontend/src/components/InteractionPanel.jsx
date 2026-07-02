import { useState } from "react";
import { FaHeart, FaCommentDots } from "react-icons/fa";

export default function InteractionPanel({ item, onLike, onComment, label = "track" }) {
  const [commentText, setCommentText] = useState("");

  const submitComment = (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    onComment?.(commentText.trim());
    setCommentText("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onLike}
          className="inline-flex items-center gap-2 rounded-3xl bg-green-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400"
        >
          <FaHeart /> Like ({item?.likes ?? 0})
        </button>
        <span className="inline-flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-300">
          <FaCommentDots /> {item?.comments?.length ?? 0} comments
        </span>
      </div>

      <form onSubmit={submitComment} className="space-y-3">
        <textarea
          rows="3"
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder={`Write a comment about this ${label}`}
          className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-4 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
        />
        <button
          type="submit"
          className="rounded-3xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Post comment
        </button>
      </form>

      <div className="space-y-3">
        {(item?.comments || []).length ? (
          item.comments.map((comment, index) => (
            <div key={`${comment.user}-${index}`} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-white">{comment.user}</p>
              <p className="mt-1 text-sm text-slate-300">{comment.text}</p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-6 text-sm text-slate-400">
            No comments yet. Start the conversation.
          </div>
        )}
      </div>
    </div>
  );
}
