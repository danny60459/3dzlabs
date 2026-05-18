"use client";

import { useState, useEffect } from "react";

const LINES = [
  "Initializing 3DZLABS command center...",
  "Loading AI tool registry...",
  "All systems nominal.",
  "Welcome, operator.",
];

export default function TerminalPrompt() {
  const [visibleLines, setVisibleLines] = useState([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < LINES.length) {
        setVisibleLines((prev) => [...prev, LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-6 py-8 max-w-2xl">
      {visibleLines.map((line, idx) => (
        <div key={idx} className="flex gap-2 text-sm mb-1">
          <span className="text-brand-green-dim select-none">&gt;</span>
          <span className={idx < visibleLines.length - 1 ? "text-brand-text" : "text-brand-green"}>
            {line}
          </span>
        </div>
      ))}
      {visibleLines.length === LINES.length && (
        <div className="flex gap-2 text-sm mt-2">
          <span className="text-brand-green-dim select-none">&gt;</span>
          <span className="text-brand-green">
            <span className="animate-cursor-blink">█</span>
          </span>
        </div>
      )}
    </div>
  );
}
