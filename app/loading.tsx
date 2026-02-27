import { Heart } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-blue-500/25">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-3 w-64">
          <div className="h-2 shimmer rounded-full" />
          <div className="h-2 shimmer rounded-full w-3/4 mx-auto" />
        </div>
        <p className="text-xs text-slate-400 mt-4">Loading HealthSync APP...</p>
      </div>
    </div>
  );
}
