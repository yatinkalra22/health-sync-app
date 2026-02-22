import Link from 'next/link';
import { Search, Home } from 'lucide-react';

export default function PANotFound() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">PA Request Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          This prior authorization request does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
