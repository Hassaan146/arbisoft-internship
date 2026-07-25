import { Outlet, Link } from 'react-router-dom';
import VideoBackground from '../VideoBackground.jsx';
import Navbar from './Navbar.jsx';

/**
 * Shared shell for the routed pages: the persistent flower-video background,
 * a dark scrim, the navbar, a footer, and an <Outlet/> for the active page.
 */
export default function Layout() {
  return (
    <>
      {/* Shared cinematic background — the same flower clip as the landing */}
      <VideoBackground />
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
                Veldara
              </Link>
              <p className="muted">
                © {new Date().getFullYear()} Veldara — Craft immersive 3D worlds
                on the web.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
