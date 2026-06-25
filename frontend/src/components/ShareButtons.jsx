import {
  FacebookIcon,
  FacebookShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";

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
      <WhatsappShareButton url={url} title={title} className="rounded-3xl bg-slate-900 px-4 py-3 text-left transition hover:bg-slate-800">
        <div className="flex items-center gap-2">
          <WhatsappIcon size={28} round />
          <span className="text-sm font-semibold text-slate-100">WhatsApp</span>
        </div>
      </WhatsappShareButton>
    </div>
  );
}
