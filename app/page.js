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
