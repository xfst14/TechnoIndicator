import {
  ArrowRight,
  FileOutput,
  GitBranch,
  LineChart,
  SlidersHorizontal,
  Waves,
} from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    icon: LineChart,
    title: "Base trend",
    body: "We anchor on today's spot price and compound a historical-growth CAGR — 2.5% for Brent, 4.5% for global electricity.",
  },
  {
    n: "02",
    icon: Waves,
    title: "Volatility cone",
    body: "Uncertainty widens with the square root of time. Bands span roughly ±18% at year one to ±50% by year ten, consistent with realized market volatility.",
  },
  {
    n: "03",
    icon: SlidersHorizontal,
    title: "Driver adjustments",
    body: "Ten research-backed factors bend the average path, each weighted by its relevance over the horizon — structural drivers dominate late, cyclical ones early.",
  },
  {
    n: "04",
    icon: GitBranch,
    title: "Scenario outputs",
    body: "Low, average and high paths for both commodities are recomputed in your browser on every interaction — no server, no waiting.",
  },
];

const SOURCES = [
  "EIA (Short-Term Energy Outlook)",
  "IEA (World Energy Outlook)",
  "OPEC (Monthly Oil Market Report)",
  "IRENA (Renewable costs)",
  "BloombergNEF (EV & storage)",
  "IMF (World Economic Outlook)",
  "GlobalPetrolPrices",
  "NOAA / Copernicus (climate)",
];

const LIMITATIONS = [
  "Illustrative, not predictive — the model smooths shocks and cannot forecast black-swan events.",
  "Spot levels and CAGRs are approximate research figures, not live exchange ticks.",
  "Driver weights are qualitative judgements informed by public sources, not fitted regressions.",
  "Currency, weather and policy shocks can overwhelm the baseline path in any given year.",
];

export function AboutSection() {
  return (
    <section id="about" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] glow-teal" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-300">
            About the model
          </p>
          <h2 className="balance mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            A transparent, lightweight forecasting engine
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Every number on this page is produced by a small, auditable model that runs entirely
            in your browser. No black boxes, no hidden APIs.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90} className="h-full">
              <article className="group h-full rounded-2xl border border-line bg-ink-850/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-teal-400/30 hover:shadow-[0_16px_50px_rgba(45,212,191,0.08)]">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/10 text-teal-300 transition-transform duration-300 group-hover:scale-110">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-3xl font-bold text-ink-600 transition-colors duration-300 group-hover:text-teal-400/40">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400">{s.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Reveal delay={100} className="h-full">
            <div className="h-full rounded-2xl border border-line bg-ink-850/80 p-7">
              <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold text-white">
                <FileOutput className="h-5 w-5 text-teal-300" />
                Data &amp; public sources
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400">
                The engine is calibrated to publicly available market data and outlooks as of{" "}
                {new Date().getFullYear()}. Spot levels (Brent ≈ $98.5/bbl; global electricity ≈
                $174/MWh) and growth rates are approximate research figures, not live exchange
                data.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-line bg-ink-800/70 px-3 py-1.5 text-[11.5px] font-medium text-slate-300 transition-colors duration-200 hover:border-teal-400/30 hover:text-white"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={180} className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-line bg-ink-850/80 p-7">
              <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold text-white">
                <Waves className="h-5 w-5 text-amber-300" />
                Honest limitations
              </h3>
              <ul className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-slate-400">
                {LIMITATIONS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
