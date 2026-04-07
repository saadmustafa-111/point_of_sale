import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../../services';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { username:'', fullName:'', password:'', role:'CASHIER', phone:'', isActive:true };

export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create'|'edit'|null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState('');

  const { data = [] } = useQuery({ queryKey:['users'], queryFn: usersService.getAll });
  const createM = useMutation({ mutationFn: usersService.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:['users']}); toast.success('User created'); setModal(null); } });
  const updateM = useMutation({ mutationFn: ({id,d}:any) => usersService.update(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['users']}); toast.success('Updated'); setModal(null); } });
  const deleteM = useMutation({ mutationFn: usersService.delete,
    onSuccess: () => { qc.invalidateQueries({queryKey:['users']}); toast.success('Deleted'); } });

  const submit = (e:React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (modal === 'edit' && !payload.password) delete payload.password;
    if (modal==='create') createM.mutate(payload);
    else updateM.mutate({ id: editId, d: payload });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Users / Cashiers</h1>
        <button className="btn-primary" onClick={()=>{ setForm(EMPTY); setModal('create'); }}>
          <Plus className="w-4 h-4"/>Add User
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-slate-500 text-left">
            {['Full Name','Username','Role','Phone','Status',''].map(h=><th key={h} className="pb-2 pr-4 font-medium">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {data.map((u:any)=>(
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="py-3 pr-4 text-slate-700 font-medium">{u.fullName}</td>
                <td className="py-3 pr-4 text-slate-500 font-mono text-xs">@{u.username}</td>
                <td className="py-3 pr-4"><span className={u.role==='ADMIN'?'badge-info':'badge-success'}>{u.role}</span></td>
                <td className="py-3 pr-4 text-slate-500">{u.phone||'—'}</td>
                <td className="py-3 pr-4"><span className={u.isActive?'badge-success':'badge-danger'}>{u.isActive?'Active':'Inactive'}</span></td>
                <td className="py-3 flex gap-2 justify-end">
                  <button className="btn-ghost px-2 py-1" onClick={()=>{ setForm({...u,password:''}); setEditId(u.id); setModal('edit'); }}><Pencil className="w-3.5 h-3.5"/></button>
                  <button className="btn-ghost px-2 py-1 text-red-400" onClick={()=>deleteM.mutate(u.id)}><Trash2 className="w-3.5 h-3.5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">{modal==='create'?'Add':'Edit'} User</h2>
              <button type="button" className="btn-ghost p-1" onClick={()=>setModal(null)}><X className="w-4 h-4"/></button>
            </div>
            <div><label className="label">Full Name</label><input className="input" value={form.fullName} onChange={e=>setForm((f:any)=>({...f,fullName:e.target.value}))} required /></div>
            {modal==='create' && <div><label className="label">Username</label><input className="input" value={form.username} onChange={e=>setForm((f:any)=>({...f,username:e.target.value}))} required /></div>}
            <div><label className="label">{modal==='edit'?'New Password (leave blank to keep)':'Password'}</label><input className="input" type="password" value={form.password} onChange={e=>setForm((f:any)=>({...f,password:e.target.value}))} required={modal==='create'} /></div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e=>setForm((f:any)=>({...f,role:e.target.value}))}>
                <option value="CASHIER">Cashier</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm((f:any)=>({...f,phone:e.target.value}))} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.isActive} onChange={e=>setForm((f:any)=>({...f,isActive:e.target.checked}))} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm text-slate-500">Active</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary">{modal==='create'?'Create':'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
