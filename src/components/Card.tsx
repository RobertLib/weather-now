import { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Entrance delay index for the staggered reveal. */
  delay?: number;
  as?: "div" | "section" | "article";
}

/** Shared frosted-glass surface used by every panel on the page. */
export default function Card({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
  delay = 0,
  as: Tag = "section",
}: CardProps) {
  return (
    <Tag
      className={`glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100 ${className}`}
      style={{ animationDelay: `${delay * 70}ms` }}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="text-slate-500 dark:text-slate-400">{icon}</span>
            )}
            <div>
              {title && (
                <h2 className="font-display text-base font-semibold tracking-tight sm:text-lg">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action}
        </header>
      )}
      {children}
    </Tag>
  );
}
