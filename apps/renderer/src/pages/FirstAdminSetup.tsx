import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { setupService } from '../services';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';

export default function FirstAdminSetup({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState({
    posName: 'Home Appliances POS',
    shopName: '',
    fullName: '',
    username: 'admin',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
  });

  const mut = useMutation({
    mutationFn: () => {
      if (form.password !== form.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const { confirmPassword: _, ...payload } = form;
      return setupService.createFirstAdmin({
        ...payload,
        email: payload.email || undefined,
        phone: payload.phone || undefined,
      });
    },
    onSuccess: () => {
      toast.success('First admin created. Please login.');
      onComplete();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create admin');
    },
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-7 py-6 bg-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Create First Admin</h1>
              <p className="text-sm text-white/75">This server database has no admin account yet.</p>
            </div>
          </div>
        </div>

        <form
          className="p-7 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="POS / Software Name" value={form.posName} onChange={(v) => update('posName', v)} required />
            <Field label="Shop Name" value={form.shopName} onChange={(v) => update('shopName', v)} required />
            <Field label="Admin Full Name" value={form.fullName} onChange={(v) => update('fullName', v)} required />
            <Field label="Username" value={form.username} onChange={(v) => update('username', v)} required />
            <Field label="Password" type="password" value={form.password} onChange={(v) => update('password', v)} required />
            <Field label="Confirm Password" type="password" value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Save this username and password safely. After this account is created, this setup screen will not appear again.
          </div>

          <button
            type="submit"
            disabled={mut.isPending}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {mut.isPending ? 'Creating Admin...' : 'Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={type === 'password' ? 6 : undefined}
        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
      />
    </div>
  );
}
