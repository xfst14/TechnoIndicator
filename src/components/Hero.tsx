import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  Zap,
  Droplets,
  SlidersHorizontal,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { COMMODITIES, fmtDate, fmtMoney, MAX_HORIZON, START_YEAR } from "../lib/forecast";

const MARQUEE_ITEMS = [
  "OPEC+ Policy",
  "Geopolitics",
  "Renewables & Storage",
  "China & India Demand",
  "Gas & Coal Costs",
  "Weather Extremes",
  "Recession Risk",
  "Carbon Policy",
  "Transport Electrification",
  "US Dollar Cycle",
];

function useLiveTick(intervalMs = 5000) {
  const [tick, setTick] = useState({ oil: 0, elec: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      setTick({ oil: (Math.random() * 2 - 1) * 0.004, elec: (Math.random() * 2 - 1) * 0.004 });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

function MiniStat({
  icon,
  label,
  value,
  delta,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="min-w-0">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-800/60 px-4 py-3 backdrop-blur-sm transition-colors duration-300 hover:border-line-strong">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-teal-300">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className="flex items-baseline gap-2 font-display text-lg font-semibold text-white">
            <span className="tabular-nums">{value}</span>
            {delta !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${
                  delta >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {`${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(1)}%`}
              </span>
            )}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function TerminalCard() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-teal-500/10 via-transparent to-amber-500/10 blur-2xl" />
      <Reveal delay={250}>
        <div className="float-y relative overflow-hidden rounded-2xl border border-line bg-ink-850/90 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {/* header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-teal-400" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-400" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Forecast Terminal
              </span>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-slate-500">
              {now.toLocaleTimeString("en-US", { hour12: false })} UTC
            </span>
          </div>

          {/* chart */}
          <div className="px-2 pt-4">
            <svg viewBox="0 0 560 300" className="w-full" role="img" aria-label="Illustrative 10-year forecast lines for oil and electricity">
              <defs>
                <linearGradient id="hero-oil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5b840" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#f5b840" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="hero-elec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[60, 120, 180, 240].map((y) => (
                <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="rgba(148,163,184,0.09)" strokeWidth="1" />
              ))}

              <path
                d="M0,218 C50,212 80,226 130,206 S230,178 300,184 S430,140 560,108 L560,300 L0,300 Z"
                fill="url(#hero-oil)"
              />
              <path
                d="M0,168 C60,160 110,150 170,154 S300,118 390,120 S500,82 560,62 L560,300 L0,300 Z"
                fill="url(#hero-elec)"
              />

              <path
                d="M0,218 C50,212 80,226 130,206 S230,178 300,184 S430,140 560,108"
                fill="none"
                stroke="#f5b840"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="draw-line"
              />
              <path
                d="M0,168 C60,160 110,150 170,154 S300,118 390,120 S500,82 560,62"
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="draw-line"
              />

              <circle cx="560" cy="108" r="5" fill="#f5b840" />
              <circle cx="560" cy="62" r="5" fill="#2dd4bf" />

              <text x="4" y="292" fill="#5b6b87" fontSize="11" fontFamily="Inter, sans-serif">
                {START_YEAR}
              </text>
              <text x="528" y="292" fill="#5b6b87" fontSize="11" fontFamily="Inter, sans-serif">
                {START_YEAR + MAX_HORIZON}
              </text>
            </svg>
          </div>

          {/* kpis */}
          <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
            <div className="px-5 py-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <Droplets className="h-3.5 w-3.5 text-oil" /> Brent Crude
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-white tabular-nums">
                {fmtMoney(COMMODITIES[0].basePrice, 1)}
                <span className="ml-1.5 text-xs font-medium text-slate-500">/bbl</span>
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <Zap className="h-3.5 w-3.5 text-elec" /> Global Electricity
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-white tabular-nums">
                {fmtMoney(COMMODITIES[1].basePrice, 0)}
                <span className="ml-1.5 text-xs font-medium text-slate-500">/MWh</span>
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="absolute -right-3 -top-4 rounded-full border border-teal-400/30 bg-ink-900/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-teal-300 shadow-lg backdrop-blur-sm">
        {MAX_HORIZON}-yr horizon
      </div>
    </div>
  );
}

export function Hero() {
  const tick = useLiveTick();
  const oil = COMMODITIES[0];
  const elec = COMMODITIES[1];

  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-y" />
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[480px] w-[480px] glow-teal" />
      <div className="pointer-events-none absolute -right-32 top-40 h-[420px] w-[420px] glow-amber" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* copy */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-ink-800/70 py-1.5 pl-2.5 pr-4 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="ping-ring absolute h-full w-full rounded-full bg-teal-400" />
                  <span className="relative h-2 w-2 rounded-full bg-teal-400" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Live · Global energy markets
                </span>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="balance mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Tecno<span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">Indicator</span>
              </h1>
            </Reveal>

            <Reveal delay={170}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400 sm:text-xl">
                Real-time 10-year forecasts for global{" "}
                <span className="font-semibold text-slate-200">oil</span> &amp;{" "}
                <span className="font-semibold text-slate-200">electricity</span> prices — with
                scenario bands, driver intelligence and exportable data.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-800/60 px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-teal-300" />
                  <span className="tabular-nums">{fmtDate(new Date())}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-800/60 px-3 py-2">
                  <SlidersHorizontal className="h-4 w-4 text-teal-300" />
                  Updated continuously
                </span>
              </div>
            </Reveal>

            <Reveal delay={310}>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    document.getElementById("forecast")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_8px_32px_rgba(45,212,191,0.35)] transition-all duration-300 hover:shadow-[0_8px_44px_rgba(45,212,191,0.55)] hover:brightness-110 active:scale-[0.98]"
                >
                  Start Forecast
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() =>
                    document.getElementById("factors")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex items-center gap-2.5 rounded-xl border border-line-strong bg-ink-800/70 px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-all duration-300 hover:border-teal-400/40 hover:bg-ink-800 hover:text-white active:scale-[0.98]"
                >
                  Explore key drivers
                </button>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <MiniStat
                icon={<Droplets className="h-5 w-5 text-oil" />}
                label="Brent crude"
                value={`${fmtMoney(oil.basePrice * (1 + tick.oil), 1)}`}
                delta={tick.oil}
                delay={380}
              />
              <MiniStat
                icon={<Zap className="h-5 w-5 text-elec" />}
                label="Global electricity"
                value={fmtMoney(elec.basePrice * (1 + tick.elec), 0)}
                delta={tick.elec}
                delay={450}
              />
              <MiniStat
                icon={<SlidersHorizontal className="h-5 w-5" />}
                label="Scenario horizon"
                value={`${MAX_HORIZON} years`}
                delay={520}
              />
            </div>
          </div>

          <TerminalCard />
        </div>
      </div>

      {/* marquee */}
      <div className="marquee relative mt-16 overflow-hidden border-y border-line bg-ink-850/60 py-3.5 sm:mt-20">
        <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {item}
              <span className="h-1 w-1 rounded-full bg-teal-400/60" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
