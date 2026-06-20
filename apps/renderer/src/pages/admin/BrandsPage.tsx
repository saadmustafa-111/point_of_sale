import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandsService } from '../../services';
import { Plus, Pencil, Trash2, X, Award, Search, Layers, AlertTriangle, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BrandsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');

  const { data = [], isLoading } = useQuery({ queryKey: ['brands'], queryFn: brandsService.getAll });

  const createM = useMutation({
    mutationFn: brandsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Brand created!'); setModal(null); },
  });
  const updateM = useMutation({
    mutationFn: ({ id, d }: any) => brandsService.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Brand updated!'); setModal(null); },
  });
  const deleteM = useMutation({
    mutationFn: brandsService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Brand deleted!'); setModal(null); },
  });

  const openCreate = () => { setForm({ name: '', description: '' }); setModal('create'); };
  const openEdit = (b: any) => { setForm({ name: b.name, description: b.description || '' }); setEditId(b.id); setModal('edit'); };
  const openDelete = (b: any) => { setDeleteTarget({ id: b.id, name: b.name }); setModal('delete'); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === 'create') createM.mutate(form);
    else updateM.mutate({ id: editId, d: form });
  };

  const filtered = (data as any[]).filter((b: any) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const COLORS = [
    'bg-indigo-100 text-indigo-700',
    'bg-cyan-100 text-cyan-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
    'bg-sky-100 text-sky-700',
    'bg-lime-100 text-lime-700',
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Brands</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your product brands</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Brands</p>
            <p className="text-2xl font-bold text-slate-800">{(data as any[]).length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <BadgeCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">With Description</p>
            <p className="text-2xl font-bold text-slate-800">
              {(data as any[]).filter((b: any) => b.description).length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Search Results</p>
            <p className="text-2xl font-bold text-slate-800">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Search + Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Brand</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading brands…</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Award className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No brands found</p>
                      <p className="text-slate-400 text-xs">
                        {search ? 'Try a different search term' : 'Click "Add Brand" to create one'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((b: any, idx: number) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4 text-slate-400 text-xs font-medium">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold ${COLORS[idx % COLORS.length]}`}>
                        {b.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-800">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500 max-w-xs">
                    {b.description
                      ? <span className="line-clamp-1">{b.description}</span>
                      : <span className="text-slate-300 italic text-xs">No description</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(b)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => openDelete(b)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {(data as any[]).length} brands
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className={`px-6 py-5 ${modal === 'create' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500' : 'bg-gradient-to-r from-violet-600 to-violet-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    {modal === 'create' ? <Plus className="w-5 h-5 text-white" /> : <Pencil className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {modal === 'create' ? 'Add New Brand' : 'Edit Brand'}
                    </h2>
                    <p className="text-xs text-white/70 mt-0.5">
                      {modal === 'create' ? 'Create a new product brand' : `Updating: ${form.name}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={submit}>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition placeholder:text-slate-400"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Samsung, LG, Haier…"
                    required
                  />
                  <p className="text-xs text-slate-400">This name will appear on products and reports</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Description <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition placeholder:text-slate-400 resize-none"
                    rows={4}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of the brand, origin, or product lines…"
                  />
                  <p className="text-xs text-slate-400">{form.description.length} / 255 characters</p>
                </div>

                {/* Preview Badge */}
                {form.name && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Preview:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">
                      <Award className="w-3 h-3" />
                      {form.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createM.isPending || updateM.isPending}
                  className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm ${
                    modal === 'create'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                      : 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'
                  }`}
                >
                  {createM.isPending || updateM.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : modal === 'create' ? 'Create Brand' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Delete Brand</h2>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteM.mutate(deleteTarget.id)}
                  disabled={deleteM.isPending}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-60 shadow-sm shadow-red-200"
                >
                  {deleteM.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting…
                    </span>
                  ) : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
