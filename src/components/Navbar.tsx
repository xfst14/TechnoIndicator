import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileImage, FileText, Menu, X } from "lucide-react";
import Logo from "./Logo";
import { GithubIcon } from "./icons";
import { EVENTS, emit } from "../lib/events";

const LINKS = [
  { href: "#forecast", label: "Forecast" },
  { href: "#factors", label: "Factors" },
  { href: "#about", label: "About" },
];

const REPO_URL = "https://github.com/xfst14/TecnoIndicator";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExportOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const doExport = (kind: "png" | "csv") => {
    emit(kind === "png" ? EVENTS.EXPORT_PNG : EVENTS.EXPORT_CSV);
    setExportOpen(false);
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-line bg-base/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-teal-200"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              aria-expanded={exportOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-teal-400/40 hover:text-white"
            >
              <Download className="h-4 w-4 text-teal-300" aria-hidden="true" />
              Export
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${
                  exportOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            <div
              className={`absolute right-0 top-full mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-line bg-panel-2/95 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200 ${
                exportOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-1 scale-95 opacity-0"
              }`}
              role="menu"
              aria-label="Export options"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => doExport("png")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-teal-400/10 hover:text-teal-200"
              >
                <FileImage className="h-4 w-4 text-oil" aria-hidden="true" />
                Chart as PNG
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => doExport("csv")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-teal-400/10 hover:text-teal-200"
              >
                <FileText className="h-4 w-4 text-water" aria-hidden="true" />
                Data as CSV
              </button>
            </div>
          </div>

          {/* GitHub */}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="View source code on GitHub"
            title="View source on GitHub"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-slate-300 transition-all duration-200 hover:border-teal-400/40 hover:text-white hover:shadow-[0_0_20px_rgba(45,212,191,0.18)]"
          >
            <GithubIcon className="h-[18px] w-[18px]" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-slate-200 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel */}
      <div
        className={`overflow-hidden border-b border-line bg-base/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Mobile primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-teal-200"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => doExport("png")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200"
            >
              <FileImage className="h-4 w-4 text-oil" /> PNG
            </button>
            <button
              type="button"
              onClick={() => doExport("csv")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200"
            >
              <FileText className="h-4 w-4 text-water" /> CSV
            </button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="View source code on GitHub"
              className="flex h-10 w-11 items-center justify-center rounded-lg border border-line text-slate-200"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
