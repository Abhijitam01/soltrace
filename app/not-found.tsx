import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-6xl font-bold text-slate-700 mb-4">404</p>
      <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
      <p className="text-slate-400 text-sm mb-8">
        The signature or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-[#9945FF] hover:bg-[#8035ee] text-white text-sm font-medium rounded-lg transition-colors"
      >
        Decode a transaction
      </Link>
    </div>
  );
}
