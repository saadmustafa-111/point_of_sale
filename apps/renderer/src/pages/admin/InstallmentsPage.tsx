import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { installmentsService, salesService } from '../../services';
import {
  CreditCard, DollarSign, AlertCircle, CheckCircle, Clock,
  Calendar, Plus, X, ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:    'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DEFAULTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const PMT_BADGE: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  PAID:     'bg-green-100 text-green-700',
  OVERDUE:  'bg-red-100 text-red-700',
  PARTIAL:  'bg-orange-100 text-orange-700',
};

// ── Create Plan Modal ──────────────────────────────────────────────────────────
function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [downPayment, setDownPayment] = useState('');
  const [months, setMonths] = useState('6');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-all'],
    queryFn: () => salesService.getAll(),
  });

  const filtered = (sales as any[]).filter((s: any) =>
    s.invoiceNumber?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    s.customer?.name?.toLowerCase().includes(invoiceSearch.toLowerCase())
  ).slice(0, 6);

  const downNum   = parseFloat(downPayment) || 0;
  const monthsNum = parseInt(months) || 1;
  const remaining = selectedSale ? Math.max(0, selectedSale.total - downNum) : 0;
  const monthly   = monthsNum > 0 ? +(remaining / monthsNum).toFixed(2) : 0;

  const mut = useMutation({
    mutationFn: () => installmentsService.createPlan({
      saleId: selectedSale.id,
      totalAmount: selectedSale.total,
      downPayment: downNum,
      monthlyAmount: monthly,
      installments: monthsNum,
      startDate,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installment-plans'] });
      toast.success('Installment plan created!');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create plan'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 my-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Create Installment Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Step 1: Pick a sale */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Step 1 — Select Sale (by Invoice # or Customer Name)
          </label>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={e => { setInvoiceSearch(e.target.value); setSelectedSale(null); }}
              placeholder="Search invoice number or customer..."
              className="flex-1 outline-none text-sm"
            />
          </div>
          {invoiceSearch && !selectedSale && filtered.length > 0 && (
            <div className="border rounded-lg mt-1 divide-y shadow-sm">
              {filtered.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSale(s); setInvoiceSearch(s.invoiceNumber); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm"
                >
                  <span className="font-semibold text-gray-800">{s.invoiceNumber}</span>
                  <span className="text-gray-500 ml-2">{s.customer?.name || 'Walk-in'}</span>
                  <span className="text-blue-600 font-semibold ml-2">{fmt(s.total)}</span>
                </button>
              ))}
            </div>
          )}
          {selectedSale && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-gray-800">{selectedSale.invoiceNumber}</p>
                  <p className="text-gray-600">{selectedSale.customer?.name || 'Walk-in'}</p>
                </div>
                <p className="text-blue-700 font-bold text-base">{fmt(selectedSale.total)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Plan details */}
        {selectedSale && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700">Step 2 — Plan Details</p>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Down Payment (PKR) — paid today</label>
              <input
                type="number"
                value={downPayment}
                onChange={e => setDownPayment(e.target.value)}
                min="0"
                max={selectedSale.total}
                placeholder="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-2">Monthly Installments</label>
              <div className="flex gap-2 flex-wrap">
                {[3, 6, 9, 12, 18, 24].map(m => (
                  <button
                    key={m}
                    onClick={() => setMonths(String(m))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      months === String(m)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={months}
                onChange={e => setMonths(e.target.value)}
                min="1"
                max="60"
                className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Custom months"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">First Installment Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Sale Total</span><span className="font-semibold">{fmt(selectedSale.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Down Payment</span><span className="font-semibold text-green-600">{fmt(downNum)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">On Credit</span><span className="font-semibold text-orange-600">{fmt(remaining)}</span></div>
              <div className="flex justify-between border-t pt-2 font-bold text-blue-700">
                <span>Monthly × {monthsNum}</span>
                <span className="text-base">{fmt(monthly)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={!selectedSale || mut.isPending || monthsNum < 1}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm"
          >
            {mut.isPending ? 'Creating...' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Record Payment Modal ──────────────────────────────────────────────────────
function RecordPaymentModal({ plan, onClose }: { plan: any; onClose: () => void }) {
  const qc = useQueryClient();
  // Find next pending/overdue payment
  const nextPmt = plan.payments?.find((p: any) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(p.status));
  const [installmentNo, setInstallmentNo] = useState(nextPmt?.installmentNo ?? 1);
  const [amount, setAmount] = useState(nextPmt?.amount?.toString() ?? '');
  const [notes, setNotes] = useState('');

  const mut = useMutation({
    mutationFn: () => installmentsService.recordPayment({ planId: plan.id, installmentNo, paidAmount: parseFloat(amount), notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installment-plans'] });
      qc.invalidateQueries({ queryKey: ['installment-plan-detail', plan.id] });
      qc.invalidateQueries({ queryKey: ['overdue-payments'] });
      toast.success('Payment recorded!');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Record Payment</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
          <p className="font-semibold text-gray-800">{plan.sale?.customer?.name || 'Walk-in'}</p>
          <p className="text-gray-600">{plan.sale?.invoiceNumber} · Monthly: {fmt(plan.monthlyAmount)}</p>
          <p className="text-red-600 font-semibold mt-1">Remaining: {fmt(plan.remainingAmount ?? 0)}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Installment #</label>
            <select
              value={installmentNo}
              onChange={e => {
                const no = parseInt(e.target.value);
                setInstallmentNo(no);
                const pmt = plan.payments?.find((p: any) => p.installmentNo === no);
                if (pmt) setAmount(pmt.amount.toString());
              }}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {plan.payments?.filter((p: any) => p.status !== 'PAID').map((p: any) => (
                <option key={p.installmentNo} value={p.installmentNo}>
                  #{p.installmentNo} — Due {new Date(p.dueDate).toLocaleDateString('en-PK')} ({p.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Amount (PKR)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Cash payment"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !amount}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm"
          >
            {mut.isPending ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InstallmentsPage() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['installment-plans'],
    queryFn: () => installmentsService.getAll(),
  });

  const { data: overdue = [] } = useQuery({
    queryKey: ['overdue-payments'],
    queryFn: () => installmentsService.getOverdue(),
  });

  // Load full detail when expanded
  const { data: planDetail } = useQuery({
    queryKey: ['installment-plan-detail', expandedPlan],
    queryFn: () => installmentsService.getPlan(expandedPlan!),
    enabled: !!expandedPlan,
  });

  const filteredPlans = (plans as any[]).filter((plan: any) => {
    const matchTab =
      activeTab === 'all' ? true :
      activeTab === 'active' ? plan.status === 'ACTIVE' :
      activeTab === 'overdue' ? (plan.status === 'ACTIVE' && overdue.some((od: any) => od.planId === plan.id)) :
      plan.status === 'COMPLETED';
    const matchSearch = !searchText ||
      plan.sale?.invoiceNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      plan.sale?.customer?.name?.toLowerCase().includes(searchText.toLowerCase());
    return matchTab && matchSearch;
  });

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
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Installment Plans</h1>
          <p className="text-gray-500 mt-1">Track monthly payments from customers buying on credit</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {/* Tip */}
      <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        💡 <strong>Tip:</strong> Plans are auto-created when cashier selects "Installment" at POS checkout. You can also create one manually here using "New Plan".
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Total Plans</p>
          <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
          <CreditCard className="w-5 h-5 text-blue-400 mt-1" />
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-blue-600">{(plans as any[]).filter((p: any) => p.status === 'ACTIVE').length}</p>
          <Clock className="w-5 h-5 text-blue-400 mt-1" />
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Overdue Payments</p>
          <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
          <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{(plans as any[]).filter((p: any) => p.status === 'COMPLETED').length}</p>
          <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="bg-white rounded-lg border mb-4">
        <div className="flex items-center gap-3 p-3 border-b">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search by invoice # or customer name..."
            className="flex-1 text-sm outline-none"
          />
        </div>
        <div className="flex gap-1 px-4 border-b">
          {(['all', 'active', 'overdue', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}{tab === 'overdue' && overdue.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{overdue.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Plan List */}
        <div className="divide-y">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No installment plans found</p>
            </div>
          ) : (
            filteredPlans.map((plan: any) => {
              const paidCount = plan.payments?.filter((p: any) => p.status === 'PAID').length ?? 0;
              const totalPaid = plan.downPayment + (plan.payments?.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + (p.paidAmount ?? p.amount), 0) ?? 0);
              const remaining = Math.max(0, plan.totalAmount - totalPaid);
              const progress = plan.installments > 0 ? (paidCount / plan.installments) * 100 : 0;
              const isExpanded = expandedPlan === plan.id;
              const detail = isExpanded ? planDetail : null;

              return (
                <div key={plan.id} className="p-4">
                  {/* Plan Header */}
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{plan.sale?.invoiceNumber}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${STATUS_BADGE[plan.status]}`}>
                          {plan.status}
                        </span>
                        {overdue.some((od: any) => od.planId === plan.id) && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700">⚠ OVERDUE</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{plan.sale?.customer?.name || 'Walk-in Customer'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Started: {new Date(plan.startDate).toLocaleDateString('en-PK')} ·
                        Ends: {new Date(plan.endDate).toLocaleDateString('en-PK')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{fmt(plan.totalAmount)}</p>
                      <p className="text-sm text-green-600">Paid: {fmt(plan.downPayment + paidCount * plan.monthlyAmount)}</p>
                      {plan.remainingAmount > 0 && (
                        <p className="text-sm text-red-600 font-semibold">Due: {fmt(plan.remainingAmount)}</p>
                      )}
                    </div>
                  </div>

                  {/* Plan Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <div><p className="text-xs text-gray-500">Down Payment</p><p className="font-semibold">{fmt(plan.downPayment)}</p></div>
                    <div><p className="text-xs text-gray-500">Monthly</p><p className="font-semibold">{fmt(plan.monthlyAmount)}</p></div>
                    <div><p className="text-xs text-gray-500">Installments</p><p className="font-semibold">{paidCount} / {plan.installments} paid</p></div>
                    <div><p className="text-xs text-gray-500">Remaining</p><p className="font-semibold text-orange-600">{fmt(plan.remainingAmount ?? 0)}</p></div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {plan.status === 'ACTIVE' && (
                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isExpanded) { setExpandedPlan(null); }
                        else { setExpandedPlan(plan.id); }
                      }}
                      className="btn-ghost text-xs px-4 py-2 border"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? 'Hide Schedule' : 'View Schedule'}
                    </button>
                  </div>

                  {/* Payment Schedule (expanded) */}
                  {isExpanded && (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Due Date</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-center">Status</th>
                            <th className="px-3 py-2 text-left">Paid On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(detail?.payments ?? plan.payments ?? []).map((pmt: any) => (
                            <tr key={pmt.id} className={pmt.status === 'OVERDUE' ? 'bg-red-50' : pmt.status === 'PAID' ? 'bg-green-50' : ''}>
                              <td className="px-3 py-2 font-semibold text-gray-700">#{pmt.installmentNo}</td>
                              <td className="px-3 py-2 text-gray-600">{new Date(pmt.dueDate).toLocaleDateString('en-PK')}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(pmt.amount)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${PMT_BADGE[pmt.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                  {pmt.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-400 text-xs">
                                {pmt.paidAt ? new Date(pmt.paidAt).toLocaleDateString('en-PK') : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && <CreatePlanModal onClose={() => setShowCreateModal(false)} />}
      {selectedPlan && <RecordPaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
    </div>
  );
}
