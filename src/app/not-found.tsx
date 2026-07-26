import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-xl font-bold text-heading">Page not found</h1>
      <p className="max-w-sm text-base text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-white transition hover:bg-primary-hover"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
