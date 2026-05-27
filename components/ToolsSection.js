"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ToolCard from "@/components/ToolCard";
import { tools, categories } from "@/lib/tools";

gsap.registerPlugin(ScrollTrigger);

const FUSE_OPTS = {
  keys: [
    { name: "name",     weight: 3 },
    { name: "category", weight: 2 },
    { name: "tagline",  weight: 1 },
    { name: "tags",     weight: 1 },
    { name: "pricing",  weight: 0.5 },
  ],
  threshold: 0.35,
};

const featuredTools = tools.filter((t) => t.featured);

export default function ToolsSection() {
  const [query, setQuery]               = useState("");
  const [activeCategory, setCategory]   = useState(null);
  const gridRef                         = useRef(null);

  // ── Filtered results ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const base = activeCategory
      ? tools.filter((t) => t.category === activeCategory)
      : tools;
    if (!query.trim()) return base;
    return new Fuse(base, FUSE_OPTS).search(query).map((r) => r.item);
  }, [query, activeCategory]);

  // ── Per-card ScrollTrigger (fires once each as card enters viewport) ────
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = Array.from(gridRef.current.querySelectorAll(".tool-card"));
    if (!cards.length) return;

    const triggers = cards.map((card) => {
      gsap.set(card, { opacity: 0, y: 36 });
      return ScrollTrigger.create({
        trigger: card,
        start: "top 92%",
        once: true,
        onEnter: () =>
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.48,
            ease: "power2.out",
            onComplete: () => gsap.set(card, { clearProps: "transform" }),
          }),
      });
    });

    return () => triggers.forEach((t) => t.kill());
  }, [filtered]); // rebuild triggers whenever visible set changes

  const toggleCategory = (cat) =>
    setCategory((prev) => (prev === cat ? null : cat));

  return (
    <section id="tools" className="pb-16">

      {/* ── SEARCH:// bar ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-3 border border-brand-border bg-brand-surface px-4 py-3
                        max-w-md focus-within:border-brand-green transition-colors duration-200">
          <span className="text-brand-green-dim text-sm select-none shrink-0">SEARCH://</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter tools..."
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-brand-green text-sm outline-none
                       placeholder:text-brand-text placeholder:opacity-40 caret-brand-green"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-brand-text hover:text-brand-green text-xs transition-colors shrink-0"
            >
              [clear]
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-brand-text h-4">
          {(query || activeCategory) && (
            <>
              <span className="text-brand-green">&gt;</span>{" "}
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {query && <> for &quot;{query}&quot;</>}
              {activeCategory && <> in <span className="text-brand-green">{activeCategory}</span></>}
            </>
          )}
        </p>
      </div>

      {/* ── Category pills ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setCategory(null)}
          className={`shrink-0 text-xs px-3 py-1.5 border rounded-sm transition-colors duration-150
            ${activeCategory === null
              ? "border-brand-green text-brand-green bg-brand-green/10"
              : "border-brand-border text-brand-text hover:border-brand-green hover:text-brand-green"
            }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 border rounded-sm transition-colors duration-150
              ${activeCategory === cat
                ? "border-brand-green text-brand-green bg-brand-green/10"
                : "border-brand-border text-brand-text hover:border-brand-green hover:text-brand-green"
              }`}
          >
            {cat === "Phone Apps" && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className="w-3 h-3 shrink-0">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            )}
            {cat}
          </button>
        ))}
      </div>

      {/* ── Featured Tools ───────────────────────────────────────────────── */}
      {!query.trim() && !activeCategory && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00ff88" }}>
              ⭐ Featured Tools
            </span>
            <span className="flex-1 border-t border-brand-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-sm"
                style={{ boxShadow: "0 0 16px 2px #00ff88, 0 0 32px 4px #00ff4455" }}
              >
                <ToolCard tool={tool} />
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-brand-border" />
        </div>
      )}

      {/* ── Learning Hub promo ───────────────────────────────────────────── */}
      {!query.trim() && !activeCategory && (
        <div
          className="mb-10 px-8 py-8 flex flex-col sm:flex-row sm:items-center gap-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #001a0d 0%, #0a0a0a 60%)",
            border: "1px solid #00ff88",
            boxShadow: "0 0 20px 3px #00ff88, 0 0 40px 6px #00ff4455",
          }}
        >
          {/* Subtle scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,136,0.025) 2px,rgba(0,255,136,0.025) 4px)",
            }}
          />

          <div className="relative flex-1 min-w-0">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#00ff88" }}>// ai.learning</p>
            <h2 className="text-2xl font-bold mb-3 text-brand-green">🎓 AI Learning Hub</h2>
            {/* Decorative divider */}
            <div className="w-12 h-px mb-3" style={{ background: "#00ff88", opacity: 0.5 }} />
            <p className="text-sm leading-relaxed" style={{ color: "rgba(200,220,210,0.85)" }}>
              Curated courses &amp; certifications to level up your AI skills in 2026 — from beginner to advanced.
            </p>
          </div>

          <a
            href="/learning"
            className="relative shrink-0 text-xs px-6 py-3 tracking-widest font-bold transition-colors duration-200 hover:bg-brand-green hover:text-black"
            style={{ border: "1px solid #00ff88", color: "#00ff88", background: "transparent" }}
          >
            &gt; explore courses &rarr;
          </a>
        </div>
      )}

      {/* ── Section header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-brand-text tracking-widest uppercase">./tools</span>
        <span className="text-brand-green-dim text-xs">[{filtered.length} loaded]</span>
        <span className="flex-1 border-t border-brand-border" />
      </div>

      {/* ── Tool grid ────────────────────────────────────────────────────── */}
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-brand-text text-sm">
            <span className="text-brand-green">&gt;</span> no tools match{" "}
            {query && <>&quot;{query}&quot;</>}
            {activeCategory && <> in {activeCategory}</>}
            <span className="animate-cursor-blink ml-1">_</span>
          </div>
        )}
      </div>
    </section>
  );
}
