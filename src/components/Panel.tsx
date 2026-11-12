import { ReactNode } from "react";

/** A titled glass panel used for the forecast sections. */
export default function Panel({
  title,
  subtitle,
  icon,
  children,
  as: Heading = "h2",
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <section className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
      <header className="mb-3.5 flex items-center gap-2.5">
        {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
        <div>
          <Heading className="font-display text-base font-semibold tracking-tight sm:text-lg">
            {title}
          </Heading>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
