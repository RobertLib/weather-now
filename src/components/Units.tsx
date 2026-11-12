"use client";

import { useUnits } from "@/hooks/useUnits";
import { convertSpeed, convertTemp, speedUnit, tempUnit } from "@/lib/units";

/**
 * Temperatures and speeds inside server-rendered pages. The HTML carries the
 * metric value (what crawlers and first paint see); after hydration the
 * visitor's own unit preference takes over.
 */
export function Temp({ c, unit = false }: { c: number; unit?: boolean }) {
  const [units] = useUnits();
  return (
    <>
      {Math.round(convertTemp(c, units))}°{unit ? tempUnit(units).slice(1) : ""}
    </>
  );
}

export function Speed({ ms }: { ms: number }) {
  const [units] = useUnits();
  return (
    <>
      {Math.round(convertSpeed(ms, units))} {speedUnit(units)}
    </>
  );
}
