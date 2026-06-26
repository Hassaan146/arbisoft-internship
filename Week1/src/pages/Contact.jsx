import ContactForm from '../components/ContactForm.jsx';
import { contactPoints } from '../data/contactPoints.js';

export default function Contact() {
  return (
    <div className="container section">
      <div className="contact-grid">
        <aside className="contact-aside">
          <span className="eyebrow">Get in touch</span>
          <h2>Let’s build something dimensional</h2>
          <p className="muted">
            Tell us about your project and what you want to bring to life in 3D.
            We&apos;ll get back to you within one business day.
          </p>
          <ul className="contact-points">
            {contactPoints.map((p) => (
              <li key={p.title}>
                <span className="ic">{p.icon}</span>
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
