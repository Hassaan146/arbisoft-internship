import ContactForm from '../components/ContactForm.jsx';

const points = [
  { ic: '💬', title: 'Sales', body: 'hello@veldara.dev · Mon–Fri, 9–6 ET' },
  { ic: '🛟', title: 'Support', body: '24/7 community + priority support' },
  { ic: '🏢', title: 'HQ', body: '12 Bloom Street, Remote-first' },
];

export default function Contact() {
  return (
    <div className="container section">
      <div className="contact-grid">
        <aside className="contact-aside">
          <span className="eyebrow">Get in touch</span>
          <h2 style={{ marginTop: 16 }}>Let’s build something dimensional</h2>
          <p className="muted">
            Tell us about your project and what you want to bring to life in 3D.
            We&apos;ll get back to you within one business day.
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
