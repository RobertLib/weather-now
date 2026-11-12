/** Layout-matched placeholder shown while the first forecast loads. */
export default function WeatherSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>

      <Shimmer className="h-56 rounded-3xl sm:h-64" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Shimmer key={i} className="h-40 rounded-2xl" />
        ))}
      </div>

      <Shimmer className="h-44 rounded-3xl" />
      <Shimmer className="h-72 rounded-3xl" />
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`glass relative overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="animate-shimmer absolute inset-0 bg-linear-to-r from-transparent via-white/35 to-transparent dark:via-white/10" />
    </div>
  );
}
