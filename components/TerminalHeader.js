"use client";

export default function TerminalHeader() {
  return (
    <header className="border-b border-brand-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Traffic lights */}
        <span className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" />
        <span className="w-3 h-3 rounded-full bg-brand-green opacity-70" />
        <span className="ml-4 text-brand-green text-sm tracking-widest font-bold">
          3DZLABS.COM
        </span>
        <span className="text-brand-text text-xs">— AI Tools Command Center</span>
      </div>
      <nav className="flex gap-6 text-xs text-brand-text">
        <a href="#tools" className="hover:text-brand-green transition-colors">./tools</a>
        <a href="#about" className="hover:text-brand-green transition-colors">./about</a>
        <a href="#submit" className="hover:text-brand-green transition-colors">./submit</a>
      </nav>
    </header>
  );
}
