import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      setAuth(data.user, data.accessToken);
      toast.success(`Welcome, ${data.user.fullName}!`);
      navigate(data.user.role === 'ADMIN' ? '/dashboard' : '/pos');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg shadow-primary-600/30">P</div>
          <h1 className="text-2xl font-bold text-slate-800">POS System</h1>
          <p className="text-slate-500 text-sm mt-1">Home Appliances Shop</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username" required autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password" required />
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
