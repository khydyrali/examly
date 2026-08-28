import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-3xl border-2 border-violet-100 bg-white/90 shadow-sm backdrop-blur dark:border-violet-900/40 dark:bg-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = "violet",
  className = "",
}: {
  children: ReactNode;
  color?: "violet" | "orange" | "teal" | "yellow" | "rose";
  className?: string;
}) {
  const colors: Record<string, string> = {
    violet: "bg-violet-100 text-violet-700",
    orange: "bg-orange-100 text-orange-700",
    teal: "bg-teal-100 text-teal-700",
    yellow: "bg-yellow-100 text-yellow-800",
    rose: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}
