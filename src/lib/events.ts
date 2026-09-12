/**
 * Tiny global event bus used to decouple the navbar Export
 * actions from the forecast chart / table that owns the data.
 */
export const EVENTS = {
  EXPORT_PNG: "tecnoindicator:export-png",
  EXPORT_CSV: "tecnoindicator:export-csv",
} as const;

export function emit(name: string) {
  window.dispatchEvent(new CustomEvent(name));
}
