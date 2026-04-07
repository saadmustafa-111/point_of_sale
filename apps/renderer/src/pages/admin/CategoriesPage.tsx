import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '../../services';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create'|'edit'|null>(null);
  const [form, setForm] = useState({ name:'', description:'' });
  const [editId, setEditId] = useState('');

  const { data = [] } = useQuery({ queryKey:['categories'], queryFn: categoriesService.getAll });
  const createM = useMutation({ mutationFn: categoriesService.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:['categories']}); toast.success('Created'); setModal(null); } });
  const updateM = useMutation({ mutationFn: ({id,d}:any) => categoriesService.update(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['categories']}); toast.success('Updated'); setModal(null); } });
  const deleteM = useMutation({ mutationFn: categoriesService.delete,
    onSuccess: () => { qc.invalidateQueries({queryKey:['categories']}); toast.success('Deleted'); } });

  const submit = (e:React.FormEvent) => {
    e.preventDefault();
    if (modal==='create') createM.mutate(form);
    else updateM.mutate({ id: editId, d: form });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Categories</h1>
        <button className="btn-primary" onClick={()=>{ setForm({name:'',description:''}); setModal('create'); }}>
          <Plus className="w-4 h-4"/>Add Category
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-slate-500 text-left">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Description</th>
            <th className="pb-2 font-medium"></th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {data.map((c:any)=>(
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-3 pr-4 text-slate-700 font-medium">{c.name}</td>
                <td className="py-3 pr-4 text-slate-500">{c.description || '—'}</td>
                <td className="py-3 flex gap-2 justify-end">
                  <button className="btn-ghost px-2 py-1" onClick={()=>{ setForm({name:c.name,description:c.description||''}); setEditId(c.id); setModal('edit'); }}><Pencil className="w-3.5 h-3.5"/></button>
                  <button className="btn-ghost px-2 py-1 text-red-400" onClick={()=>deleteM.mutate(c.id)}><Trash2 className="w-3.5 h-3.5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{modal==='create'?'➕ Add Category':'✏️ Edit Category'}</h2>
              <button type="button" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" onClick={()=>setModal(null)}><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label className="label">Category Name *</label>
                <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Air Conditioners" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional description" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" className="btn-ghost px-5" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary px-6" disabled={createM.isPending||updateM.isPending}>
                  {createM.isPending||updateM.isPending?'Saving…':modal==='create'?'Create Category':'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
