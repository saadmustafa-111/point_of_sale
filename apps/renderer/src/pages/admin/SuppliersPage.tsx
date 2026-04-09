import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersService } from '../../services';
import { Building2, Phone, Mail, MapPin, Plus, Edit2, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  ntn: '',
  creditLimit: '',
  notes: '',
};

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersService.getAll(search || undefined),
  });

  const { data: summary } = useQuery({
    queryKey: ['suppliers-summary'],
    queryFn: () => suppliersService.getSummary(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => suppliersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-summary'] });
      toast.success('Supplier added successfully');
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add supplier'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => suppliersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-summary'] });
      toast.success('Supplier updated');
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update supplier'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      ntn: s.ntn || '',
      creditLimit: s.creditLimit?.toString() || '',
      notes: s.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    const payload: any = {
      name: form.name.trim(),
      contactPerson: form.contactPerson || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      ntn: form.ntn || undefined,
      creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : 0,
      notes: form.notes || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage your company dealerships — PEL, Dawlance, Haier, etc.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Suppliers</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalSuppliers ?? 0}</p>
          </div>
          <Building2 className="w-8 h-8 text-blue-500" />
        </div>

        <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-600">
              PKR {(summary?.totalOutstanding ?? 0).toLocaleString()}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-red-500" />
        </div>

        <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Suppliers with Balance</p>
            <p className="text-2xl font-bold text-orange-600">{summary?.suppliersWithBalance ?? 0}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-orange-500" />
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search suppliers by name, contact, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Suppliers Grid */}
      {suppliers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No suppliers found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first supplier to start tracking purchases</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s: any) => (
            <div key={s.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg uppercase">
                    {s.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    {s.contactPerson && (
                      <p className="text-xs text-gray-500">{s.contactPerson}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Contact info */}
              <div className="space-y-1 mb-3">
                {s.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {s.phone}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {s.email}
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>

              {/* Balance */}
              <div className="pt-3 border-t grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500">Credit Limit</p>
                  <p className="text-sm font-semibold text-gray-700">
                    PKR {s.creditLimit?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Outstanding</p>
                  <p className={`text-sm font-bold ${s.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    PKR {s.currentBalance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              {/* Orders count */}
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-400">
                  {s._count?.purchaseOrders ?? 0} purchase order(s)
                </span>
              </div>

              {!s.isActive && (
                <div className="mt-2 text-center">
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">Inactive</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">
              {editing ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company / Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. PEL, Dawlance, Haier"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Sales representative"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="03xx-xxxxxxx"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="supplier@company.com"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NTN (Tax No.)</label>
                  <input
                    type="text"
                    value={form.ntn}
                    onChange={(e) => setForm({ ...form, ntn: e.target.value })}
                    placeholder="xxxx-x"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Supplier's business address"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit (PKR)
                </label>
                <input
                  type="number"
                  value={form.creditLimit}
                  onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                  placeholder="Max credit amount allowed"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum total you can owe this supplier</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes about this supplier..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={closeModal} className="btn-ghost flex-1" disabled={isPending}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary flex-1" disabled={isPending}>
                {isPending ? 'Saving...' : editing ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
