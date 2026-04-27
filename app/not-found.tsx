import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-7xl font-bold text-light-sand mb-4 select-none">404</p>
      <h1 className="text-xl font-semibold text-warm-black mb-2">Page not found</h1>
      <p className="text-warm-gray text-sm mb-8">
        The signature or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
      >
        Decode a transaction
      </Link>
    </div>
  );
}
