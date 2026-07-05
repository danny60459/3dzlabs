"use client";

export default function TerminalHeader() {
  return (
    <header className="border-b border-brand-border px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        {/* Traffic lights */}
        <span className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" />
        <span className="w-3 h-3 rounded-full bg-brand-green opacity-70" />
        <span className="ml-4 text-brand-green text-sm tracking-widest font-bold">
          3DZLABS.COM
        </span>
        <span className="hidden sm:inline text-brand-text text-xs">— AI Tools Command Center</span>
      </div>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-brand-text">
        <a href="/" className="hover:text-brand-green transition-colors">./tools</a>
        <a href="/learning" className="hover:text-brand-green transition-colors">./learning</a>
        <a href="/about" className="hover:text-brand-green transition-colors">./about</a>
        <a href="#submit" className="hover:text-brand-green transition-colors">./submit</a>
        <span className="w-px h-3 bg-brand-border" aria-hidden="true" />
        <a
          href="https://youtube.com/@3dzlabs"
          target="_blank"
          rel="noopener noreferrer"
          title="3DZ Labs on YouTube"
          className="hover:text-brand-green transition-colors"
        >
          ▶️<span className="sr-only">YouTube</span>
        </a>
        <a
          href="https://www.tiktok.com/@big3deezy"
          target="_blank"
          rel="noopener noreferrer"
          title="3DZ Labs on TikTok"
          className="hover:text-brand-green transition-colors"
        >
          🎵<span className="sr-only">TikTok</span>
        </a>
      </nav>
    </header>
  );
}
