import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-5xl font-bold text-slate-200 mb-2">404</h2>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h3>
        <p className="text-sm text-slate-500 mb-6">
          The page you are looking for does not exist or the PA request was not found.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            New PA Request
          </Link>
        </div>
      </div>
    </div>
  );
}
