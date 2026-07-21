import {
  FacebookIcon,
  FacebookShareButton,
  TwitterIcon,
  TwitterShareButton,
} from "react-share";
import { FaInstagram } from "react-icons/fa";

const openInstagramShare = (url, title) => {
  const text = encodeURIComponent(`${title} ${url}`);
  window.open(`https://www.instagram.com/?text=${text}`, "_blank", "noopener,noreferrer");
};

export default function ShareButtons({ url, title }) {
  return (
    <div className="flex flex-wrap gap-3">
      <FacebookShareButton url={url} quote={title} className="rounded-3xl bg-slate-900 px-4 py-3 text-left transition hover:bg-slate-800">
        <div className="flex items-center gap-2">
          <FacebookIcon size={28} round />
          <span className="text-sm font-semibold text-slate-100">Facebook</span>
        </div>
      </FacebookShareButton>
      <TwitterShareButton url={url} title={title} className="rounded-3xl bg-slate-900 px-4 py-3 text-left transition hover:bg-slate-800">
        <div className="flex items-center gap-2">
          <TwitterIcon size={28} round />
          <span className="text-sm font-semibold text-slate-100">Twitter</span>
        </div>
      </TwitterShareButton>
      <button
        type="button"
        onClick={() => openInstagramShare(url, title)}
        className="rounded-3xl bg-slate-900 px-4 py-3 text-left transition hover:bg-slate-800"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white">
            <FaInstagram size={14} />
          </span>
          <span className="text-sm font-semibold text-slate-100">Instagram</span>
        </div>
      </button>
    </div>
  );
}
