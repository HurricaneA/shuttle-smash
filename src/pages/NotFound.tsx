import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl">🏸</p>
      <h1 className="text-4xl font-extrabold text-brand-navy">Page not found</h1>
      <p className="text-brand-ink/70">That shuttle sailed out of bounds.</p>
      <Link to="/" className="btn-primary mt-2">
        Back to home
      </Link>
    </section>
  );
}
