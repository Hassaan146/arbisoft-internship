import ContactForm from '../components/ContactForm.jsx';

const points = [
  { ic: '💬', title: 'Sales', body: 'sales@nebula.ai · Mon–Fri, 9–6 ET' },
  { ic: '🛟', title: 'Support', body: '24/7 chat for Growth & Enterprise' },
  { ic: '🏢', title: 'HQ', body: '500 Data Drive, San Francisco, CA' },
];

export default function Contact() {
  return (
    <div className="container section">
      <div className="contact-grid">
        <aside className="contact-aside">
          <span className="eyebrow">Get in touch</span>
          <h2 style={{ marginTop: 16 }}>Let’s put your data to work</h2>
          <p className="muted">
            Tell us where you are today and where you want to go. A product
            specialist will map out the fastest path to insight for your team.
          </p>
          <ul className="contact-points">
            {points.map((p) => (
              <li key={p.title}>
                <span className="ic">{p.ic}</span>
                <span>
                  <strong>{p.title}</strong>
                  <br />
                  <span className="muted">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <ContactForm />
      </div>
    </div>
  );
}
