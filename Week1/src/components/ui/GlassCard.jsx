/**
 * Frosted-glass panel — the app's core surface primitive.
 * `as` chooses the element (div by default); className and other props pass through.
 */
export default function GlassCard({
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) {
  return (
    <Tag className={`glass ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
