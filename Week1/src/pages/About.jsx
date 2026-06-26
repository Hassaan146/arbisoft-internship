import { PageHead, FeatureCard, GlassCard } from '../components/ui/index.js';
import { stack, steps } from '../data/about.js';

export default function About() {
  return (
    <div className="container section">
      <PageHead eyebrow="About this build" title="How I made this project">
        Veldara is a live single-page application. The landing page is a
        faithful recreation of the reference design, backed by the exact
        cinematic flower video, and the rest of the app is built around it.
      </PageHead>

      <div className="feature-grid">
        {stack.map((s) => (
          <FeatureCard
            key={s.title}
            icon={s.icon}
            title={s.title}
            body={s.body}
          />
        ))}
      </div>

      <GlassCard className="build-card">
        <h2>The build, step by step</h2>
        <ol className="build-steps">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </GlassCard>
    </div>
  );
}
