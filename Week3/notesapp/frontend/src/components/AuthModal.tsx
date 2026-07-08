import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { PIN_LENGTH, PIN_REGEX, USERNAME_MIN_LENGTH } from '../constants';
import type { Credentials } from '../types';

export type AuthMode = 'register' | 'login' | 'reset';

interface AuthModalProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onRegister: (creds: Credentials) => Promise<void>;
  onLogin: (creds: Credentials) => Promise<void>;
  onReset: (creds: Credentials) => Promise<void>;
  onClose: () => void;
}

const COPY: Record<AuthMode, { title: string; hint: string; submit: string }> = {
  register: {
    title: 'Create your account',
    hint: 'Pick a unique username and a 4-digit PIN.',
    submit: 'Create account',
  },
  login: { title: 'Welcome back', hint: 'Enter your username and PIN.', submit: 'Log in' },
  reset: {
    title: 'Reset your PIN',
    hint: 'Enter your username and choose a new 4-digit PIN, then log in again.',
    submit: 'Set new PIN',
  },
};

// Glassmorphic auth card. Handles registering, logging in, and resetting the
// PIN (username + a new 4-digit PIN). Client checks are UX only; the server
// re-validates and is the source of truth.
export default function AuthModal({
  mode,
  onModeChange,
  onRegister,
  onLogin,
  onReset,
  onClose,
}: AuthModalProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isReset = mode === 'reset';
  const copy = COPY[mode];

  function switchMode(next: AuthMode) {
    setError(null);
    setNotice(null);
    setPin('');
    setConfirmPin('');
    onModeChange(next);
  }

  const onlyDigits = (value: string) => value.replace(/\D/g, '').slice(0, PIN_LENGTH);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (username.trim().length < USERNAME_MIN_LENGTH) {
      setError(`Username must be at least ${USERNAME_MIN_LENGTH} characters.`);
      return;
    }
    if (!PIN_REGEX.test(pin)) {
      setError(`PIN must be exactly ${PIN_LENGTH} digits.`);
      return;
    }
    if (isReset && pin !== confirmPin) {
      setError('The two PINs do not match.');
      return;
    }

    setError(null);
    setBusy(true);
    // The UI concept is a "PIN"; the API credential field is `password`. We map
    // the PIN onto that field here, at the single API boundary.
    const creds: Credentials = { username: username.trim(), password: pin };
    try {
      if (mode === 'register') {
        await onRegister(creds);
      } else if (mode === 'login') {
        await onLogin(creds);
      } else {
        await onReset(creds);
        setPin('');
        setConfirmPin('');
        onModeChange('login');
        setNotice('PIN updated. Please log in with your new PIN.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* Dim backdrop; clicking it closes the modal. */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="liquid-glass relative z-10 w-full max-w-sm rounded-3xl p-8">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 text-white/60 transition-colors hover:text-white"
        >
          <X size={20} />
        </button>

        <h2
          className="mb-1 text-3xl text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {copy.title}
        </h2>
        <p className="mb-6 text-sm text-white/60">{copy.hint}</p>

        {notice && (
          <p className="mb-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            {notice}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-username" className="mb-1 block text-xs text-white/60">
              Username
            </label>
            <input
              id="auth-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="e.g. hassaan"
              className="liquid-glass w-full rounded-full px-5 py-3 text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-pin" className="mb-1 block text-xs text-white/60">
              {isReset ? 'New 4-digit PIN' : '4-digit PIN'}
            </label>
            <input
              id="auth-pin"
              value={pin}
              onChange={(e) => setPin(onlyDigits(e.target.value))}
              inputMode="numeric"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••"
              className="liquid-glass w-full rounded-full px-5 py-3 tracking-[0.5em] text-white placeholder:tracking-normal placeholder:text-white/40 focus:outline-none"
            />
          </div>

          {isReset && (
            <div>
              <label htmlFor="auth-confirm" className="mb-1 block text-xs text-white/60">
                Confirm new PIN
              </label>
              <input
                id="auth-confirm"
                value={confirmPin}
                onChange={(e) => setConfirmPin(onlyDigits(e.target.value))}
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="••••"
                className="liquid-glass w-full rounded-full px-5 py-3 tracking-[0.5em] text-white placeholder:tracking-normal placeholder:text-white/40 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : copy.submit}
            {!busy && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Mode switches */}
        <div className="mt-6 space-y-2 text-center text-sm text-white/60">
          {mode === 'login' && (
            <>
              <p>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-white underline underline-offset-2"
                >
                  Create one
                </button>
              </p>
              <p>
                Forgot your PIN?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-white underline underline-offset-2"
                >
                  Reset it
                </button>
              </p>
            </>
          )}
          {mode === 'register' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-white underline underline-offset-2"
              >
                Log in
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p>
              Remembered it?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-white underline underline-offset-2"
              >
                Back to log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
