// Update this one line whenever a new video drops — no API, just paste the YouTube video ID.
const LATEST_VIDEO_ID = ""; // e.g. "dQw4w9WgXcQ"
const LATEST_VIDEO_TITLE = "Latest Video";

export default function SocialSection() {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00ffa0" }}>
          🔗 Follow 3DZ Labs
        </span>
        <span className="flex-1 border-t border-brand-border" />
      </div>
      <p className="text-xs text-brand-green-dim mb-3">// new drops weekly</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <a
          href="https://youtube.com/@3dzlabs"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow 3DZ Labs on YouTube — full AI cinematics and extended videos"
          className="group flex items-center gap-3 bg-brand-surface border border-brand-border hover:border-brand-green transition-colors duration-200 px-3 py-3 rounded-sm"
        >
          <span className="text-xl leading-none shrink-0" aria-hidden="true">▶️</span>
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-brand-green group-hover:text-white transition-colors truncate">
              YouTube
            </span>
            <span className="text-[11px] text-brand-text leading-snug">
              Full AI cinematics &amp; extended videos
            </span>
          </span>
        </a>

        <a
          href="https://www.tiktok.com/@big3deezy"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow 3DZ Labs on TikTok — daily AI shorts and new creations"
          className="group flex items-center gap-3 bg-brand-surface border border-brand-border hover:border-brand-green transition-colors duration-200 px-3 py-3 rounded-sm"
        >
          <span className="text-xl leading-none shrink-0" aria-hidden="true">🎵</span>
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-brand-green group-hover:text-white transition-colors truncate">
              TikTok
            </span>
            <span className="text-[11px] text-brand-text leading-snug">
              Daily AI shorts &amp; new creations
            </span>
          </span>
        </a>

        {LATEST_VIDEO_ID ? (
          <a
            href={`https://youtube.com/watch?v=${LATEST_VIDEO_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch ${LATEST_VIDEO_TITLE} on the 3DZ Labs YouTube channel`}
            className="group col-span-2 sm:col-span-1 flex items-center gap-3 bg-brand-surface border border-brand-border hover:border-brand-green transition-colors duration-200 px-3 py-2 rounded-sm"
          >
            <img
              src={`https://img.youtube.com/vi/${LATEST_VIDEO_ID}/mqdefault.jpg`}
              alt={`Thumbnail for ${LATEST_VIDEO_TITLE}`}
              width={64}
              height={36}
              loading="lazy"
              className="w-16 h-9 object-cover rounded-sm border border-brand-border shrink-0"
            />
            <span className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-brand-green-dim">Latest Video</span>
              <span className="text-xs text-brand-text group-hover:text-brand-green transition-colors truncate">
                {LATEST_VIDEO_TITLE}
              </span>
            </span>
          </a>
        ) : (
          <a
            href="https://youtube.com/@3dzlabs/videos"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="See the latest videos on the 3DZ Labs YouTube channel"
            className="group col-span-2 sm:col-span-1 flex items-center gap-3 bg-brand-surface border border-brand-border hover:border-brand-green transition-colors duration-200 px-3 py-3 rounded-sm"
          >
            <span className="text-xl leading-none shrink-0" aria-hidden="true">🆕</span>
            <span className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-brand-green-dim">Latest Video</span>
              <span className="text-xs text-brand-text group-hover:text-brand-green transition-colors truncate">
                Coming soon — see all videos
              </span>
            </span>
          </a>
        )}
      </div>
    </section>
  );
}
