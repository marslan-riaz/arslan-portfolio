"use client";

import { useState } from "react";
import site from "@/data/site.json";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <a href="#top" className="font-display text-lg font-bold text-ink">
          {site.shortName}
          <span className="text-brand">.</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {site.nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-steel transition-colors hover:text-brand">
              {item.label}
            </a>
          ))}
          <a
            href={`mailto:${site.email}`}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Hire me
          </a>
        </nav>

        <button
          className="md:hidden p-2 text-ink"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-white px-6 py-4 md:hidden" aria-label="Mobile">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-steel hover:text-brand"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
