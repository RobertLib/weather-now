/**
 * Clothing tier from typical temperatures, shared by the live insights (in
 * the browser) and the climate pages (on the server). Kept apart from
 * `lib/climate.ts`, whose dataset must never end up in the client bundle.
 */
export type WearTier = "arctic" | "winter" | "jacket" | "layers" | "light" | "hot";

export function wearTier(feels: number): WearTier {
  if (feels <= -5) return "arctic";
  if (feels <= 4) return "winter";
  if (feels <= 12) return "jacket";
  if (feels <= 19) return "layers";
  if (feels <= 27) return "light";
  return "hot";
}
