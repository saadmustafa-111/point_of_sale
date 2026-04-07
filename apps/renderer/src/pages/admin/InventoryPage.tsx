import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, productsService } from '../../services';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId:'', type:'STOCK_IN', quantity:'', reason:'' });

  const { data: logs = [] } = useQuery({ queryKey:['inventory'], queryFn: () => inventoryService.getAll() });
  const { data: products = [] } = useQuery({ queryKey:['products'], queryFn: () => productsService.getAll() });

  const mut = useMutation({ mutationFn: inventoryService.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:['inventory']}); qc.invalidateQueries({queryKey:['products']}); toast.success('Stock updated'); setModal(false); } });

  const submit = (e:React.FormEvent) => {
    e.preventDefault();
    mut.mutate({ ...form, quantity: +form.quantity });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Inventory / Stock</h1>
        <button className="btn-primary" onClick={()=>{ setForm({productId:'',type:'STOCK_IN',quantity:'',reason:''}); setModal(true); }}>
          <Plus className="w-4 h-4"/>Stock Movement
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-slate-500 text-left">
            {['Product','Type','Qty','Reason','By','Date'].map(h=><th key={h} className="pb-2 pr-4 font-medium">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {logs.map((l:any)=>(
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="py-3 pr-4 text-slate-700">{l.product?.name}</td>
                <td className="py-3 pr-4">
                  <span className={l.type==='STOCK_IN'?'badge-success':l.type==='STOCK_OUT'?'badge-danger':'badge-warn'}>{l.type}</span>
                </td>
                <td className="py-3 pr-4 text-slate-700 font-medium">{l.quantity}</td>
                <td className="py-3 pr-4 text-slate-500">{l.reason||'—'}</td>
                <td className="py-3 pr-4 text-slate-500">{l.performedBy?.fullName}</td>
                <td className="py-3 pr-4 text-slate-500 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Stock Movement</h2>
              <button type="button" className="btn-ghost p-1" onClick={()=>setModal(false)}><X className="w-4 h-4"/></button>
            </div>
            <div>
              <label className="label">Product</label>
              <select className="input" value={form.productId} onChange={e=>setForm(f=>({...f,productId:e.target.value}))} required>
                <option value="">Select product</option>
                {products.map((p:any)=><option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="STOCK_IN">Stock In</option>
                <option value="STOCK_OUT">Stock Out</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>
            <div><label className="label">Quantity</label><input className="input" type="number" min="1" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} required /></div>
            <div><label className="label">Reason (optional)</label><input className="input" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Apply</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
