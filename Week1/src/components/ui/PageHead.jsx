/**
 * Standard page heading used across the glass pages:
 * an eyebrow label, a title, and an optional muted intro paragraph (children).
 */
export default function PageHead({ eyebrow, title, children, ...rest }) {
  return (
    <div className="page-head" {...rest}>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
