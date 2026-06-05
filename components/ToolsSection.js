"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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

const affiliateTools = tools.filter((t) => t.referralUrl);

const getDailyFeatured = (affiliateTools) => {
  const today = new Date();
  const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const totalTools = affiliateTools.length;
  const featured = [];
  for (let i = 0; i < 6; i++) {
    featured.push(affiliateTools[(dayIndex + i) % totalTools]);
  }
  return featured;
};

const featuredTools = getDailyFeatured(affiliateTools);

const PRICING_OPTIONS = ["Free", "Free Limited", "Paid", "Pay Per Use"];

export default function ToolsSection() {
  const [query, setQuery]           = useState("");
  const [activeCategory, setCategory] = useState(null);
  const [activePricing, setPricing] = useState(null);
  const [scanning, setScanning]     = useState(false);
  const [aiMode, setAiMode]         = useState(false);
  const [aiIds, setAiIds]           = useState(null);
  const gridRef                     = useRef(null);
  const debounceRef                 = useRef(null);

  // ── Filtered results ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (aiIds) {
      return aiIds.map((id) => tools.find((t) => t.id === id)).filter(Boolean);
    }
    const base = activeCategory === "Affiliates"
      ? tools.filter((t) => t.referralUrl)
      : activeCategory
      ? tools.filter((t) => t.category === activeCategory)
      : tools;
    const priced = activePricing
      ? base.filter((t) => t.pricing?.toLowerCase() === activePricing.toLowerCase())
      : base;
    if (!query.trim()) return priced;
    return new Fuse(priced, FUSE_OPTS).search(query).map((r) => r.item);
  }, [query, activeCategory, activePricing, aiIds]);

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
  }, [filtered]);

  const toggleCategory = (cat) =>
    setCategory((prev) => (prev === cat ? null : cat));

  const togglePricing = (p) =>
    setPricing((prev) => (prev === p ? null : p));

  // ── AI search ───────────────────────────────────────────────────────────
  const triggerAiSearch = useCallback(async (q) => {
    if (q.trim().length < 3) return;
    setScanning(true);
    setAiMode(false);
    setAiIds(null);
    try {
      const payload = tools.map((t) => ({
        id: t.id,
        name: t.name,
        tagline: t.tagline,
        category: t.category,
        tags: t.tags,
        hasReferral: !!t.referralUrl,
      }));
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, tools: payload }),
      });
      const ids = await res.json();
      if (Array.isArray(ids) && ids.length > 0) {
        setAiIds(ids);
        setAiMode(true);
      }
    } catch {
      // silent fallback — Fuse results already showing via useMemo
    } finally {
      setScanning(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setAiMode(false);
    setAiIds(null);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 3) {
      debounceRef.current = setTimeout(() => triggerAiSearch(val), 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim().length >= 3) {
      clearTimeout(debounceRef.current);
      triggerAiSearch(query);
    }
  };

  const handleClear = () => {
    clearTimeout(debounceRef.current);
    setQuery("");
    setAiMode(false);
    setAiIds(null);
    setScanning(false);
  };

  return (
    <section id="tools" className="pb-16">

      {/* ── Search + Price filter box ────────────────────────────────────── */}
      <div
        className="mb-5 p-4"
        style={{ background: "rgba(0, 255, 136, 0.05)", border: "1px solid rgba(0, 255, 136, 0.2)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* SEARCH:// input */}
          <div className="flex items-center gap-3 border border-brand-border bg-brand-surface px-4 py-3
                          flex-1 focus-within:border-brand-green transition-colors duration-200">
            <span className="text-brand-green-dim text-sm select-none shrink-0 flex items-center gap-1.5">
              SEARCH://
              <span className="text-xs border border-brand-green/40 text-brand-green px-1 leading-4 rounded-sm">
                ⚡ AI
              </span>
            </span>
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="what are you trying to build?"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent text-brand-green text-sm outline-none
                         placeholder:text-brand-text placeholder:opacity-40 caret-brand-green"
            />
            {query && (
              <button
                onClick={handleClear}
                className="text-brand-text hover:text-brand-green text-xs transition-colors shrink-0"
              >
                [clear]
              </button>
            )}
          </div>
          {/* PRICE:// pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-brand-green-dim text-xs select-none shrink-0">PRICE://</span>
            <button
              onClick={() => setPricing(null)}
              className={`shrink-0 text-xs px-3 py-1.5 border rounded-sm transition-colors duration-150
                ${activePricing === null
                  ? "border-brand-green text-brand-green bg-brand-green/10"
                  : "border-brand-border text-brand-text hover:border-brand-green hover:text-brand-green"
                }`}
            >
              All
            </button>
            {PRICING_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => togglePricing(p)}
                className={`shrink-0 text-xs px-3 py-1.5 border rounded-sm transition-colors duration-150
                  ${activePricing === p
                    ? "border-brand-green text-brand-green bg-brand-green/10"
                    : "border-brand-border text-brand-text hover:border-brand-green hover:text-brand-green"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-brand-text h-4">
          {scanning ? (
            <span className="text-brand-green-dim">// SCANNING...</span>
          ) : (query || activeCategory || activePricing) ? (
            <>
              <span className="text-brand-green">&gt;</span>{" "}
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {query && <> for &quot;{query}&quot;</>}
              {activeCategory && <> in <span className="text-brand-green">{activeCategory}</span></>}
              {activePricing && <> · <span className="text-brand-green">{activePricing}</span></>}
            </>
          ) : null}
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
        <button
          onClick={() => toggleCategory("Affiliates")}
          className={`shrink-0 text-xs px-3 py-1.5 border rounded-sm transition-colors duration-150
            ${activeCategory === "Affiliates"
              ? "border-brand-green text-brand-green bg-brand-green/10"
              : "border-brand-border text-brand-text hover:border-brand-green hover:text-brand-green"
            }`}
        >
          ★ Affiliates
        </button>
      </div>

      {/* ── Featured Tools ───────────────────────────────────────────────── */}
      {!query.trim() && !activeCategory && !activePricing && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00ff88" }}>
              ⭐ Featured Tools
            </span>
            <span className="flex-1 border-t border-brand-border" />
          </div>
          <p className="text-xs text-brand-green-dim mb-6">// ROTATES DAILY</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTools.map((tool) => (
              <div
                key={tool.id}
                className="h-full rounded-sm"
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
      {!query.trim() && !activeCategory && !activePricing && (
        <div
          className="mb-10 px-8 py-8 flex flex-col sm:flex-row sm:items-center gap-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #001a0d 0%, #0a0a0a 60%)",
            border: "1px solid #00ff88",
            boxShadow: "0 0 20px 3px #00ff88, 0 0 40px 6px #00ff4455",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,136,0.025) 2px,rgba(0,255,136,0.025) 4px)",
            }}
          />
          <div className="relative flex-1 min-w-0">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#00ff88" }}>// ai.learning</p>
            <h2 className="text-2xl font-bold mb-3 text-brand-green">🎓 AI Learning Hub</h2>
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
        {scanning ? (
          <span className="text-xs text-brand-green-dim tracking-widest animate-pulse">// SCANNING...</span>
        ) : aiMode ? (
          <>
            <span className="text-xs text-brand-green tracking-widest font-bold">// AI RECOMMENDED</span>
            <span className="text-brand-green-dim text-xs">[{filtered.length} found]</span>
          </>
        ) : (
          <>
            <span className="text-xs text-brand-text tracking-widest uppercase">// TOOLS</span>
            <span className="text-brand-green-dim text-xs">[{filtered.length} loaded]</span>
          </>
        )}
        <span className="flex-1 border-t border-brand-border" />
      </div>

      {/* ── Tool grid ────────────────────────────────────────────────────── */}
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <div key={tool.id} className="relative">
            {aiMode && tool.referralUrl && (
              <span className="absolute top-2 right-2 z-10 text-xs text-brand-green bg-brand-surface
                               border border-brand-green/40 px-1.5 py-0.5 rounded-sm select-none pointer-events-none">
                ⚡
              </span>
            )}
            <ToolCard tool={tool} />
          </div>
        ))}

        {filtered.length === 0 && !scanning && (
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
