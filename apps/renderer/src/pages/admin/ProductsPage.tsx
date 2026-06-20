import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, categoriesService, brandsService } from '../../services';
import { Plus, Search, Pencil, Trash2, X, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', sku:'', barcode:'', categoryId:'', brandId:'', purchasePrice:'',
  salePrice:'', stock:'', lowStockLimit:'5', warrantyMonths:'0', description:'', isActive: true };

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search], queryFn: () => productsService.getAll(search || undefined), });
  const { data: categories = [] } = useQuery({ queryKey:['categories'], queryFn: categoriesService.getAll });
  const { data: brands = [] }     = useQuery({ queryKey:['brands'],     queryFn: brandsService.getAll });

  const createMut = useMutation({ mutationFn: productsService.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:['products']}); toast.success('Product created'); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({id,d}:any) => productsService.update(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['products']}); toast.success('Product updated'); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: productsService.delete,
    onSuccess: () => { qc.invalidateQueries({queryKey:['products']}); toast.success('Product deleted'); } });

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit   = (p: any) => {
    setForm({ name:p.name, sku:p.sku, barcode:p.barcode||'', categoryId:p.categoryId, brandId:p.brandId,
      purchasePrice:p.purchasePrice, salePrice:p.salePrice, stock:p.stock,
      lowStockLimit:p.lowStockLimit, warrantyMonths:p.warrantyMonths, description:p.description||'', isActive:p.isActive });
    setEditId(p.id); setModal('edit');
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, purchasePrice:+form.purchasePrice, salePrice:+form.salePrice,
      stock:+form.stock, lowStockLimit:+form.lowStockLimit, warrantyMonths:+form.warrantyMonths };
    if (modal === 'create') createMut.mutate(payload);
    else updateMut.mutate({ id: editId, d: payload });
  };

  const allProducts = products as any[];
  const activeCount   = allProducts.filter(p => p.isActive).length;
  const lowStockCount = allProducts.filter(p => p.stock <= p.lowStockLimit).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your product catalogue</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md" onClick={openCreate}>
          <Plus className="w-4 h-4" />Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Package className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Total Products</p><p className="text-2xl font-bold text-slate-800">{allProducts.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Active</p><p className="text-2xl font-bold text-emerald-600">{activeCount}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Low Stock</p><p className="text-2xl font-bold text-red-500">{lowStockCount}</p></div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Search by name, SKU, barcode…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['#', 'Product', 'SKU', 'Category', 'Brand', 'Sale Price', 'Stock', 'Status', 'Actions'].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={9} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-slate-400"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm">Loading…</span></div></td></tr>
              )}
              {!isLoading && allProducts.length === 0 && (
                <tr><td colSpan={9} className="text-center py-16"><div className="flex flex-col items-center gap-3"><div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center"><Package className="w-7 h-7 text-slate-400" /></div><p className="text-slate-500 font-medium">No products yet</p></div></td></tr>
              )}
              {(products as any[]).map((p: any, idx: number) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-5 py-3 text-slate-500">{p.category?.name}</td>
                  <td className="px-5 py-3 text-slate-500">{p.brand?.name}</td>
                  <td className="px-5 py-3 font-semibold text-slate-700">PKR {p.salePrice.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${p.stock <= p.lowStockLimit ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" />Edit</button>
                      <button onClick={() => deleteMut.mutate(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allProducts.length > 0 && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">Showing {allProducts.length} products</div>}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
            <div className={`px-6 py-5 ${modal === 'create' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'bg-gradient-to-r from-purple-600 to-purple-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    {modal === 'create' ? <Plus className="w-5 h-5 text-white" /> : <Pencil className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'Add New Product' : 'Edit Product'}</h2>
                    <p className="text-xs text-white/70 mt-0.5">{modal === 'create' ? 'Fill in the product details below' : 'Update product information'}</p>
                  </div>
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={() => setModal(null)}><X className="w-4 h-4" /></button>
              </div>
            </div>

            <form onSubmit={submit} className="p-6 space-y-5">
              {/* Basic Info */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Basic Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Product Name *</label>
                    <input className="input" value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} placeholder="e.g. Samsung AC 1.5 Ton" required />
                  </div>
                  <div>
                    <label className="label">SKU *</label>
                    <input className="input" value={form.sku} onChange={e=>setForm((f:any)=>({...f,sku:e.target.value}))} placeholder="e.g. SAM-AC-15T" required />
                  </div>
                  <div>
                    <label className="label">Barcode</label>
                    <input className="input" value={form.barcode} onChange={e=>setForm((f:any)=>({...f,barcode:e.target.value}))} placeholder="Scan or type barcode" />
                  </div>
                  <div>
                    <label className="label">Warranty (months)</label>
                    <input className="input" type="number" min="0" value={form.warrantyMonths} onChange={e=>setForm((f:any)=>({...f,warrantyMonths:e.target.value}))} placeholder="0" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Description</label>
                    <textarea className="input resize-none" rows={2} value={form.description} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} placeholder="Optional product description" />
                  </div>
                </div>
              </div>

              {/* Category & Brand */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Category & Brand</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category *</label>
                    <select className="input" value={form.categoryId} onChange={e=>setForm((f:any)=>({...f,categoryId:e.target.value}))} required>
                      <option value="">Select category…</option>
                      {categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Brand *</label>
                    <select className="input" value={form.brandId} onChange={e=>setForm((f:any)=>({...f,brandId:e.target.value}))} required>
                      <option value="">Select brand…</option>
                      {brands.map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pricing</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Purchase Price (PKR) *</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={e=>setForm((f:any)=>({...f,purchasePrice:e.target.value}))} placeholder="0" required />
                  </div>
                  <div>
                    <label className="label">Sale Price (PKR) *</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.salePrice} onChange={e=>setForm((f:any)=>({...f,salePrice:e.target.value}))} placeholder="0" required />
                    {form.purchasePrice && form.salePrice && +form.salePrice > +form.purchasePrice && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Margin: PKR {(+form.salePrice - +form.purchasePrice).toLocaleString()} ({Math.round((+form.salePrice - +form.purchasePrice) / +form.purchasePrice * 100)}%)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Inventory</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Stock Qty *</label>
                    <input className="input" type="number" min="0" value={form.stock} onChange={e=>setForm((f:any)=>({...f,stock:e.target.value}))} placeholder="0" required />
                  </div>
                  <div>
                    <label className="label">Low Stock Alert</label>
                    <input className="input" type="number" min="0" value={form.lowStockLimit} onChange={e=>setForm((f:any)=>({...f,lowStockLimit:e.target.value}))} placeholder="5" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e=>setForm((f:any)=>({...f,isActive:e.target.checked}))} className="w-4 h-4 rounded accent-blue-600" />
                      <span className="text-sm font-medium text-slate-600">Active (visible on POS)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-60 shadow-sm ${modal === 'create' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`} disabled={createMut.isPending || updateMut.isPending}>
                  {createMut.isPending || updateMut.isPending ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : modal === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
