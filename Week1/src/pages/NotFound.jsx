import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/index.js';

export default function NotFound() {
  return (
    <div className="container notfound">
      <GlassCard className="notfound-card">
        <h1 className="gradient-text">404</h1>
        <p className="muted">This page drifted off into the void.</p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </GlassCard>
    </div>
  );
}
