import { Droplets, Fuel, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { fmtUsd, type CommodityId } from "../lib/model";

const META: Record<CommodityId, { name: string; unit: string; icon: typeof Fuel; color: string }> = {
  oil: { name: "BRENT CRUDE", unit: "bbl", icon: Fuel, color: "#f5b840" },
  electricity: { name: "GLOBAL POWER", unit: "MWh", icon: Zap, color: "#2dd4bf" },
  water: { name: "GLOBAL WATER", unit: "m³", icon: Droplets, color: "#38bdf8" },
};

interface TickerProps {
  prices: Record<CommodityId, number>;
}

export default function Ticker({ prices }: TickerProps) {
  const items = (Object.keys(META) as CommodityId[]).map((id) => {
    const m = META[id];
    const delta = Math.sin(prices[id] * 100) * 0.024;
    const up = delta >= 0;
    return { id, ...m, price: prices[id], delta, up };
  });

  const row = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center" role={keyPrefix === "a" ? "list" : undefined} aria-hidden={keyPrefix !== "a"}>
      {items.map((it) => (
        <div key={`${keyPrefix}-${it.id}`} className="flex items-center gap-3 px-8" role={keyPrefix === "a" ? "listitem" : undefined}>
          <it.icon className="h-4 w-4" style={{ color: it.color }} aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {it.name}
          </span>
          <span className="font-display text-sm font-semibold tabular-nums text-white">
            {fmtUsd(it.price, it.id === "electricity" ? 1 : it.id === "water" ? 2 : 2)}
            <span className="ml-1 text-[11px] font-normal text-slate-500">/{it.unit}</span>
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-semibold tabular-nums ${
              it.up ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {it.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {it.up ? "+" : "−"}
            {Math.abs(it.delta * 100).toFixed(2)}%
          </span>
          <span className="ml-5 h-1 w-1 rounded-full bg-slate-600" aria-hidden="true" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="marquee border-y border-line bg-white/[0.015] py-3.5" aria-label="Live market ticker">
      <div className="marquee-track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
