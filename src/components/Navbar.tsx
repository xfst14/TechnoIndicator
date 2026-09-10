import { useEffect, useState } from "react";
import { Activity, Download, Menu, X } from "lucide-react";

const LINKS = [
  { id: "forecast", label: "Forecast" },
  { id: "factors", label: "Factors" },
  { id: "about", label: "About" },
];

export function Navbar({ onExport }: { onExport: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-line bg-ink-900/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group flex items-center gap-2.5"
          aria-label="TecnoIndicator — back to top"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/10 text-teal-300 shadow-[0_0_24px_rgba(45,212,191,0.25)] transition-transform duration-300 group-hover:scale-105">
            <Activity className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            Tecno<span className="text-teal-300">Indicator</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={onExport}
            className="ml-2 inline-flex items-center gap-2 rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[0_0_20px_rgba(45,212,191,0.35)] transition-all duration-200 hover:bg-teal-300 hover:shadow-[0_0_28px_rgba(45,212,191,0.5)]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-slate-300 transition-colors hover:bg-white/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel */}
      <div
        className={`overflow-hidden border-b border-line bg-ink-900/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 md:hidden ${
          open ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Mobile">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              onExport();
            }}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-400 px-4 py-3 text-sm font-semibold text-ink-950"
          >
            <Download className="h-4 w-4" />
            Export data
          </button>
        </nav>
      </div>
    </header>
  );
}
