import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService, suppliersService, productsService } from '../../services';
import {
  ShoppingBag, Plus, Minus, CreditCard, CheckCircle, XCircle,
  Clock, TrendingDown, FileText, Banknote, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;

const STATUS_BADGE: Record<string, string> = {
  PENDING:        'bg-yellow-100 text-yellow-700',
  RECEIVED:       'bg-blue-100 text-blue-700',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-700',
  PAID:           'bg-green-100 text-green-700',
  CANCELLED:      'bg-gray-100 text-gray-500',
};

const PAYMENT_METHODS = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'];

type Tab = 'orders' | 'payments';

const EMPTY_ORDER = {
  supplierId: '',
  expectedDate: '',
  discountAmount: '0',
  taxAmount: '0',
  notes: '',
  items: [] as any[],
};

const EMPTY_ITEM = { productId: '', productName: '', sku: '', quantity: '1', unitCost: '' };

const EMPTY_PAYMENT = {
  supplierId: '',
  orderId: '',
  amount: '',
  paymentMethod: 'CASH',
  paymentDate: '',
  referenceNo: '',
  notes: '',
};

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('orders');

  // filters
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState<any>(null); // order object
  const [viewOrder, setViewOrder] = useState<any>(null);

  // forms
  const [orderForm, setOrderForm] = useState({ ...EMPTY_ORDER });
  const [paymentForm, setPaymentForm] = useState({ ...EMPTY_PAYMENT });
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM });

  // ─── queries ────────────────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['purchase-stats'],
    queryFn: () => purchasesService.getStats(),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['purchase-orders', filterSupplier, filterStatus],
    queryFn: () => purchasesService.getOrders(filterSupplier || undefined, filterStatus || undefined),
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['supplier-payments', filterSupplier],
    queryFn: () => purchasesService.getPayments(filterSupplier || undefined),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersService.getAll(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
    enabled: showOrderModal,
  });

  const { data: orderDetail } = useQuery({
    queryKey: ['purchase-order-detail', viewOrder?.id],
    queryFn: () => purchasesService.getOrder(viewOrder.id),
    enabled: !!viewOrder?.id,
  });

  // ─── mutations ──────────────────────────────────────────────────────────────
  const createOrderMutation = useMutation({
    mutationFn: (data: any) => purchasesService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Purchase order created');
      setShowOrderModal(false);
      setOrderForm({ ...EMPTY_ORDER });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create order'),
  });

  const receiveOrderMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => purchasesService.receiveOrder(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Order marked as received — stock updated');
      setShowReceiveModal(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to receive order'),
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => purchasesService.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Order cancelled');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to cancel order'),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => purchasesService.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentForm({ ...EMPTY_PAYMENT });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to record payment'),
  });

  // ─── handlers ───────────────────────────────────────────────────────────────
  const addItem = () => {
    if (!newItem.productName.trim() || !newItem.quantity || !newItem.unitCost) {
      toast.error('Fill in product name, quantity and unit cost');
      return;
    }
    const qty = parseInt(newItem.quantity);
    const cost = parseFloat(newItem.unitCost);
    setOrderForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: newItem.productId || undefined,
          productName: newItem.productName,
          sku: newItem.sku || undefined,
          quantity: qty,
          unitCost: cost,
          totalCost: qty * cost,
        },
      ],
    }));
    setNewItem({ ...EMPTY_ITEM });
  };

  const removeItem = (idx: number) => {
    setOrderForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleProductSelect = (productId: string) => {
    const p = products.find((pr: any) => pr.id === productId);
    if (p) {
      setNewItem({ ...newItem, productId, productName: p.name, sku: p.sku, unitCost: p.purchasePrice?.toString() || '' });
    } else {
      setNewItem({ ...newItem, productId: '' });
    }
  };

  const handleCreateOrder = () => {
    if (!orderForm.supplierId) { toast.error('Select a supplier'); return; }
    if (orderForm.items.length === 0) { toast.error('Add at least one item'); return; }

    createOrderMutation.mutate({
      supplierId: orderForm.supplierId,
      expectedDate: orderForm.expectedDate || undefined,
      discountAmount: parseFloat(orderForm.discountAmount) || 0,
      taxAmount: parseFloat(orderForm.taxAmount) || 0,
      notes: orderForm.notes || undefined,
      items: orderForm.items,
    });
  };

  const handleRecordPayment = () => {
    if (!paymentForm.supplierId) { toast.error('Select a supplier'); return; }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) { toast.error('Enter a valid amount'); return; }

    recordPaymentMutation.mutate({
      supplierId: paymentForm.supplierId,
      orderId: paymentForm.orderId || undefined,
      amount: parseFloat(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      paymentDate: paymentForm.paymentDate || undefined,
      referenceNo: paymentForm.referenceNo || undefined,
      notes: paymentForm.notes || undefined,
      recordedBy: user?.id,
    });
  };

  const openPaymentForOrder = (order: any) => {
    setPaymentForm({
      ...EMPTY_PAYMENT,
      supplierId: order.supplierId,
      orderId: order.id,
      amount: order.remainingAmount?.toString() || '',
    });
    setShowPaymentModal(true);
  };

  // ─── order subtotal ──────────────────────────────────────────────────────
  const orderSubtotal = orderForm.items.reduce((s, i) => s + i.totalCost, 0);
  const orderTotal =
    orderSubtotal -
    (parseFloat(orderForm.discountAmount) || 0) +
    (parseFloat(orderForm.taxAmount) || 0);

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Ledger</h1>
          <p className="text-gray-500 mt-1">Track stock picked on credit from suppliers & record payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setPaymentForm({ ...EMPTY_PAYMENT }); setShowPaymentModal(true); }}
            className="btn-ghost border"
          >
            <Banknote className="w-4 h-4" />
            Record Payment
          </button>
          <button
            onClick={() => { setOrderForm({ ...EMPTY_ORDER }); setShowOrderModal(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders ?? 0}</p>
          <ShoppingBag className="w-5 h-5 text-blue-400 mt-1" />
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Pending Receipt</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.pendingOrders ?? 0}</p>
          <Clock className="w-5 h-5 text-yellow-400 mt-1" />
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">To Pay (Received)</p>
          <p className="text-2xl font-bold text-orange-600">{stats?.receivedOrders ?? 0}</p>
          <CreditCard className="w-5 h-5 text-orange-400 mt-1" />
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Total Outstanding</p>
          <p className="text-lg font-bold text-red-600">{fmt(stats?.totalOutstanding ?? 0)}</p>
          <TrendingDown className="w-5 h-5 text-red-400 mt-1" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {(['orders', 'payments'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'orders' ? 'Purchase Orders' : 'Payment History'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {tab === 'orders' && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RECEIVED">Received</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}
      </div>

      {/* ─── Orders Tab ─────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No purchase orders found</p>
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order: any) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${STATUS_BADGE[order.status]}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{order.supplier?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.orderDate).toLocaleDateString('en-PK')}
                        {order.expectedDate && ` · Expected: ${new Date(order.expectedDate).toLocaleDateString('en-PK')}`}
                        {order.receivedDate && ` · Received: ${new Date(order.receivedDate).toLocaleDateString('en-PK')}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{order.items?.length ?? 0} items</p>
                    </div>

                    {/* Amounts */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{fmt(order.totalAmount)}</p>
                      {order.paidAmount > 0 && (
                        <p className="text-sm text-green-600">Paid: {fmt(order.paidAmount)}</p>
                      )}
                      {order.remainingAmount > 0 && (
                        <p className="text-sm text-red-600 font-semibold">Due: {fmt(order.remainingAmount)}</p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      onClick={() => setViewOrder(order)}
                      className="btn-ghost text-xs px-3 py-1.5 border"
                    >
                      <FileText className="w-3.5 h-3.5" /> View
                    </button>

                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => setShowReceiveModal(order)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        <Package className="w-3.5 h-3.5" /> Mark Received
                      </button>
                    )}

                    {['RECEIVED', 'PARTIALLY_PAID'].includes(order.status) && (
                      <button
                        onClick={() => openPaymentForOrder(order)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        <Banknote className="w-3.5 h-3.5" /> Pay
                      </button>
                    )}

                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          if (confirm('Cancel this order?')) cancelOrderMutation.mutate(order.id);
                        }}
                        className="btn-ghost text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={cancelOrderMutation.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Payments Tab ───────────────────────────────────────────────── */}
      {tab === 'payments' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          {paymentsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payments recorded yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {payments.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-900">{p.paymentNumber}</p>
                    <p className="text-sm text-gray-600">{p.supplier?.name}</p>
                    {p.order && (
                      <p className="text-xs text-gray-400">Order: {p.order.orderNumber}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.paymentDate).toLocaleDateString('en-PK')} · {p.paymentMethod.replace('_', ' ')}
                      {p.referenceNo && ` · Ref: ${p.referenceNo}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{fmt(p.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ Create Purchase Order Modal ══════════ */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8 max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">New Purchase Order</h2>

            <div className="space-y-4">
              {/* Supplier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={orderForm.supplierId}
                    onChange={(e) => setOrderForm({ ...orderForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Choose supplier...</option>
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={orderForm.expectedDate}
                    onChange={(e) => setOrderForm({ ...orderForm, expectedDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Items <span className="text-red-500">*</span></h3>

                {/* Add item row */}
                <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Link Product (optional)</label>
                      <select
                        value={newItem.productId}
                        onChange={(e) => handleProductSelect(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">-- Select existing product --</option>
                        {products.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Product Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={newItem.productName}
                        onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                        placeholder="e.g. PEL Refrigerator 14 Cu Ft"
                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">SKU</label>
                      <input
                        type="text"
                        value={newItem.sku}
                        onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                        placeholder="SKU code"
                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Qty <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                        min="1"
                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Unit Cost (PKR) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={newItem.unitCost}
                        onChange={(e) => setNewItem({ ...newItem, unitCost: e.target.value })}
                        placeholder="0"
                        min="0"
                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <button onClick={addItem} className="btn-primary w-full text-sm">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                {/* Items table */}
                {orderForm.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Product</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Unit Cost</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orderForm.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">
                              <p className="font-medium">{item.productName}</p>
                              {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                            </td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{fmt(item.unitCost)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{fmt(item.totalCost)}</td>
                            <td className="px-2 py-2">
                              <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                                <Minus className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Discount / Tax / Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Discount Amount (PKR)</label>
                  <input
                    type="number"
                    value={orderForm.discountAmount}
                    onChange={(e) => setOrderForm({ ...orderForm, discountAmount: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tax Amount (PKR)</label>
                  <input
                    type="number"
                    value={orderForm.taxAmount}
                    onChange={(e) => setOrderForm({ ...orderForm, taxAmount: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Any notes about this order..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Order total summary */}
              {orderForm.items.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{fmt(orderSubtotal)}</span>
                  </div>
                  {parseFloat(orderForm.discountAmount) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>- {fmt(parseFloat(orderForm.discountAmount))}</span>
                    </div>
                  )}
                  {parseFloat(orderForm.taxAmount) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>+ {fmt(parseFloat(orderForm.taxAmount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
                    <span>Total (Credit Amount)</span>
                    <span className="text-red-700">{fmt(orderTotal)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This amount will be added to the supplier's outstanding balance.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowOrderModal(false); setOrderForm({ ...EMPTY_ORDER }); }}
                className="btn-ghost flex-1"
                disabled={createOrderMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                className="btn-primary flex-1"
                disabled={createOrderMutation.isPending || !orderForm.supplierId || orderForm.items.length === 0}
              >
                {createOrderMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Record Payment Modal ══════════ */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-5">Record Supplier Payment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentForm.supplierId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, supplierId: e.target.value, orderId: '' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose supplier...</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — Due: {fmt(s.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {paymentForm.supplierId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link to Order (Optional)
                  </label>
                  <select
                    value={paymentForm.orderId}
                    onChange={(e) => {
                      const order = orders.find((o: any) => o.id === e.target.value);
                      setPaymentForm({
                        ...paymentForm,
                        orderId: e.target.value,
                        amount: order ? order.remainingAmount.toString() : paymentForm.amount,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">General payment (no specific order)</option>
                    {orders
                      .filter((o: any) => o.supplierId === paymentForm.supplierId && ['RECEIVED', 'PARTIALLY_PAID'].includes(o.status))
                      .map((o: any) => (
                        <option key={o.id} value={o.id}>
                          {o.orderNumber} — Due: {fmt(o.remainingAmount)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0"
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ref / Cheque No.
                  </label>
                  <input
                    type="text"
                    value={paymentForm.referenceNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                    placeholder="Optional reference"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Payment notes..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentForm({ ...EMPTY_PAYMENT }); }}
                className="btn-ghost flex-1"
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="btn-primary flex-1"
                disabled={recordPaymentMutation.isPending || !paymentForm.supplierId || !paymentForm.amount}
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Receive Order Confirmation Modal ══════════ */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h2 className="text-lg font-bold mb-2">Mark Order as Received?</h2>
            <p className="text-sm text-gray-600 mb-4">
              Order <strong>{showReceiveModal.orderNumber}</strong> from{' '}
              <strong>{showReceiveModal.supplier?.name}</strong>
              <br />
              Product stock will be automatically increased.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
              Total: <strong>{fmt(showReceiveModal.totalAmount)}</strong> — will be added to your outstanding balance.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReceiveModal(null)}
                className="btn-ghost flex-1"
                disabled={receiveOrderMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => receiveOrderMutation.mutate({ id: showReceiveModal.id })}
                className="btn-primary flex-1"
                disabled={receiveOrderMutation.isPending}
              >
                {receiveOrderMutation.isPending ? 'Updating...' : (
                  <><CheckCircle className="w-4 h-4" /> Confirm Received</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ View Order Detail Modal ══════════ */}
      {viewOrder && orderDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{orderDetail.orderNumber}</h2>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${STATUS_BADGE[orderDetail.status]}`}>
                  {orderDetail.status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setViewOrder(null)} className="btn-ghost p-2">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Supplier:</span> <strong>{orderDetail.supplier?.name}</strong></div>
              <div><span className="text-gray-500">Order Date:</span> {new Date(orderDetail.orderDate).toLocaleDateString('en-PK')}</div>
              {orderDetail.expectedDate && (
                <div><span className="text-gray-500">Expected:</span> {new Date(orderDetail.expectedDate).toLocaleDateString('en-PK')}</div>
              )}
              {orderDetail.receivedDate && (
                <div><span className="text-gray-500">Received:</span> {new Date(orderDetail.receivedDate).toLocaleDateString('en-PK')}</div>
              )}
            </div>

            {/* Items */}
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">Items</h3>
            <div className="border rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Cost</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orderDetail.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.productName}</p>
                        {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                      </td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{fmt(item.unitCost)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="text-sm space-y-1 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(orderDetail.subtotal)}</span></div>
              {orderDetail.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-{fmt(orderDetail.discountAmount)}</span></div>}
              {orderDetail.taxAmount > 0 && <div className="flex justify-between"><span>Tax</span><span>+{fmt(orderDetail.taxAmount)}</span></div>}
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{fmt(orderDetail.totalAmount)}</span></div>
              <div className="flex justify-between text-green-600"><span>Paid</span><span>{fmt(orderDetail.paidAmount)}</span></div>
              <div className="flex justify-between font-bold text-red-600"><span>Remaining</span><span>{fmt(orderDetail.remainingAmount)}</span></div>
            </div>

            {/* Payment history */}
            {orderDetail.payments?.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Payment History</h3>
                <div className="space-y-2 mb-4">
                  {orderDetail.payments.map((pmt: any) => (
                    <div key={pmt.id} className="flex justify-between text-sm p-2 bg-green-50 rounded">
                      <span className="text-gray-600">
                        {pmt.paymentNumber} · {new Date(pmt.paymentDate).toLocaleDateString('en-PK')} · {pmt.paymentMethod.replace('_', ' ')}
                        {pmt.referenceNo && ` · ${pmt.referenceNo}`}
                      </span>
                      <span className="font-semibold text-green-700">{fmt(pmt.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {['RECEIVED', 'PARTIALLY_PAID'].includes(orderDetail.status) && (
                <button onClick={() => { openPaymentForOrder(orderDetail); setViewOrder(null); }} className="btn-primary flex-1">
                  <Banknote className="w-4 h-4" /> Pay Now
                </button>
              )}
              <button onClick={() => setViewOrder(null)} className="btn-ghost flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
