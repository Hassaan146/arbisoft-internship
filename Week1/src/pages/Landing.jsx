import { Link } from 'react-router-dom';

const metrics = [
  { num: '2.4B+', label: 'Events processed daily' },
  { num: '98.7%', label: 'Forecast accuracy' },
  { num: '120ms', label: 'Median query latency' },
  { num: '40k+', label: 'Teams onboarded' },
];

const features = [
  {
    icon: '⚡',
    title: 'Real-time pipelines',
    body: 'Stream millions of events and watch dashboards update live — no refresh, no waiting.',
  },
  {
    icon: '🧠',
    title: 'AI insight engine',
    body: 'Our models surface anomalies and trends automatically, before they hit your bottom line.',
  },
  {
    icon: '🔗',
    title: '200+ integrations',
    body: 'Connect every warehouse, CRM, and SaaS tool with one click and unify your data.',
  },
  {
    icon: '🛡️',
    title: 'Enterprise security',
    body: 'SOC 2 Type II, end-to-end encryption, and granular role-based access out of the box.',
  },
  {
    icon: '📈',
    title: 'Predictive forecasts',
    body: 'Forecast revenue, churn, and demand with confidence intervals you can actually trust.',
  },
  {
    icon: '✨',
    title: 'Natural-language queries',
    body: 'Ask questions in plain English and get charts, tables, and answers in seconds.',
  },
];

export default function Landing() {
  return (
    <div className="container">
      <section className="hero">
        <span className="eyebrow">✦ AI Data Analytics Platform</span>
        <h1>
          Turn raw data into <span className="gradient-text">decisions</span>
        </h1>
        <p className="muted">
          Nebula unifies every source, applies AI on top, and gives your team
          live dashboards that think for themselves — so you ship insight, not
          spreadsheets.
        </p>
        <div className="hero-actions">
          <Link to="/contact" className="btn btn-primary">
            Start free trial →
          </Link>
          <Link to="/dashboard" className="btn btn-ghost">
            View live demo
          </Link>
        </div>

        <div className="metric-strip">
          {metrics.map((m) => (
            <div key={m.label} className="metric glass">
              <div className="num">{m.num}</div>
              <div className="label">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="page-head">
          <span className="eyebrow">Why Nebula</span>
          <h1>Everything your data team wishes it had</h1>
          <p className="muted">
            One platform from ingestion to insight — built for the speed modern
            teams actually move at.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((f) => (
            <article key={f.title} className="feature glass">
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p className="muted">{f.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
