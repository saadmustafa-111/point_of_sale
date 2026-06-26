import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesService, reportsService } from '../../services';
import { ReceiptText, Plus, Trash2, Search, Wallet, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const COMMON_CATEGORIES = ['Rent', 'Utilities', 'Salary', 'Fuel', 'Delivery', 'Marketing', 'Repairs', 'Miscellaneous'];
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD', 'EASYPAISA', 'JAZZCASH'];

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [form, setForm] = useState({
    title: '',
    category: 'Rent',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    notes: '',
    receiptNumber: '',
    vendor: '',
  });

  const { data: expenses = [] } = useQuery({ queryKey: ['expenses', category], queryFn: () => expensesService.getAll(undefined, undefined, category === 'ALL' ? undefined : category) });
  const { data: summary } = useQuery({ queryKey: ['expenseSummary'], queryFn: () => reportsService.expenseSummary() });
  const { data: profit } = useQuery({ queryKey: ['profitSummary'], queryFn: () => reportsService.profitSummary() });

  const createMut = useMutation({
    mutationFn: expensesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expenseSummary'] });
      qc.invalidateQueries({ queryKey: ['profitSummary'] });
      qc.invalidateQueries({ queryKey: ['daily'] });
      qc.invalidateQueries({ queryKey: ['weekly'] });
      qc.invalidateQueries({ queryKey: ['rep-daily'] });
      qc.invalidateQueries({ queryKey: ['rep-weekly'] });
      toast.success('Expense recorded');
      setForm({ title: '', category: 'Rent', amount: '', expenseDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', notes: '', receiptNumber: '', vendor: '' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: expensesService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expenseSummary'] });
      qc.invalidateQueries({ queryKey: ['profitSummary'] });
      toast.success('Expense deleted');
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (expenses as any[]).filter((e) =>
      !q ||
      e.title?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.vendor?.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q) ||
      e.expenseNumber?.toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      ...form,
      amount: +form.amount,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Record and review operating expenses to calculate net profit.</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl px-5 py-4 shadow-lg">
          <p className="text-xs uppercase tracking-wider text-white/60">Net profit</p>
          <p className="text-2xl font-extrabold">PKR {(profit?.netProfit ?? 0).toLocaleString()}</p>
          <p className="text-xs text-white/70">Revenue - COGS - Expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-800">PKR {(summary?.total ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Expense Count</p>
          <p className="text-2xl font-bold text-blue-600">{summary?.count ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Gross Profit</p>
          <p className="text-2xl font-bold text-emerald-600">PKR {(profit?.grossProfit ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Net Profit</p>
          <p className="text-2xl font-bold text-purple-600">PKR {(profit?.netProfit ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-rose-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-700">Add Expense</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Title</span>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Electricity bill, salary payment..." required />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Category</span>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {COMMON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Amount</span>
              <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Expense Date</span>
              <input className="input" type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} required />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Payment Method</span>
              <select className="input" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Vendor</span>
              <input className="input" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Company or person" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Receipt Number</span>
              <input className="input" value={form.receiptNumber} onChange={e => setForm(f => ({ ...f, receiptNumber: e.target.value }))} placeholder="Optional" />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Notes</span>
              <textarea className="input min-h-[96px]" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </label>
          </div>
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button className="btn-primary px-5 py-2.5" type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-9" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-40" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="ALL">All</option>
              {COMMON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="p-5 space-y-3 max-h-[680px] overflow-y-auto">
            {filtered.length ? filtered.map((exp: any) => (
              <div key={exp.id} className="rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{exp.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{exp.expenseNumber} · {exp.category} · {exp.vendor || 'No vendor'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-rose-600">PKR {exp.amount?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" />{exp.paymentMethod?.replace('_', ' ')}</span>
                  <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />{exp.createdBy?.fullName || 'Admin'}</span>
                </div>
                {exp.notes && <p className="mt-3 text-sm text-slate-600">{exp.notes}</p>}
                <button className="mt-3 inline-flex items-center gap-2 text-xs text-red-600 font-semibold" onClick={() => deleteMut.mutate(exp.id)}>
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
              </div>
            )) : (
              <div className="py-16 text-center text-slate-400">
                <ReceiptText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No expenses found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
