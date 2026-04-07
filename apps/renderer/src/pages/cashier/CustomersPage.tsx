import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '../../services';
import { Plus, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'' });

  const { data = [] } = useQuery({ queryKey:['customers',search], queryFn: ()=>customersService.getAll(search||undefined) });
  const createM = useMutation({ mutationFn: customersService.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:['customers']}); toast.success('Customer added'); setModal(false); } });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Customers</h1>
        <button className="btn-primary" onClick={()=>{ setForm({name:'',phone:'',email:'',address:''}); setModal(true); }}>
          <UserPlus className="w-4 h-4"/>Add Customer
        </button>
      </div>
      <div className="card mb-4 flex items-center gap-2 py-2.5">
        <input className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          placeholder="Search by name or phone…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-slate-500 text-left">
            {['Name','Phone','Email','Address'].map(h=><th key={h} className="pb-2 pr-4 font-medium">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {data.map((c:any)=>(
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-3 pr-4 text-slate-700 font-medium">{c.name}</td>
                <td className="py-3 pr-4 text-slate-500">{c.phone||'—'}</td>
                <td className="py-3 pr-4 text-slate-500">{c.email||'—'}</td>
                <td className="py-3 text-slate-500">{c.address||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={e=>{e.preventDefault();createM.mutate(form);}} className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Add Customer</h2>
              <button type="button" className="btn-ghost p-1" onClick={()=>setModal(false)}><X className="w-4 h-4"/></button>
            </div>
            <div><label className="label">Name</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
            <div><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
