/**
 * Identity of a saved place: its coordinates to ~1 km. Shared by the client
 * components that save places and the server-rendered city pages that
 * highlight the current one, so it can't live in a "use client" module.
 */
export function favoriteId(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}
