import { Activity, ShieldAlert } from "lucide-react";
import { fmtDate, START_YEAR } from "../lib/forecast";

const NAV = [
  { id: "forecast", label: "Forecast" },
  { id: "factors", label: "Factors" },
  { id: "about", label: "About" },
];

const GITHUB_URL = "https://github.com/xfst14/TechnoIndicator";

function GitHubIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.303-5.467-1.333-5.467-5.93 0-1.31.468-2.382 1.236-3.222-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.653.243 2.873.12 3.176.77.84 1.235 1.912 1.235 3.222 0 4.61-2.807 5.624-5.48 5.92.43.372.814 1.103.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.63 0 12 0z" />
    </svg>
  );
}

export function Footer({ onExport }: { onExport: () => void }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="border-t border-line bg-ink-950/60">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5"
              aria-label="Back to top"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/10 text-teal-300">
                <Activity className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-white">
                Tecno<span className="text-teal-300">Indicator</span>
              </span>
            </button>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              Real-time 10-year forecasts for global oil &amp; electricity prices — with scenario
              bands, driver intelligence and exportable data.
            </p>
            <p className="mt-5 inline-flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-100/70">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              Illustrative forecasts based on historical trends and publicly known drivers. Not
              financial advice.
            </p>
          </div>

          <nav aria-label="Footer — product">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => go(l.id)}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-teal-300"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={onExport}
                  className="text-sm text-slate-400 transition-colors duration-200 hover:text-teal-300"
                >
                  Export data
                </button>
              </li>
            </ul>
          </nav>

          <nav aria-label="Footer — model">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Model
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => go("about")}
                  className="transition-colors duration-200 hover:text-teal-300"
                >
                  Methodology
                </button>
              </li>
              <li>
                <button
                  onClick={() => go("factors")}
                  className="transition-colors duration-200 hover:text-teal-300"
                >
                  Drivers &amp; sources
                </button>
              </li>
              <li>
                <button
                  onClick={() => go("forecast")}
                  className="transition-colors duration-200 hover:text-teal-300"
                >
                  Assumptions
                </button>
              </li>
              <li className="pt-1">
                <p className="text-[12px] text-slate-600">
                  Last updated: <span className="text-slate-400">{fmtDate(new Date())}</span>
                </p>
                <p className="mt-1 text-[12px] text-slate-600">
                  Engine uses publicly available drivers and historical price data.
                </p>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-[12px] text-slate-600">
            © {START_YEAR} TecnoIndicator. All forecasts are illustrative.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-[12px] text-slate-600">
              Built with a client-side model · trend + volatility cone + driver adjustments
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-800/60 px-3 py-1.5 text-[12px] font-medium text-slate-300 transition-all duration-200 hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-teal-200"
              aria-label="View TechnoIndicator on GitHub"
            >
              <GitHubIcon className="h-4 w-4" />
              <span className="hidden sm:inline">github.com/xfst14/TechnoIndicator</span>
              <span className="sm:hidden">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
