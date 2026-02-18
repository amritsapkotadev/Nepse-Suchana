import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      <h1 className="text-9xl font-bold text-slate-200">404</h1>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2 -mt-8">
        Page Not Found
      </h2>
      
      <p className="text-slate-600 mb-6 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200:bg-slate-700 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
