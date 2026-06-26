import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, productsService } from '../../services';
import { Plus, X, PackageCheck, PackageMinus, RefreshCw, Warehouse, TrendingUp, TrendingDown, Search, ArrowLeftRight, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  STOCK_IN:     { label: 'Stock In',     color: 'text-emerald-700', bg: 'bg-emerald-100', icon: PackageCheck },
  STOCK_OUT:    { label: 'Stock Out',    color: 'text-red-600',     bg: 'bg-red-100',     icon: PackageMinus },
  ADJUSTMENT:   { label: 'Adjustment',   color: 'text-amber-700',   bg: 'bg-amber-100',   icon: RefreshCw   },
};

export default function InventoryPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'STOCK_IN', quantity: '', reason: '' });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const { data: logs = [], isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => inventoryService.getAll() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsService.getAll() });

  const mut = useMutation({
    mutationFn: inventoryService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock movement recorded!');
      setModal(false);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate({ ...form, quantity: +form.quantity });
  };

  const openModal = () => { setForm({ productId: '', type: 'STOCK_IN', quantity: '', reason: '' }); setModal(true); };

  const allLogs = logs as any[];
  const stockInCount  = allLogs.filter(l => l.type === 'STOCK_IN').reduce((sum, l) => sum + (l.quantity || 0), 0);
  const stockOutCount = allLogs.filter(l => l.type === 'STOCK_OUT').reduce((sum, l) => sum + (l.quantity || 0), 0);
  const adjustmentCount = allLogs.filter(l => l.type === 'ADJUSTMENT').length;

  const filtered = allLogs.filter(l => {
    const matchType = typeFilter === 'ALL' || l.type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.product?.name || '').toLowerCase().includes(q) ||
      (l.performedBy?.fullName || '').toLowerCase().includes(q) ||
      (l.reason || '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const selectedProduct = (products as any[]).find((p: any) => p.id === form.productId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory / Stock</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track all stock movements and adjustments</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md"
          onClick={openModal}
        >
          <Plus className="w-4 h-4" />
          Stock Movement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Logs</p>
            <p className="text-2xl font-bold text-slate-800">{allLogs.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Stock In</p>
            <p className="text-2xl font-bold text-emerald-600">{stockInCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Stock Out</p>
            <p className="text-2xl font-bold text-red-500">{stockOutCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Adjustments</p>
            <p className="text-2xl font-bold text-amber-600">{adjustmentCount}</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, user, reason…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  typeFilter === t
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'STOCK_IN' ? 'In' : t === 'STOCK_OUT' ? 'Out' : 'Adj.'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">By</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading inventory…</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Warehouse className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No inventory logs found</p>
                      <p className="text-slate-400 text-xs">
                        {search || typeFilter !== 'ALL' ? 'Try adjusting your filters' : 'Click "Stock Movement" to record one'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((l: any, idx: number) => {
                const cfg = TYPE_CONFIG[l.type] || TYPE_CONFIG.ADJUSTMENT;
                const Icon = cfg.icon;
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-400 text-xs font-medium">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">{l.product?.name || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-base font-bold ${l.type === 'STOCK_IN' ? 'text-emerald-600' : l.type === 'STOCK_OUT' ? 'text-red-500' : 'text-amber-600'}`}>
                        {l.type === 'STOCK_IN' ? '+' : l.type === 'STOCK_OUT' ? '-' : '~'}{l.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 max-w-[180px]">
                      {l.reason
                        ? <span className="line-clamp-1 text-xs">{l.reason}</span>
                        : <span className="text-slate-300 italic text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-teal-600" />
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{l.performedBy?.fullName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(l.createdAt).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {allLogs.length} records
          </div>
        )}
      </div>

      {/* Stock Movement Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-teal-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Record Stock Movement</h2>
                    <p className="text-xs text-white/70 mt-0.5">Add, remove or adjust product stock</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={submit}>
              <div className="p-6 space-y-5">
                {/* Movement Type Pills */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Movement Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'STOCK_IN',   label: 'Stock In',   icon: PackageCheck, color: 'bg-emerald-500' },
                      { value: 'STOCK_OUT',  label: 'Stock Out',  icon: PackageMinus, color: 'bg-red-500' },
                      { value: 'ADJUSTMENT', label: 'Adjustment', icon: RefreshCw,    color: 'bg-amber-500' },
                    ].map(opt => {
                      const Icon = opt.icon;
                      const active = form.type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                            active
                              ? `${opt.color} text-white border-transparent shadow-md`
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Product <span className="text-red-500">*</span></label>
                  <select
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition"
                    value={form.productId}
                    onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                    required
                  >
                    <option value="">Select a product…</option>
                    {(products as any[]).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} — Current Stock: {p.stock}</option>
                    ))}
                  </select>
                  {selectedProduct && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
                      <Warehouse className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-xs text-teal-700 font-medium">Current stock: <strong>{selectedProduct.stock}</strong> units</span>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition placeholder:text-slate-400"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="Enter quantity…"
                    required
                  />
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Reason <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition placeholder:text-slate-400"
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. New shipment arrived, damaged goods…"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mut.isPending}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all disabled:opacity-60 shadow-sm shadow-teal-200"
                >
                  {mut.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Applying…
                    </span>
                  ) : 'Apply Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
