import TerminalHeader from "@/components/TerminalHeader";

export const metadata = {
  title: "About — 3DZLABS",
  description: "The mission and philosophy behind 3DZ LABS — AI Tools Command Center.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-brand-bg font-mono">
      <TerminalHeader />

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Page label */}
        <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#00cc7a" }}>
          // SYSTEM.ABOUT
        </p>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-bold text-brand-green tracking-widest mb-2">
          3DZ LABS
        </h1>
        <div className="w-16 h-px mb-12" style={{ background: "#00ff88", opacity: 0.45 }} />

        {/* ── MISSION ───────────────────────────────────────────────────── */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00ff88" }}>
              // MISSION
            </span>
            <span className="flex-1 border-t border-brand-border" />
          </div>

          <p className="text-xs tracking-widest mb-5" style={{ color: "rgba(0,255,136,0.4)" }}>
            INITIALIZING MISSION LOG...
          </p>

          <div className="space-y-5 text-sm leading-relaxed text-brand-text">
            <p>
              3DZ LABS was initialized with a single directive: build the command center for the AI age.
              Not just a list of tools — a launchpad. A place to discover, activate, and deploy everything
              the AI revolution has made possible.
            </p>
            <p>
              Built by someone who has always been drawn to design and technology — and who believes AI gives
              anyone the power to bring ideas to life visually. The gap between imagination and execution
              has never been smaller. 3DZ LABS is the map.
            </p>
          </div>
        </div>

        {/* ── PHILOSOPHY ────────────────────────────────────────────────── */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00ff88" }}>
              // PHILOSOPHY
            </span>
            <span className="flex-1 border-t border-brand-border" />
          </div>

          <div className="border border-brand-border bg-brand-surface p-6 mb-8 space-y-3">
            <p className="text-sm font-bold text-brand-green">&gt; CREATE FOR EMOTION</p>
            <p className="text-sm font-bold text-brand-green">&gt; BRING BACK NOSTALGIA</p>
            <p className="text-sm font-bold text-brand-green">
              &gt; BUILD WITH THE POWER OF AN ENTIRE MOVIE TEAM
            </p>
            <p className="text-xs text-brand-text pl-4 pt-1 tracking-widest">
              — SOUND &nbsp;·&nbsp; VISUALS &nbsp;·&nbsp; ANIMATION &nbsp;·&nbsp; STORY
            </p>
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-brand-text">
            <p>
              Sound is everything. Visuals create the world.
              AI makes it all possible for a single operator.
            </p>
            <p>
              The philosophy is simple: ideas deserve to exist. What once required an entire production
              team — cinematography, sound design, animation, narrative — can now be executed by one
              person with the right tools and the right mindset.
            </p>
            <p>
              3DZ LABS exists to surface those tools, reduce the friction, and keep the focus on
              what matters: <span className="text-brand-green">creating things that feel like something.</span>
            </p>
          </div>
        </div>

        {/* EOF */}
        <div className="flex items-center gap-2 text-xs text-brand-text pt-4 border-t border-brand-border">
          <span className="text-brand-green">&gt;</span>
          <span className="tracking-widest">END OF FILE</span>
          <span className="animate-cursor-blink ml-1">_</span>
        </div>

      </div>
    </main>
  );
}
