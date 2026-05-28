"use client";

import { useEffect, useRef } from "react";

const pricingStyle = (pricing) => {
  if (pricing === "free") return "text-brand-green border-brand-green opacity-70";
  if (pricing === "paid") return "text-brand-text border-brand-muted";
  return "text-yellow-400 border-yellow-400"; // "$X/mo" or "free / $X"
};

export default function ToolCard({ tool }) {
  const ref = useRef(null);

  useEffect(() => {
    let tilt = null;
    import("vanilla-tilt").then((mod) => {
      const VanillaTilt = mod.default ?? mod;
      if (!ref.current) return;
      VanillaTilt.init(ref.current, {
        max: 8,
        speed: 500,
        glare: true,
        "max-glare": 0.07,
        perspective: 900,
      });
      tilt = ref.current.vanillaTilt;
    });
    return () => tilt?.destroy();
  }, []);

  return (
    <a
      ref={ref}
      href={tool.referralUrl ?? tool.url}
      target="_blank"
      rel="noopener noreferrer"
      data-tool-card
      className="tool-card group flex flex-col h-full bg-brand-surface border border-brand-border
                 hover:border-brand-green transition-colors duration-200 p-5 rounded-sm
                 relative overflow-hidden"
    >
      {/* Top accent line on hover */}
      <span className="absolute top-0 left-0 w-0 group-hover:w-full h-px bg-brand-green transition-all duration-300" />

      {/* Header row: category + pricing */}
      <div className="flex items-start justify-between mb-3">
        <span className="flex items-center gap-1 text-xs text-brand-text uppercase tracking-widest">
          {tool.category === "Phone Apps" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                 className="w-3 h-3 shrink-0 text-brand-green">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          )}
          {tool.category}
        </span>
        <span className={`text-xs border px-2 py-0.5 rounded-sm shrink-0 ml-2 ${pricingStyle(tool.pricing)}`}>
          {tool.pricing}
        </span>
      </div>

      <h2 className="text-brand-green font-bold text-lg mb-1 group-hover:text-white transition-colors">
        {tool.name}
      </h2>
      <p className="text-brand-text text-sm leading-relaxed mb-4 flex-1">{tool.tagline}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tool.tags.map((tag) => (
          <span key={tag} className="text-xs text-brand-muted border border-brand-border px-2 py-0.5 rounded-sm">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="text-xs text-brand-text group-hover:text-brand-green transition-colors">
          &gt; visit tool &rarr;
        </div>
        {tool.referralUrl && (
          <span className="text-xs border border-brand-border px-1.5 py-0.5 rounded-sm"
                style={{ color: "rgba(0,255,136,0.45)", borderColor: "rgba(0,255,136,0.2)" }}>
            affiliate
          </span>
        )}
      </div>
    </a>
  );
}
