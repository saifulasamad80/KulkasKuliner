"use client";

const THEMES = {
  cyan: {
    card: 'from-white via-white to-cyan-50 border-cyan-200/80',
    icon: 'bg-gradient-to-br from-cyan-400 to-teal-500',
    eyebrow: 'text-cyan-700 bg-cyan-100',
    glow: 'bg-cyan-300/30',
    arrow: 'text-cyan-700 group-hover:bg-cyan-600',
  },
  green: {
    card: 'from-white via-white to-lime-50 border-lime-200/80',
    icon: 'bg-gradient-to-br from-lime-400 to-green-500',
    eyebrow: 'text-green-700 bg-green-100',
    glow: 'bg-lime-300/30',
    arrow: 'text-green-700 group-hover:bg-green-600',
  },
  purple: {
    card: 'from-white via-white to-purple-50 border-purple-200/80',
    icon: 'bg-gradient-to-br from-purple-400 to-indigo-500',
    eyebrow: 'text-purple-700 bg-purple-100',
    glow: 'bg-purple-300/30',
    arrow: 'text-purple-700 group-hover:bg-purple-600',
  },
  blue: {
    card: 'from-white via-white to-blue-50 border-blue-200/80',
    icon: 'bg-gradient-to-br from-blue-400 to-sky-500',
    eyebrow: 'text-blue-700 bg-blue-100',
    glow: 'bg-blue-300/30',
    arrow: 'text-blue-700 group-hover:bg-blue-600',
  },
  pink: {
    card: 'from-white via-white to-pink-50 border-pink-200/80',
    icon: 'bg-gradient-to-br from-pink-400 to-rose-500',
    eyebrow: 'text-pink-700 bg-pink-100',
    glow: 'bg-pink-300/30',
    arrow: 'text-pink-700 group-hover:bg-pink-600',
  },
} as const;

export type DashboardModuleCardTheme = keyof typeof THEMES;

type DashboardModuleCardProps = {
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  theme: DashboardModuleCardTheme;
  onClick: () => void;
};

/** One clickable summary card on the admin dashboard's module menu. */
export default function DashboardModuleCard({ icon, eyebrow, title, description, theme, onClick }: DashboardModuleCardProps) {
  const palette = THEMES[theme];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative isolate min-h-44 overflow-hidden rounded-3xl border bg-gradient-to-br p-5 text-left shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-22px_rgba(15,23,42,0.5)] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${palette.card}`}
    >
      <div aria-hidden="true" className={`absolute -right-10 -top-10 -z-10 h-36 w-36 rounded-full blur-2xl transition-transform duration-300 group-hover:scale-125 ${palette.glow}`} />

      <div className="flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl text-white shadow-lg ${palette.icon}`}>
            <span aria-hidden="true">{icon}</span>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${palette.eyebrow}`}>
            {eyebrow}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-black leading-tight tracking-tight text-slate-950">{title}</h3>
            <p className="mt-1.5 text-sm leading-5 text-slate-500">{description}</p>
          </div>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg font-black shadow-sm transition-all group-hover:text-white ${palette.arrow}`} aria-hidden="true">
            →
          </span>
        </div>
      </div>
    </button>
  );
}

