import TerminalHeader from "@/components/TerminalHeader";
import TerminalPrompt from "@/components/TerminalPrompt";
import ParticleNetwork from "@/components/ParticleNetwork";
import ToolsSection from "@/components/ToolsSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <TerminalHeader />

      <main className="flex-1 px-6 py-4 max-w-7xl mx-auto w-full">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-brand-border mb-10 min-h-[320px]">
          {/* Particle canvas sits behind everything */}
          <ParticleNetwork />

          {/* Hero content above canvas */}
          <div className="relative z-10 py-16">
            <TerminalPrompt />

            <p className="text-xs text-brand-text tracking-widest mb-2 uppercase">
              // system.ai.tools
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-brand-green leading-tight mb-4">
              3DZLABS
            </h1>
            <p className="text-brand-text max-w-lg text-sm leading-relaxed">
              A curated command center for AI-powered tools. Discover, launch, and
              integrate the stack that builds what&apos;s next.
            </p>
          </div>
        </section>

        {/* ── Game Showcase ────────────────────────────────────────────────── */}
        <section className="mb-10">
          {/* Keyframes for blink + button glow — can't be expressed in Tailwind alone */}
          <style>{`
            @keyframes d-blink{0%,49.9%{opacity:1}50%,100%{opacity:0}}
            @keyframes d-glow{0%,100%{box-shadow:0 0 10px rgba(0,255,160,.32),0 0 24px rgba(0,255,160,.12);opacity:1}50%{box-shadow:0 0 22px rgba(0,255,160,.72),0 0 48px rgba(0,255,160,.28);opacity:.82}}
            .d-blink{animation:d-blink 1s step-end infinite}
            .d-btn{animation:d-glow 1.8s ease-in-out infinite;display:block}
            .d-btn:hover{animation:none!important;background-color:#00ffa0!important;color:#000!important;box-shadow:0 0 28px rgba(0,255,160,.8)!important}
          `}</style>

          <div
            className="relative border border-brand-green overflow-hidden"
            style={{
              background: "rgba(3,8,6,0.85)",
              boxShadow: "0 0 32px rgba(0,255,160,0.07), inset 0 0 64px rgba(0,0,0,0.55)"
            }}
          >
            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,160,0.02) 2px,rgba(0,255,160,0.02) 4px)",
                zIndex: 0
              }}
            />

            {/* Corner brackets */}
            {[["top-0 left-0","border-t-2 border-l-2"],["top-0 right-0","border-t-2 border-r-2"],["bottom-0 left-0","border-b-2 border-l-2"],["bottom-0 right-0","border-b-2 border-r-2"]].map(([pos, border]) => (
              <div key={pos} className={`absolute ${pos} w-5 h-5 ${border} border-brand-green pointer-events-none`} style={{zIndex:2}} />
            ))}

            <div className="relative flex flex-col sm:flex-row items-center gap-8 px-8 py-8" style={{zIndex:1}}>

              {/* ── Info ─────────────────────────────────────────────────── */}
              <div className="flex-1 min-w-0">

                {/* Badge row */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xs font-mono text-brand-text tracking-[0.2em] border border-brand-border px-2 py-0.5 uppercase">
                    arcade
                  </span>
                  <span className="flex items-center gap-2 text-xs font-mono tracking-widest">
                    <span className="d-blink w-2 h-2 rounded-full bg-brand-green inline-block flex-shrink-0" />
                    <span className="text-brand-green">STATUS: ONLINE</span>
                  </span>
                </div>

                {/* Presents line */}
                <p
                  className="text-xs font-mono tracking-[0.28em] uppercase mb-1"
                  style={{ color: "#00cc7a", textShadow: "0 0 10px rgba(0,255,160,0.45)" }}
                >
                  3DZLABS PRESENTS
                </p>

                {/* Title */}
                <h2
                  className="text-5xl sm:text-6xl font-bold font-mono leading-none mb-4"
                  style={{
                    color: "#ff0050",
                    textShadow: "0 0 16px rgba(255,0,80,0.7), 0 0 40px rgba(255,0,80,0.3)"
                  }}
                >
                  DAEMON
                </h2>

                {/* Description */}
                <p className="text-sm font-mono text-brand-text leading-relaxed mb-2">
                  A terminal dungeon crawler &mdash; collect loot before the DAEMON arrives.
                </p>
                <p className="text-xs font-mono text-brand-text tracking-widest" style={{opacity:0.45}}>
                  3 SECTORS &nbsp;&middot;&nbsp; 9 ROOMS &nbsp;&middot;&nbsp; WEB AUDIO &nbsp;&middot;&nbsp; WASD / ARROW KEYS
                </p>
              </div>

              {/* ── CTA ──────────────────────────────────────────────────── */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <a
                  href="/game"
                  className="d-btn px-10 py-4 border-2 border-brand-green font-bold font-mono text-xl tracking-widest text-brand-green text-center select-none"
                >
                  ▶&nbsp; PLAY NOW
                </a>
                <span
                  className="text-xs font-mono tracking-widest"
                  style={{ color: "rgba(0,255,160,0.35)" }}
                >
                  INSERT COIN TO CONTINUE
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* ── Tools + Search ─────────────────────────────────────────────────── */}
        <ToolsSection />

      </main>

      <footer className="border-t border-brand-border px-6 py-4 text-xs text-brand-text flex justify-between">
        <span>3DZLABS.COM — AI Tools Hub</span>
        <span className="text-brand-green">v0.1.0</span>
      </footer>
    </div>
  );
}
