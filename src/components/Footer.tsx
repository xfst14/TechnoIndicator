import { Activity, ShieldAlert } from "lucide-react";
import { fmtDate, START_YEAR } from "../lib/forecast";

const NAV = [
  { id: "forecast", label: "Forecast" },
  { id: "factors", label: "Factors" },
  { id: "about", label: "About" },
];

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
          <p className="text-[12px] text-slate-600">
            Built with a client-side model · trend + volatility cone + driver adjustments
          </p>
        </div>
      </div>
    </footer>
  );
}
