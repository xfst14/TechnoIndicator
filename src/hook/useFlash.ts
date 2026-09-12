import { useEffect, useRef, useState } from "react";

/**
 * Returns a CSS class that briefly flashes red/green whenever `value`
 * changes, so live-feed updates are visually obvious.
 */
export function useFlash(value: number, duration = 750): string {
  const prev = useRef(value);
  const [cls, setCls] = useState("");

  useEffect(() => {
    if (value === prev.current) return;
    const next = value > prev.current ? "flash-up" : "flash-down";
    prev.current = value;
    // Restart the animation even if the direction repeats.
    setCls("");
    const raf = requestAnimationFrame(() => setCls(next));
    const id = window.setTimeout(() => setCls(""), duration);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
  }, [value, duration]);

  return cls;
}
