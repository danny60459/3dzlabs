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
