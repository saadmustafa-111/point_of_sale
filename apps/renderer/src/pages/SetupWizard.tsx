import { Monitor, ShieldCheck } from 'lucide-react';

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">First Run Setup</h1>
              <p className="text-sm text-slate-500">This app now runs as a single admin system only.</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h2 className="font-semibold text-blue-900">Admin-only mode</h2>
                <p className="text-sm text-blue-800 mt-1">
                  This app runs as a single local admin system with its own database on this computer. Create the first admin account to start using the POS.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue to Admin Setup
          </button>
        </div>
      </div>
    </div>
  );
}
