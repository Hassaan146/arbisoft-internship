import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, LogIn, LogOut, Users } from 'lucide-react';
import BackgroundVideo from '../components/BackgroundVideo';
import { api } from '../services/api';
import type { AdminStats } from '../types';

interface AdminPanelProps {
  onBack: () => void;
  onLogout: () => void;
}

// Admin-only dashboard. Shows aggregate counts pulled from /admin/stats —
// never any note contents (the API doesn't expose them here).
export default function AdminPanel({ onBack, onLogout }: AdminPanelProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .adminStats()
      .then((s) => active && setStats(s))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load'));
    return () => {
      active = false;
    };
  }, []);

  const cards = stats
    ? [
        { label: 'Total users', value: stats.total_users, Icon: Users },
        { label: 'Users logged in', value: stats.users_logged_in, Icon: LogIn },
        { label: 'Total logins', value: stats.total_logins, Icon: LogIn },
        { label: 'Total notes', value: stats.total_notes, Icon: FileText },
      ]
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <BackgroundVideo />
      <div className="absolute inset-0 bg-black/75" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-8">
        <header className="liquid-glass mb-8 flex items-center justify-between rounded-full px-6 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft size={18} /> Back to notes
          </button>
          <span className="text-lg font-semibold text-white">Admin</span>
          <button
            type="button"
            onClick={onLogout}
            className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        <h1
          className="mb-6 text-4xl text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Overview
        </h1>

        {error ? (
          <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </p>
        ) : !stats ? (
          <p className="text-white/60">Loading stats…</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {cards.map(({ label, value, Icon }) => (
              <div key={label} className="liquid-glass rounded-3xl p-6">
                <div className="mb-3 flex items-center gap-2 text-white/60">
                  <Icon size={18} />
                  <span className="text-sm">{label}</span>
                </div>
                <div className="text-4xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-white/40">
          Counts only — the admin panel never shows the contents of any note.
        </p>
      </div>
    </div>
  );
}
