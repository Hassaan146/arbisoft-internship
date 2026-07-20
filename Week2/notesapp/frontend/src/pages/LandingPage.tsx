import { ArrowRight, NotebookPen } from 'lucide-react';
import BackgroundVideo from '../components/BackgroundVideo';

interface LandingPageProps {
  onRegister: () => void;
  onLogin: () => void;
}

// The cinematic hero: a full-screen looping video behind liquid-glass UI.
// Only real actions remain — create an account or log in (username + PIN).
export default function LandingPage({ onRegister, onLogin }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <BackgroundVideo />

      <div className="relative flex min-h-screen flex-col">
        {/* Navigation */}
        <nav className="relative z-20 pl-6 pr-6 py-6">
          <div className="liquid-glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <NotebookPen size={22} className="text-white" />
              <span className="text-lg font-semibold text-white">Notes</span>
            </div>

            <div className="flex items-center gap-4">
              <button type="button" onClick={onRegister} className="text-sm font-medium text-white">
                Sign Up
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="liquid-glass rounded-full px-6 py-2 text-sm font-medium text-white"
              >
                Login
              </button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <main className="relative z-10 flex flex-1 -translate-y-[10%] flex-col items-center justify-center px-6 py-12 text-center">
          <h1
            className="mb-6 whitespace-nowrap text-5xl tracking-tight text-white md:text-6xl lg:text-7xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Built for the curious
          </h1>

          <p className="mb-8 max-w-md text-base leading-relaxed text-white/70">
            A calm, private place for your thoughts. Create an account with a username and a 4-digit
            PIN, and your notes are yours alone.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRegister}
              className="flex items-center gap-2 rounded-full bg-white px-8 py-3 font-medium text-black transition-opacity hover:opacity-90"
            >
              Get Started
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="liquid-glass rounded-full px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              I already have an account
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
