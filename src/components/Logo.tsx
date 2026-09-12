import { Activity } from "lucide-react";

interface LogoProps {
  onClick?: () => void;
}

export default function Logo({ onClick }: LogoProps) {
  return (
    <a
      href="#top"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl"
      aria-label="TecnoIndicator — back to top"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/30 bg-panel shadow-[0_0_20px_rgba(45,212,191,0.15)] transition-all duration-300 group-hover:border-teal-400/60 group-hover:shadow-[0_0_28px_rgba(45,212,191,0.3)]">
        <Activity className="h-[18px] w-[18px] text-teal-300" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        Tecno<span className="text-teal-300">Indicator</span>
      </span>
    </a>
  );
}
