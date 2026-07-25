import { NavLink, Link } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
];

/** Glass top-navigation shared by the routed pages; highlights the active route. */
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner glass">
        <Link to="/" className="brand">
          <span className="brand-dot" />
          Veldara
        </Link>
        <div className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <Link to="/contact" className="btn btn-primary">
          Get started
        </Link>
      </div>
    </nav>
  );
}
