import { ArrowRight, CalendarDays, ChevronDown, Droplets, Fuel, Radio, Zap } from "lucide-react";
import Reveal from "./Reveal";
import Ticker from "./Ticker";
import { useFlash } from "../hooks/useFlash";
import { fmtFullDate, fmtUsd, type CommodityId } from "../lib/model";

/* Deterministic decorative sparkline path */
function sparkPath(seed: number, width = 560, height = 180): string {
  let y = height * 0.62;
  let d = `M 0 ${y.toFixed(1)}`;
  let drift = 0;
  for (let i = 1; i <= 48; i++) {
    drift += 0.55;
    const x = (i / 48) * width;
    y += Math.sin(i * 0.85 + seed) * 9 + Math.sin(i * 0.31 + seed * 2.3) * 6 - 1.4;
    y = Math.max(24, Math.min(height - 20, y));
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

interface HeroProps {
  prices: Record<CommodityId, number>;
}

/** Price readout that flashes green/red as the live feed moves. */
function LivePrice({ value, decimals }: { value: number; decimals: number }) {
  const flash = useFlash(value);
  return (
    <p className={`font-display text-lg font-bold tabular-nums text-white ${flash}`}>
      {fmtUsd(value, decimals)}
    </p>
  );
}

const STATS = [
  { value: "3", label: "Commodities" },
  { value: "10", label: "Year horizon" },
  { value: "12", label: "Key drivers" },
  { value: "3", label: "Scenarios each" },
];

export default function Hero({ prices }: HeroProps) {
  const today = new Date();

  const commodityRows: Array<{
    id: CommodityId;
    name: string;
    unit: string;
    icon: typeof Fuel;
    color: string;
    decimals: number;
  }> = [
    { id: "oil", name: "Brent Crude", unit: "USD/bbl", icon: Fuel, color: "#f5b840", decimals: 2 },
    { id: "electricity", name: "Electricity", unit: "USD/MWh", icon: Zap, color: "#2dd4bf", decimals: 1 },
    { id: "water", name: "Water", unit: "USD/m³", icon: Droplets, color: "#38bdf8", decimals: 2 },
  ];

  return (
    <section id="top" className="relative overflow-hidden pt-16">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-y opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 glow-teal blur-3xl opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-160px] top-40 h-[380px] w-[380px] glow-amber blur-3xl opacity-60" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 sm:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          {/* Copy */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2.5 rounded-full border border-teal-400/25 bg-teal-400/[0.07] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200">
                <span className="relative flex h-2 w-2">
                  <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-teal-400" aria-hidden="true" />
                  <span className="pulse-dot relative inline-flex h-2 w-2 rounded-full bg-teal-300" aria-hidden="true" />
                </span>
                Live · Global commodity intelligence
              </span>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Tecno
                <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-300 bg-clip-text text-transparent">
                  Indicator
                </span>
              </h1>
            </Reveal>

            <Reveal delay={170}>
              <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-slate-300/90 sm:text-xl">
                Real-time 10-year forecasts for global{" "}
                <span className="font-semibold text-oil">oil</span>,{" "}
                <span className="font-semibold text-elec">electricity</span> &{" "}
                <span className="font-semibold text-water">water</span> prices — with scenario bands,
                driver analysis and exportable analytics.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-teal-300" aria-hidden="true" />
                  {fmtFullDate(today)}
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:inline-block" aria-hidden="true" />
                <span>All figures in USD</span>
              </div>
            </Reveal>

            <Reveal delay={310}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#forecast"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-teal-400 px-7 py-3.5 font-display text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(45,212,191,0.35)] transition-all duration-300 hover:bg-teal-300 hover:shadow-[0_0_44px_rgba(45,212,191,0.5)]"
                >
                  Start Forecast
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </a>
                <a
                  href="#factors"
                  className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-white/[0.03] px-7 py-3.5 font-display text-sm font-semibold text-slate-200 transition-all duration-300 hover:border-teal-400/40 hover:text-teal-200"
                >
                  Explore Drivers
                </a>
              </div>
            </Reveal>

            <Reveal delay={380}>
              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="font-display text-3xl font-bold tabular-nums text-white">{s.value}</dt>
                    <dd className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Dashboard preview */}
          <Reveal delay={260} className="relative">
            <div className="pointer-events-none absolute -inset-10 glow-water blur-3xl opacity-50" aria-hidden="true" />
            <div className="relative rounded-2xl border border-line bg-panel/85 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="h-4 w-4 text-teal-300" aria-hidden="true" />
                  <span className="font-display text-sm font-semibold text-white">Market snapshot</span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-teal-400/25 bg-teal-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal-300" aria-hidden="true" />
                  Live
                </span>
              </div>

              {/* sparkline */}
              <div className="mt-5 overflow-hidden rounded-xl border border-line bg-base/60 p-4">
                <svg viewBox="0 0 560 180" className="h-44 w-full" role="img" aria-label="Stylized price trajectory preview">
                  <defs>
                    <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[36, 72, 108, 144].map((gy) => (
                    <line key={gy} x1="0" y1={gy} x2="560" y2={gy} stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
                  ))}
                  <path d={`${sparkPath(2.4)} L 560 180 L 0 180 Z`} fill="url(#heroSparkFill)" stroke="none" />
                  <path d={sparkPath(2.4)} fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="draw-line" />
                  <path d={sparkPath(5.9)} fill="none" stroke="#f5b840" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="draw-line" style={{ animationDelay: "0.8s" }} />
                </svg>
                <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  <span>{new Date().getFullYear()}</span>
                  <span>10-year trajectory</span>
                  <span>{new Date().getFullYear() + 10}</span>
                </div>
              </div>

              {/* rows */}
              <div className="mt-5 space-y-3">
                {commodityRows.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-line bg-white/[0.025] px-4 py-3 transition-colors duration-300 hover:border-line-strong"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-lg border"
                        style={{ backgroundColor: `${r.color}14`, borderColor: `${r.color}33`, color: r.color }}
                      >
                        <r.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{r.name}</p>
                        <p className="text-[11px] text-slate-500">{r.unit}</p>
                      </div>
                    </div>
                    <LivePrice value={prices[r.id]} decimals={r.decimals} />
                  </div>
                ))}
              </div>
            </div>

            {/* floating badge */}
            <div className="float-y absolute -right-3 -top-5 rounded-xl border border-line bg-panel-2/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl sm:-right-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Model runs</p>
              <p className="font-display text-sm font-bold text-teal-300">100% in-browser</p>
            </div>
          </Reveal>
        </div>
      </div>

      <Ticker prices={prices} />

      <div className="relative flex justify-center pb-10 pt-8">
        <a href="#forecast" aria-label="Scroll to forecast tool" className="text-slate-500 transition-colors hover:text-teal-300">
          <ChevronDown className="h-6 w-6 animate-bounce" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
