"use client";

const THEMES = {
  cyan: {
    card: 'from-white to-cyan-50 border-cyan-200',
    icon: 'bg-gradient-to-br from-cyan-400 to-teal-500',
  },
  green: {
    card: 'from-white to-lime-50 border-lime-200',
    icon: 'bg-gradient-to-br from-lime-400 to-green-500',
  },
  purple: {
    card: 'from-white to-purple-50 border-purple-200',
    icon: 'bg-gradient-to-br from-purple-400 to-indigo-500',
  },
  blue: {
    card: 'from-white to-blue-50 border-blue-200',
    icon: 'bg-gradient-to-br from-blue-400 to-sky-500',
  },
  pink: {
    card: 'from-white to-pink-50 border-pink-200',
    icon: 'bg-gradient-to-br from-pink-400 to-rose-500',
  },
} as const;

export type DashboardModuleCardTheme = keyof typeof THEMES;

type DashboardModuleCardProps = {
  icon: string;
  title: string;
  description: string;
  theme: DashboardModuleCardTheme;
  onClick: () => void;
};

/** One clickable summary card on the admin dashboard's module menu. */
export default function DashboardModuleCard({ icon, title, description, theme, onClick }: DashboardModuleCardProps) {
  const palette = THEMES[theme];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 text-left bg-gradient-to-br ${palette.card} p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400`}
    >
      <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl text-white shadow-sm ${palette.icon}`}>
        <span aria-hidden="true">{icon}</span>
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-gray-900 leading-tight">{title}</h3>
        <p className="text-xs text-gray-500 leading-snug truncate">{description}</p>
      </div>
    </button>
  );
}

