import { useState } from 'react';
import AuthModal, { type AuthMode } from './components/AuthModal';
import AdminPanel from './pages/AdminPanel';
import LandingPage from './pages/LandingPage';
import NotesPage from './pages/NotesPage';
import { useAuth } from './hooks/useAuth';

// App shell with no router: landing (logged out) ↔ notes / admin (logged in).
// An auth modal bridges logged-out → logged-in.
export default function App() {
  const { user, loading, register, login, resetPassword, logout } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [view, setView] = useState<'notes' | 'admin'>('notes');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/60">
        Loading…
      </div>
    );
  }

  if (user) {
    if (view === 'admin' && user.role === 'admin') {
      return <AdminPanel onBack={() => setView('notes')} onLogout={logout} />;
    }
    return <NotesPage user={user} onLogout={logout} onOpenAdmin={() => setView('admin')} />;
  }

  return (
    <>
      <LandingPage
        onRegister={() => setAuthMode('register')}
        onLogin={() => setAuthMode('login')}
      />
      {authMode && (
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onRegister={register}
          onLogin={login}
          onReset={resetPassword}
          onClose={() => setAuthMode(null)}
        />
      )}
    </>
  );
}
