"use client";

import { HourlyPoint } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import { useUnits } from "@/hooks/useUnits";
import TempChart from "./TempChart";

/** TempChart for server-rendered pages: picks up the visitor's units. */
export default function HourlyChart({
  items,
  tz,
  theme,
  step,
}: {
  items: HourlyPoint[];
  tz: string;
  theme: SkyTheme;
  step: number;
}) {
  const [units] = useUnits();
  return <TempChart items={items} tz={tz} units={units} theme={theme} step={step} />;
}
