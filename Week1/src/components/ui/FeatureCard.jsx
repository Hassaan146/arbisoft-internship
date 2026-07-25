import GlassCard from './GlassCard.jsx';

/** Glass card with an icon, title and body — used in the About feature grid. */
export default function FeatureCard({ icon, title, body }) {
  return (
    <GlassCard as="article" className="feature">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p className="muted">{body}</p>
    </GlassCard>
  );
}
