const gradientId = "examly-mark-gradient";
const flameId = "examly-flame-gradient";

export function LogoMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="55%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id={flameId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>

      <rect x="1" y="1" width="62" height="62" rx="18" fill={`url(#${gradientId})`} />
      <rect x="1" y="1" width="62" height="62" rx="18" fill="white" fillOpacity="0.04" />

      {/* stars */}
      <path d="M12 16l1.4 3.1 3.1 1.4-3.1 1.4L12 25l-1.4-3.1L7.5 20.5l3.1-1.4z" fill="#fde68a" />
      <circle cx="50" cy="14" r="1.6" fill="#fde68a" />
      <circle cx="48" cy="42" r="1.4" fill="#fef9c3" />

      {/* rocket flame */}
      <path d="M32 46c-2.4 3-3.4 6.2-3.4 9 2.2-1 4.6-1 6.8 0 0-2.8-1-6-3.4-9z" fill={`url(#${flameId})`} />

      {/* rocket body */}
      <g transform="rotate(-8 32 30)">
        <path
          d="M32 9c6.5 4.4 9 10.8 9 18.5 0 5-1.4 9-3 12.2h-12c-1.6-3.2-3-7.2-3-12.2C23 19.8 25.5 13.4 32 9z"
          fill="#ffffff"
        />
        <path d="M25 33.5c-3 1.2-5 3.6-5.6 7.4 2.6-1.4 5-1.6 7.1-.7z" fill="#fb923c" />
        <path d="M39 33.5c3 1.2 5 3.6 5.6 7.4-2.6-1.4-5-1.6-7.1-.7z" fill="#fb923c" />
        <circle cx="32" cy="23" r="4.2" fill="#14b8a6" />
        <circle cx="32" cy="23" r="4.2" fill="#0d9488" fillOpacity="0.25" />
      </g>
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "h-11 w-11",
  tagline,
}: {
  className?: string;
  markClassName?: string;
  tagline?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark className={markClassName} />
      <div className="leading-tight">
        <p className="font-heading text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent">
          Examly
        </p>
        {tagline ? <p className="text-xs font-semibold text-ink-soft">{tagline}</p> : null}
      </div>
    </div>
  );
}
