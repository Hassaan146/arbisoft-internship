import { Outlet, Link } from 'react-router-dom';
import Scene3D from './Scene3D.jsx';
import Navbar from './Navbar.jsx';

export default function Layout() {
  return (
    <>
      {/* Shared live 3D background — persists across every route */}
      <Scene3D />
      <div className="scene-overlay" />

      <div className="app-shell">
        <Navbar />
        <main>
          <Outlet />
        </main>
        <footer className="footer">
          <div className="container">
            <div className="footer-inner glass">
              <Link to="/" className="brand">
                <span className="brand-dot" />
                Nebula
              </Link>
              <p className="muted">
                © {new Date().getFullYear()} Nebula Analytics — Insight at the
                speed of thought.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
