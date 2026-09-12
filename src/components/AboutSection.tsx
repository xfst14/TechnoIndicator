import { AlertTriangle, BarChart3, FunctionSquare, ShieldAlert, Workflow } from "lucide-react";
import Reveal from "./Reveal";

const SOURCES = [
  "EIA Short-Term Energy Outlook",
  "IEA World Energy Outlook",
  "OPEC Market Reports",
  "GlobalPetrolPrices",
  "IRENA",
  "UN-Water",
  "FAO AQUASTAT",
  "World Bank",
];

const METHODS = [
  {
    icon: BarChart3,
    color: "#f5b840",
    title: "Base trend",
    text: "Each series starts from a realistic market price — Brent around $105/bbl, global power near $166/MWh, and global water near $2.50/m³ — then compounds at a structural CAGR of 3.8–5.0% depending on the commodity.",
  },
  {
    icon: Workflow,
    color: "#2dd4bf",
    title: "Volatility bands",
    text: "Low and high scenarios widen with the square root of time, reflecting how forecast uncertainty genuinely grows. At a 10-year horizon the bands span roughly ±22–34% around the average path.",
  },
  {
    icon: FunctionSquare,
    color: "#38bdf8",
    title: "Factor adjustments",
    text: "Twelve researched drivers — from OPEC+ policy to water scarcity — each contribute a small drift that ramps up over the horizon, so the model stays explainable rather than being a black box.",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="relative scroll-mt-24 border-t border-line/60 py-20 sm:py-28">
      <div
        className="pointer-events-none absolute left-[-200px] bottom-10 h-[420px] w-[420px] glow-water blur-3xl opacity-35"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-300">
            Transparency
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            About the model
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
            TecnoIndicator is a demonstration of modern front-end data visualization: every number is
            computed in your browser from publicly known drivers, with no backend and no API keys.
            The goal is an honest, explorable illustration of how forecasters think about uncertainty
            — not a crystal ball.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {METHODS.map((m, i) => (
            <Reveal key={m.title} delay={i * 90}>
              <article className="group h-full rounded-2xl border border-line bg-panel p-7 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: `${m.color}12`,
                    borderColor: `${m.color}33`,
                    color: m.color,
                  }}
                >
                  <m.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{m.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{m.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-10 rounded-2xl border border-line bg-panel p-7 sm:p-8">
            <h3 className="font-display text-base font-semibold text-white">
              Public data & reasoning sources
            </h3>
            <p className="mt-1.5 text-xs text-slate-500">
              Base prices, growth rates and driver narratives are grounded in publicly available
              research.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2.5" aria-label="Data sources">
              {SOURCES.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-line bg-white/[0.025] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-teal-400/30 hover:text-teal-200"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-8 flex items-start gap-3.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] px-5 py-4 sm:px-6">
            <ShieldAlert className="mt-0.5 h-[18px] w-[18px] shrink-0 text-amber-400" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-amber-200/80">
              <span className="font-semibold text-amber-200">Important.</span> These are illustrative
              forecasts based on historical trends and publicly known drivers. Not financial advice.
              The live water quote is a simulated client-side feed within a realistic global price
              band — always verify against licensed data providers before making decisions.
            </p>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-12 flex items-center gap-3 rounded-2xl border border-line bg-gradient-to-r from-teal-400/[0.06] to-transparent px-6 py-5">
            <AlertTriangle className="hidden h-5 w-5 text-teal-300 sm:block" aria-hidden="true" />
            <p className="text-sm text-slate-400">
              Want to run your own scenarios? Press{" "}
              <kbd className="rounded-md border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-teal-200">
                /
              </kbd>{" "}
              to jump to the horizon slider and watch the cards, chart and factor grid respond in real
              time.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
