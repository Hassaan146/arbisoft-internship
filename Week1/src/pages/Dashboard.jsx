const bars = [42, 58, 35, 72, 64, 88, 51, 79, 95, 68, 83, 100];

const kpis = [
  { label: 'Active users', value: '38,204', trend: '+12.4%', up: true },
  { label: 'Revenue (MTD)', value: '$1.92M', trend: '+8.1%', up: true },
  { label: 'Churn rate', value: '1.7%', trend: '-0.3%', up: true },
  { label: 'Avg. session', value: '7m 12s', trend: '-1.2%', up: false },
];

const rows = [
  { source: 'Stripe', events: '482k', health: 'Healthy' },
  { source: 'Segment', events: '1.2M', health: 'Healthy' },
  { source: 'Snowflake', events: '904k', health: 'Syncing' },
  { source: 'HubSpot', events: '57k', health: 'Healthy' },
];

export default function Dashboard() {
  return (
    <div className="container section">
      <div className="page-head">
        <span className="eyebrow">Live workspace</span>
        <h1>Analytics overview</h1>
        <p className="muted">
          A snapshot of everything moving through your pipelines right now.
        </p>
      </div>

      <div className="dash-grid">
        <section className="panel glass">
          <h3>Events processed</h3>
          <p className="sub">Last 12 hours · updates live</p>
          <div className="bars">
            {bars.map((h, i) => (
              <div
                key={i}
                className="bar"
                style={{ height: `${h}%` }}
                title={`${h}k events`}
              />
            ))}
          </div>
        </section>

        <section className="panel glass">
          <h3>Key metrics</h3>
          <p className="sub">Compared to last week</p>
          <div className="kpi-list">
            {kpis.map((k) => (
              <div key={k.label} className="kpi">
                <span className="muted">{k.label}</span>
                <span>
                  <span className="v">{k.value}</span>{' '}
                  <span className={k.up ? 'trend-up' : 'trend-down'}>
                    {k.trend}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel glass span-2">
          <h3>Connected sources</h3>
          <p className="sub">Real-time ingestion status</p>
          <div className="kpi-list">
            {rows.map((r) => (
              <div key={r.source} className="kpi">
                <span className="v">{r.source}</span>
                <span className="muted">{r.events} events</span>
                <span
                  className={r.health === 'Healthy' ? 'trend-up' : 'trend-down'}
                >
                  ● {r.health}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
