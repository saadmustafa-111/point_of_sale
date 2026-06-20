import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../../services';
import { Plus, Pencil, Trash2, X, Users, ShieldCheck, UserCheck, Search, AlertTriangle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { username: '', fullName: '', password: '', role: 'CASHIER', phone: '', isActive: true };

export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');

  const { data = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: usersService.getAll });
  const createM = useMutation({ mutationFn: usersService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created!'); setModal(null); } });
  const updateM = useMutation({ mutationFn: ({ id, d }: any) => usersService.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated!'); setModal(null); } });
  const deleteM = useMutation({ mutationFn: usersService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted!'); setModal(null); } });

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (u: any) => { setForm({ ...u, password: '' }); setEditId(u.id); setModal('edit'); };
  const openDelete = (u: any) => { setDeleteTarget({ id: u.id, name: u.fullName }); setModal('delete'); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (modal === 'edit' && !payload.password) delete payload.password;
    if (modal === 'create') createM.mutate(payload);
    else updateM.mutate({ id: editId, d: payload });
  };

  const allUsers = data as any[];
  const admins   = allUsers.filter(u => u.role === 'ADMIN').length;
  const cashiers = allUsers.filter(u => u.role === 'CASHIER').length;
  const active   = allUsers.filter(u => u.isActive).length;

  const filtered = allUsers.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || '').includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users & Cashiers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage system users and access roles</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Total Users</p><p className="text-2xl font-bold text-slate-800">{allUsers.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Admins</p><p className="text-2xl font-bold text-purple-600">{admins}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Cashiers</p><p className="text-2xl font-bold text-emerald-600">{cashiers}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center"><UserCheck className="w-5 h-5 text-teal-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Active</p><p className="text-2xl font-bold text-teal-600">{active}</p></div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search name, username, phone…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['#', 'User', 'Username', 'Role', 'Phone', 'Status', 'Actions'].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-slate-400"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm">Loading users…</span></div></td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16"><div className="flex flex-col items-center gap-3"><div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center"><Users className="w-7 h-7 text-slate-400" /></div><p className="text-slate-500 font-medium">No users found</p></div></td></tr>
              )}
              {filtered.map((u: any, idx: number) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4 text-slate-400 text-xs font-medium">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="font-mono text-xs text-slate-500">@{u.username}</span></td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-sm">{u.phone || <span className="text-slate-300 italic text-xs">—</span>}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(u)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />Edit
                      </button>
                      <button onClick={() => openDelete(u)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {allUsers.length} users
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className={`px-6 py-5 ${modal === 'create' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'bg-gradient-to-r from-purple-600 to-purple-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    {modal === 'create' ? <Plus className="w-5 h-5 text-white" /> : <Pencil className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'Add New User' : 'Edit User'}</h2>
                    <p className="text-xs text-white/70 mt-0.5">{modal === 'create' ? 'Create a new system user' : `Editing: ${form.fullName}`}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <form onSubmit={submit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                    <input className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition placeholder:text-slate-400"
                      value={form.fullName} onChange={e => setForm((f: any) => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Ali Hassan" required />
                  </div>
                  {modal === 'create' && (
                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Username <span className="text-red-500">*</span></label>
                      <input className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition placeholder:text-slate-400"
                        value={form.username} onChange={e => setForm((f: any) => ({ ...f, username: e.target.value }))} placeholder="e.g. ali_cashier" required />
                    </div>
                  )}
                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" />{modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password'} {modal === 'create' && <span className="text-red-500">*</span>}</label>
                    <input className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition placeholder:text-slate-400"
                      type="password" value={form.password} onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))} required={modal === 'create'} placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Role</label>
                    <select className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                      value={form.role} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))}>
                      <option value="CASHIER">Cashier</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Phone</label>
                    <input className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition placeholder:text-slate-400"
                      value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} placeholder="03xx-xxxxxxx" />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Active Account</p>
                        <p className="text-xs text-slate-400">User can log in and use the system</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={createM.isPending || updateM.isPending}
                  className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-60 shadow-sm ${modal === 'create' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                  {createM.isPending || updateM.isPending ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : modal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-white" /></div>
                <h2 className="text-lg font-bold text-white">Delete User</h2>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">Are you sure you want to delete <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>? This action cannot be undone.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={() => deleteM.mutate(deleteTarget.id)} disabled={deleteM.isPending} className="px-6 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-60">
                  {deleteM.isPending ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</span> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
