import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsService, salesService, customersService } from '../../services';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Package, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create return form state
  const [newReturn, setNewReturn] = useState({
    originalSaleId: '',
    type: 'RETURN',
    reason: '',
    refundAmount: '',
    restockingFee: '0',
    customerId: '',
    notes: '',
    items: [] as any[],
  });

  const [selectedSale, setSelectedSale] = useState<any>(null);

  // Fetch all returns
  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => returnsService.getAll(),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => returnsService.approve(id, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Return approved successfully');
      setSelectedReturn(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve return');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      returnsService.reject(id, user?.id || '', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Return rejected');
      setSelectedReturn(null);
      setActionType(null);
      setRejectNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject return');
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) => returnsService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Return completed successfully');
      setSelectedReturn(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete return');
    },
  });

  // Create return mutation
  const createReturnMutation = useMutation({
    mutationFn: (data: any) => returnsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Return request created successfully');
      setShowCreateModal(false);
      setNewReturn({
        originalSaleId: '',
        type: 'RETURN',
        reason: '',
        refundAmount: '',
        restockingFee: '0',
        customerId: '',
        notes: '',
        items: [],
      });
      setSelectedSale(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create return');
    },
  });

  // Fetch sales for dropdown
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesService.getAll(),
    enabled: showCreateModal,
  });

  // When sale is selected, populate items
  const handleSaleSelect = (saleId: string) => {
    const sale = sales.find((s: any) => s.id === saleId);
    if (sale) {
      setSelectedSale(sale);
      setNewReturn({
        ...newReturn,
        originalSaleId: saleId,
        customerId: sale.customerId || '',
        refundAmount: sale.total.toString(),
        items: sale.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          serialNumber: item.serialNumber || '',
          reason: '',
          condition: 'UNOPENED',
          refundAmount: item.total,
        })),
      });
    }
  };

  const handleCreateReturn = () => {
    if (!newReturn.originalSaleId || !newReturn.reason || newReturn.items.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const returnData = {
      ...newReturn,
      refundAmount: parseFloat(newReturn.refundAmount),
      restockingFee: parseFloat(newReturn.restockingFee),
      processedBy: user?.id || '',
      items: newReturn.items.map((item: any) => ({
        ...item,
        refundAmount: parseFloat(item.refundAmount),
      })),
    };

    createReturnMutation.mutate(returnData);
  };

  const handleAction = () => {
    if (!selectedReturn) return;

    if (actionType === 'approve') {
      approveMutation.mutate(selectedReturn.id);
    } else if (actionType === 'reject') {
      rejectMutation.mutate({ id: selectedReturn.id, notes: rejectNotes });
    }
  };

  // Filter returns based on active tab
  const filteredReturns = returns.filter((ret: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return ret.status === 'PENDING';
    if (activeTab === 'approved') return ret.status === 'APPROVED';
    if (activeTab === 'completed') return ret.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-blue-100 text-blue-700',
      REJECTED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status as keyof typeof styles] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${
        type === 'RETURN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
      }`}>
        {type}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Returns & Exchanges</h1>
            <p className="text-gray-600 mt-1">Manage product returns and exchange requests</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Return
          </button>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Select a previous sale and create a return request. Returns require admin approval before processing.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">{returns.length}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {returns.filter((r: any) => r.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600">
                {returns.filter((r: any) => r.status === 'APPROVED').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {returns.filter((r: any) => r.status === 'COMPLETED').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b px-4">
          <div className="flex gap-4">
            {['all', 'pending', 'approved', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Returns List */}
        <div className="p-4">
          {filteredReturns.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No returns found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((ret: any) => (
                <div key={ret.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Return #{ret.returnNumber}
                        </h3>
                        {getStatusBadge(ret.status)}
                        {getTypeBadge(ret.type)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Customer: {ret.customer?.name || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Original Sale: #{ret.originalSale?.invoiceNumber} • 
                        Created: {new Date(ret.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Refund Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        PKR {ret.refundAmount?.toLocaleString()}
                      </p>
                      {ret.restockingFee > 0 && (
                        <p className="text-xs text-gray-500">
                          Restocking Fee: PKR {ret.restockingFee?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-600">{ret.reason}</p>
                  </div>

                  {/* Return Items */}
                  {ret.returnItems && ret.returnItems.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                      <div className="space-y-1">
                        {ret.returnItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span>{item.product?.name || 'Product'}</span>
                            </div>
                            <span className="text-gray-600">Qty: {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {ret.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedReturn(ret);
                            setActionType('approve');
                          }}
                          className="btn-primary flex-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReturn(ret);
                            setActionType('reject');
                          }}
                          className="btn-ghost flex-1 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {ret.status === 'APPROVED' && (
                      <button
                        onClick={() => {
                          setSelectedReturn(ret);
                          completeMutation.mutate(ret.id);
                        }}
                        className="btn-primary w-full"
                        disabled={completeMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {selectedReturn && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {actionType === 'approve' ? 'Approve Return' : 'Reject Return'}
            </h2>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Return #{selectedReturn.returnNumber}</p>
              <p className="text-lg font-semibold mt-1">
                Refund: PKR {selectedReturn.refundAmount?.toLocaleString()}
              </p>
            </div>

            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Notes (Optional)
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedReturn(null);
                  setActionType(null);
                  setRejectNotes('');
                }}
                className="btn-ghost flex-1"
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 ${actionType === 'approve' ? 'btn-primary' : 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium'}`}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {approveMutation.isPending || rejectMutation.isPending
                  ? 'Processing...'
                  : actionType === 'approve'
                  ? 'Approve Return'
                  : 'Reject Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Return/Exchange Request</h2>
            
            <div className="space-y-4">
              {/* Select Original Sale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Original Sale <span className="text-red-500">*</span>
                </label>
                <select
                  value={newReturn.originalSaleId}
                  onChange={(e) => handleSaleSelect(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a sale...</option>
                  {sales.map((sale: any) => (
                    <option key={sale.id} value={sale.id}>
                      Invoice #{sale.invoiceNumber} - {new Date(sale.createdAt).toLocaleDateString()} - PKR {sale.total.toLocaleString()} 
                      {sale.customer && ` - ${sale.customer.name}`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSale && (
                <>
                  {/* Sale Details */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Sale Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Invoice:</span> #{selectedSale.invoiceNumber}
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span> {new Date(selectedSale.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-gray-600">Customer:</span> {selectedSale.customer?.name || 'Walk-in'}
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span> PKR {selectedSale.total.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Return Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newReturn.type}
                      onChange={(e) => setNewReturn({ ...newReturn, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="RETURN">Return (Refund)</option>
                      <option value="EXCHANGE">Exchange (Different Product)</option>
                    </select>
                  </div>

                  {/* Return Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newReturn.reason}
                      onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                      placeholder="Why is the customer returning this product?"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={3}
                    />
                  </div>

                  {/* Return Items */}
                  <div>
                    <h3 className="font-semibold mb-2">Return Items</h3>
                    <div className="space-y-3">
                      {newReturn.items.map((item: any, index: number) => {
                        const saleItem = selectedSale.items.find((si: any) => si.productId === item.productId);
                        return (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-medium">{saleItem?.product?.name}</p>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity} × PKR {(saleItem?.price || 0).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const newItems = newReturn.items.filter((_, i) => i !== index);
                                  setNewReturn({ ...newReturn, items: newItems });
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Minus className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Condition</label>
                                <select
                                  value={item.condition}
                                  onChange={(e) => {
                                    const newItems = [...newReturn.items];
                                    newItems[index].condition = e.target.value;
                                    setNewReturn({ ...newReturn, items: newItems });
                                  }}
                                  className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="UNOPENED">Unopened</option>
                                  <option value="OPENED">Opened (Used)</option>
                                  <option value="DEFECTIVE">Defective</option>
                                  <option value="DAMAGED">Damaged</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Refund Amount</label>
                                <input
                                  type="number"
                                  value={item.refundAmount}
                                  onChange={(e) => {
                                    const newItems = [...newReturn.items];
                                    newItems[index].refundAmount = e.target.value;
                                    setNewReturn({ ...newReturn, items: newItems });
                                  }}
                                  className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500"
                                  step="0.01"
                                />
                              </div>
                            </div>

                            <div className="mt-2">
                              <label className="block text-xs text-gray-600 mb-1">Item Return Reason</label>
                              <input
                                type="text"
                                value={item.reason}
                                onChange={(e) => {
                                  const newItems = [...newReturn.items];
                                  newItems[index].reason = e.target.value;
                                  setNewReturn({ ...newReturn, items: newItems });
                                }}
                                placeholder="Specific reason for this item..."
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Restocking Fee & Total Refund */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Restocking Fee (PKR)
                      </label>
                      <input
                        type="number"
                        value={newReturn.restockingFee}
                        onChange={(e) => setNewReturn({ ...newReturn, restockingFee: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        step="0.01"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Fee charged for non-defective returns</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Refund Amount (PKR)
                      </label>
                      <input
                        type="number"
                        value={newReturn.refundAmount}
                        onChange={(e) => setNewReturn({ ...newReturn, refundAmount: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={newReturn.notes}
                      onChange={(e) => setNewReturn({ ...newReturn, notes: e.target.value })}
                      placeholder="Any additional information..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewReturn({
                    originalSaleId: '',
                    type: 'RETURN',
                    reason: '',
                    refundAmount: '',
                    restockingFee: '0',
                    customerId: '',
                    notes: '',
                    items: [],
                  });
                  setSelectedSale(null);
                }}
                className="btn-ghost flex-1"
                disabled={createReturnMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReturn}
                className="btn-primary flex-1"
                disabled={createReturnMutation.isPending || !newReturn.originalSaleId || !newReturn.reason || newReturn.items.length === 0}
              >
                {createReturnMutation.isPending ? 'Creating...' : 'Create Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
