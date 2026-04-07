import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, categoriesService, brandsService } from '../../services';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Products</h1>
        <button className="btn-primary" onClick={openCreate}><Plus className="w-4 h-4" />Add Product</button>
      </div>

      <div className="card mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-500" />
        <input className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          placeholder="Search by name, SKU, barcode…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-slate-500">
              {['Name','SKU','Category','Brand','Sale Price','Stock','Status',''].map(h=>(
                <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-500">Loading…</td></tr>
            ) : products.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-4 text-slate-700 font-medium">{p.name}</td>
                <td className="py-3 pr-4 text-slate-500 font-mono text-xs">{p.sku}</td>
                <td className="py-3 pr-4 text-slate-500">{p.category?.name}</td>
                <td className="py-3 pr-4 text-slate-500">{p.brand?.name}</td>
                <td className="py-3 pr-4 text-slate-700">PKR {p.salePrice.toLocaleString()}</td>
                <td className="py-3 pr-4">
                  <span className={p.stock <= p.lowStockLimit ? 'badge-danger' : 'badge-success'}>{p.stock}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className={p.isActive ? 'badge-success' : 'badge-danger'}>{p.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="py-3 flex items-center gap-2 justify-end">
                  <button className="btn-ghost px-2 py-1" onClick={()=>openEdit(p)}><Pencil className="w-3.5 h-3.5"/></button>
                  <button className="btn-ghost px-2 py-1 text-red-400 hover:text-red-300" onClick={()=>deleteMut.mutate(p.id)}>
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{modal === 'create' ? '➕ Add New Product' : '✏️ Edit Product'}</h2>
              <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" onClick={()=>setModal(null)}><X className="w-5 h-5"/></button>
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

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" className="btn-ghost px-5" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary px-6" disabled={createMut.isPending || updateMut.isPending}>
                  {createMut.isPending || updateMut.isPending ? 'Saving…' : modal==='create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
