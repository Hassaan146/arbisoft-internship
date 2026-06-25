import { Outlet, Link } from 'react-router-dom';
import FlowerScene from './FlowerScene.jsx';
import Navbar from './Navbar.jsx';

export default function Layout() {
  return (
    <>
      {/* Shared live 3D flower background — same scene as the landing page */}
      <div className="scene-bg">
        <FlowerScene auto />
      </div>
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
