/** Five-star rating: fills `count` stars, dims the remainder. */
export default function Stars({ count }) {
  return (
    <div className="stars" aria-label={`${count} out of 5 stars`}>
      {'★'.repeat(count)}
      <span className="stars-empty">{'★'.repeat(5 - count)}</span>
    </div>
  );
}
