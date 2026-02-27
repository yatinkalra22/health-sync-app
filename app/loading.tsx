import Image from 'next/image';
import logo from '@/app/assets/images/logo.png';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 animate-pulse">
          <Image src={logo} alt="HealthSync APP" width={48} height={48} className="rounded-xl shadow-lg shadow-blue-500/25" />
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
