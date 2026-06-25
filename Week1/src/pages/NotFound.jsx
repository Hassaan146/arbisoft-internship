import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container notfound">
      <div className="glass" style={{ padding: '60px 28px' }}>
        <h1 className="gradient-text">404</h1>
        <p className="muted" style={{ marginBottom: 28 }}>
          This data point drifted off into the nebula.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
