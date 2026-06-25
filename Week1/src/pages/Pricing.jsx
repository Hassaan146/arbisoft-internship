import { Link } from 'react-router-dom';

const plans = [
  {
    tier: 'Starter',
    price: '$0',
    period: '/mo',
    features: [
      '1 workspace',
      'Up to 5 sources',
      '7-day data retention',
      'Community support',
    ],
    cta: 'Start free',
    featured: false,
  },
  {
    tier: 'Growth',
    price: '$79',
    period: '/mo',
    features: [
      'Unlimited workspaces',
      '50 sources',
      '1-year retention',
      'AI insight engine',
      'Priority support',
    ],
    cta: 'Start 14-day trial',
    featured: true,
  },
  {
    tier: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Unlimited everything',
      'SSO & SCIM',
      'Dedicated success manager',
      'On-prem / VPC deploy',
      '99.99% uptime SLA',
    ],
    cta: 'Talk to sales',
    featured: false,
  },
];

export default function Pricing() {
  return (
    <div className="container section">
      <div
        className="page-head"
        style={{ marginInline: 'auto', textAlign: 'center' }}
      >
        <span className="eyebrow">Pricing</span>
        <h1>Simple plans that scale with you</h1>
        <p className="muted">
          Start free, upgrade when your data does. No hidden fees, cancel
          anytime.
        </p>
      </div>

      <div className="price-grid">
        {plans.map((p) => (
          <div
            key={p.tier}
            className={`price-card glass ${p.featured ? 'featured' : ''}`}
          >
            {p.featured && <span className="badge">Most popular</span>}
            <span className="tier">{p.tier}</span>
            <div className="price">
              {p.price}
              <span>{p.period}</span>
            </div>
            <ul className="price-features">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link
              to="/contact"
              className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
