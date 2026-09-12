import { useMemo } from "react";
import {
  ArrowRightLeft,
  Building2,
  CloudSun,
  Cpu,
  Database,
  Droplets,
  Fuel,
  Globe2,
  Leaf,
  Scale,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import Reveal from "./Reveal";
import {
  FACTORS,
  factorRelevance,
  relevanceTrend,
  type CommodityId,
  type Factor,
  type Magnitude,
} from "../lib/model";

const CATEGORY_ICONS: Record<string, typeof Globe2> = {
  Geopolitics: Globe2,
  Policy: Scale,
  Demand: TrendingUp,
  Transition: Leaf,
  Climate: CloudSun,
  Resource: Waves,
  Technology: Cpu,
  Market: Database,
  Investment: Building2,
};

const MAGNITUDE_STYLE: Record<Magnitude, string> = {
  High: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  Medium: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  Low: "border-sky-400/30 bg-sky-400/10 text-sky-300",
};

const COMMODITY_META: Record<CommodityId, { label: string; color: string; icon: typeof Fuel }> = {
  oil: { label: "Oil", color: "#f5b840", icon: Fuel },
  electricity: { label: "Power", color: "#2dd4bf", icon: Zap },
  water: { label: "Water", color: "#38bdf8", icon: Droplets },
};

function FactorCard({
  factor,
  horizon,
  isKey,
  index,
}: {
  factor: Factor;
  horizon: number;
  isKey: boolean;
  index: number;
}) {
  const Icon = CATEGORY_ICONS[factor.category] ?? Globe2;
  const rel = factorRelevance(factor.bias, horizon);
  const maxRel = factorRelevance("short", 1); // ~1.6 upper bound
  const pct = Math.min(100, Math.round((rel / maxRel) * 100 + 18));
  const trend = relevanceTrend(factor.bias, horizon);

  const DirIcon =
    factor.direction === "up" ? TrendingUp : factor.direction === "down" ? TrendingDown : ArrowRightLeft;
  const dirColor =
    factor.direction === "up"
      ? "text-rose-400"
      : factor.direction === "down"
        ? "text-emerald-400"
        : "text-amber-300";
  const dirLabel =
    factor.direction === "up"
      ? "Upward pressure"
      : factor.direction === "down"
        ? "Downward pressure"
        : "Mixed / context-dependent";

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-panel p-6 transition-all duration-300 hover:-translate-y-1 ${
        isKey
          ? "border-teal-400/35 shadow-[0_0_36px_rgba(45,212,191,0.09)] hover:shadow-[0_0_44px_rgba(45,212,191,0.14)]"
          : "border-line hover:border-line-strong"
      }`}
    >
      {isKey && (
        <span className="absolute -top-2.5 left-5 rounded-full border border-teal-400/40 bg-base px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-300">
          Key driver
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-slate-300">
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${MAGNITUDE_STYLE[factor.magnitude]}`}
        >
          {factor.magnitude}
        </span>
      </div>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {factor.category}
      </p>
      <h3 className="mt-1.5 font-display text-base font-semibold leading-snug text-white">
        {factor.name}
      </h3>
      <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{factor.explanation}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold ${dirColor}`}>
          <DirIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {dirLabel}
        </span>
        {factor.commodities.map((id) => {
          const m = COMMODITY_META[id];
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ color: m.color, backgroundColor: `${m.color}12` }}
            >
              <m.icon className="h-3 w-3" aria-hidden="true" />
              {m.label}
            </span>
          );
        })}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Relevance @ {horizon}y
          </span>
          <span
            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
              trend === "rising"
                ? "text-teal-300"
                : trend === "fading"
                  ? "text-slate-500"
                  : "text-slate-400"
            }`}
          >
            {trend === "rising" && <TrendingUp className="h-3 w-3" aria-hidden="true" />}
            {trend === "fading" && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
            {trend === "rising" ? "Rising with horizon" : trend === "fading" ? "Fades with horizon" : "Steady influence"}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5" role="presentation">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background:
                trend === "rising"
                  ? "linear-gradient(90deg, rgba(45,212,191,0.35), #2dd4bf)"
                  : "linear-gradient(90deg, rgba(148,163,184,0.3), #94a3b8)",
            }}
          />
        </div>
        <p className="mt-3 text-[11px] italic leading-relaxed text-slate-600">Source: {factor.source}</p>
      </div>
      <span className="sr-only">Factor number {index + 1}</span>
    </article>
  );
}

export default function FactorsSection({ horizon }: { horizon: number }) {
  const ranked = useMemo(
    () =>
      FACTORS.map((f) => ({ f, rel: factorRelevance(f.bias, horizon) })).sort(
        (a, b) => b.rel - a.rel,
      ),
    [horizon],
  );

  return (
    <section id="factors" className="relative scroll-mt-24 border-t border-line/60 py-20 sm:py-28">
      <div
        className="pointer-events-none absolute right-[-200px] top-40 h-[420px] w-[420px] glow-amber blur-3xl opacity-40"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-300">
            Market intelligence
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Key price drivers
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/[0.07] px-4 py-2 text-xs font-semibold text-teal-200">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal-300" aria-hidden="true" />
              Relevance ranked for a {horizon}-year horizon
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
            The structural and cyclical forces behind every forecast. The grid re-sorts and re-lights
            as you change the forecast horizon — longer horizons elevate slow-moving structural factors
            like scarcity, regulation and the energy transition, while short horizons are dominated by
            OPEC+ policy, inventories and weather.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ranked.map(({ f }, i) => (
            <Reveal key={f.id} delay={Math.min(i, 6) * 70}>
              <FactorCard factor={f} horizon={horizon} isKey={i < 3} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
