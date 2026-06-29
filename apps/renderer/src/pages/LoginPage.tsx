import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authService, settingsService } from '../services';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: settingsService.getPublicBranding,
    retry: false,
    staleTime: 60_000,
  });
  const posName = branding?.posName || 'Home Appliances POS';
  const shopName = branding?.shopName || 'Home Appliances Shop';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      setAuth(data.user, data.accessToken);
      toast.success(`Welcome, ${data.user.fullName}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden bg-slate-900 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-950/30">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-normal">{posName}</h1>
              <p className="mt-2 text-sm text-slate-300">{shopName}</p>
              <p className="mt-8 max-w-sm text-sm leading-6 text-slate-300">
                Fast local billing, inventory control, receipts, and reporting in one lightweight admin workspace.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Fast access</p>
                <p className="mt-1 text-sm text-slate-200">Open the admin workspace quickly and manage products, billing, receipts, and reporting in one place.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Admin secure</p>
                <p className="mt-1 text-sm text-slate-200">Sign in first, then change the password from Users to match the customer’s preferred credentials.</p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 lg:mx-0">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Admin Sign In</h2>
                <p className="mt-1 text-sm text-slate-500">Use the admin credentials to continue and update them after first login if needed.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Username</label>
                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:hidden">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Admin access</p>
                <p className="mt-1 text-sm text-slate-600">Sign in with the admin account provided during delivery, then update the password after first login if needed.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
