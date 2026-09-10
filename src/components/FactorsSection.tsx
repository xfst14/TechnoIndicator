import {
  ArrowUpDown,
  Clock,
  Cpu,
  Globe2,
  Landmark,
  Layers,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./Reveal";
import {
  factorTrend,
  FACTORS,
  horizonBucket,
  magnitudeLabel,
  relevanceForHorizon,
  START_YEAR,
  type Direction,
  type Factor,
} from "../lib/forecast";

const CATEGORY_ICONS: Record<Factor["category"], LucideIcon> = {
  Supply: Layers,
  Demand: Users,
  Policy: Landmark,
  Macro: Globe2,
  Technology: Cpu,
};

const DIR_META: Record<Direction, { icon: LucideIcon; label: string; cls: string }> = {
  up: {
    icon: TrendingUp,
    label: "Upward price pressure",
    cls: "text-rose-300 bg-rose-400/10 border-rose-400/20",
  },
  down: {
    icon: TrendingDown,
    label: "Downward price pressure",
    cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  },
  both: {
    icon: ArrowUpDown,
    label: "Works both ways",
    cls: "text-slate-300 bg-slate-400/10 border-slate-400/20",
  },
};

const MAG_CLS: Record<string, string> = {
  High: "text-rose-200 bg-rose-400/10 border-rose-400/25",
  Medium: "text-amber-200 bg-amber-400/10 border-amber-400/25",
  Low: "text-slate-300 bg-slate-400/10 border-slate-400/25",
};

const TREND_META = {
  rising: { icon: TrendingUp, label: "Strengthens with horizon", cls: "text-teal-300" },
  fading: { icon: TrendingDown, label: "Fades with horizon", cls: "text-slate-400" },
  stable: { icon: Minus, label: "Steady across horizons", cls: "text-slate-400" },
} as const;

function FactorCard({
  factor,
  horizon,
  index,
}: {
  factor: Factor;
  horizon: number;
  index: number;
}) {
  const rel = relevanceForHorizon(factor, horizon);
  const pct = Math.round(rel * 100);
  const dominant = rel >= 0.75;
  const dimmed = rel < 0.45;
  const CatIcon = CATEGORY_ICONS[factor.category];
  const Dir = DIR_META[factor.direction];
  const DirIcon = Dir.icon;
  const Trend = TREND_META[factorTrend(factor)];
  const TrendIcon = Trend.icon;
  const mag = magnitudeLabel(factor.magnitude);

  return (
    <Reveal delay={(index % 3) * 90} className="h-full">
      <article
        className={`relative flex h-full flex-col rounded-2xl border bg-ink-850/80 p-6 backdrop-blur-sm transition-all duration-500 ${
          dominant
            ? "border-teal-400/40 shadow-[0_0_44px_rgba(45,212,191,0.09)]"
            : "border-line"
        } ${dimmed ? "opacity-55 saturate-50" : ""}`}
      >
        {dominant && (
          <span className="absolute -top-2.5 right-5 rounded-full border border-teal-400/40 bg-ink-900 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-teal-300">
            Dominant now
          </span>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink-800 text-slate-300">
              <CatIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold leading-snug text-white">
                {factor.name}
              </h3>
              <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                {factor.category}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${MAG_CLS[mag]}`}
          >
            {mag}
          </span>
        </div>

        <p className="mt-4 flex-1 text-[13.5px] leading-relaxed text-slate-400">
          {factor.explanation}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${Dir.cls}`}
          >
            <DirIcon className="h-3.5 w-3.5" />
            {Dir.label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium ${Trend.cls}`}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {Trend.label}
          </span>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              Relevance at {horizon}y
            </span>
            <span className="tabular-nums text-slate-300">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                dominant ? "bg-gradient-to-r from-teal-500 to-cyan-300" : "bg-slate-500/70"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-500">Source:</span> {factor.source}
          </p>
        </div>
      </article>
    </Reveal>
  );
}

export function FactorsSection({ horizon }: { horizon: number }) {
  const bucket = horizonBucket(horizon);
  const rising = FACTORS.filter((f) => factorTrend(f) === "rising").length;
  const fading = FACTORS.filter((f) => factorTrend(f) === "fading").length;
  const dominant = FACTORS.filter((f) => relevanceForHorizon(f, horizon) >= 0.75).length;

  return (
    <section
      id="factors"
      className="relative scroll-mt-24 border-t border-line bg-ink-850/40 py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute right-0 top-24 h-[380px] w-[380px] glow-amber" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-300">
                Key Market Drivers
              </p>
              <h2 className="balance mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                What moves energy prices
              </h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Ten research-backed drivers, each with a direction, magnitude and source. The grid
                re-weights itself as you change the forecast horizon —{" "}
                <span className="font-semibold text-slate-200">
                  {rising} structural drivers strengthen, {fading} cyclical ones fade.
                </span>
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-xs font-semibold text-teal-200">
                <Clock className="h-3.5 w-3.5" />
                {horizon}-year horizon ·{" "}
                {bucket === "short" ? "near-term" : bucket === "mid" ? "medium-term" : "long-term"}
              </span>
              <span className="text-[11px] text-slate-500">
                {dominant} dominant driver{dominant === 1 ? "" : "s"} at this horizon
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {FACTORS.map((f, i) => (
            <FactorCard key={f.id} factor={f} horizon={horizon} index={i} />
          ))}
        </div>

        <Reveal delay={150}>
          <p className="mt-10 text-xs leading-relaxed text-slate-600">
            Driver research compiled from EIA, IEA, OPEC, IRENA, IMF, BloombergNEF and
            GlobalPetrolPrices public materials, {START_YEAR}. Magnitude reflects typical price
            impact; relevance reflects how strongly each driver shapes the path at the selected
            horizon.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
