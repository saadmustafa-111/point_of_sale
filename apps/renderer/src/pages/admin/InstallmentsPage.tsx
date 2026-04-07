import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { installmentsService } from '../../services';
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstallmentsPage() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');

  // Fetch all installment plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['installment-plans'],
    queryFn: () => installmentsService.getAll(),
  });

  // Fetch overdue payments
  const { data: overdue = [] } = useQuery({
    queryKey: ['overdue-payments'],
    queryFn: () => installmentsService.getOverdue(),
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: ({ planId, amount }: { planId: string; amount: number }) =>
      installmentsService.recordPayment({ planId, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-payments'] });
      toast.success('Payment recorded successfully');
      setSelectedPlan(null);
      setPaymentAmount('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });

  const handleRecordPayment = () => {
    if (!selectedPlan || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    recordPaymentMutation.mutate({ planId: selectedPlan.id, amount });
  };

  // Filter plans based on active tab
  const filteredPlans = plans.filter((plan: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return plan.status === 'ACTIVE';
    if (activeTab === 'overdue') return plan.status === 'ACTIVE' && overdue.some((od: any) => od.planId === plan.id);
    if (activeTab === 'completed') return plan.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      DEFAULTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status as keyof typeof styles] || styles.ACTIVE}`}>
        {status}
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
        <h1 className="text-2xl font-bold text-gray-900">Installment Management</h1>
        <p className="text-gray-600 mt-1">Manage customer installment plans and payments</p>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Installment plans are created at the POS during checkout by selecting "Installment Payment" option. 
            This page is for tracking payments and viewing plan details.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-blue-600">
                {plans.filter((p: any) => p.status === 'ACTIVE').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Payments</p>
              <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Plans</p>
              <p className="text-2xl font-bold text-green-600">
                {plans.filter((p: any) => p.status === 'COMPLETED').length}
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
            {['all', 'active', 'overdue', 'completed'].map((tab) => (
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

        {/* Plans List */}
        <div className="p-4">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No installment plans found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlans.map((plan: any) => (
                <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Plan #{plan.id.slice(-8).toUpperCase()}
                        </h3>
                        {getStatusBadge(plan.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Customer: {plan.sale?.customer?.name || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Sale #{plan.sale?.invoiceNumber} • Created: {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        PKR {plan.totalAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 p-3 bg-gray-50 rounded">
                    <div>
                      <p className="text-xs text-gray-600">Down Payment</p>
                      <p className="font-semibold">PKR {plan.downPayment?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Monthly Amount</p>
                      <p className="font-semibold">PKR {plan.monthlyAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Installments</p>
                      <p className="font-semibold">{plan.installments} months</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Remaining</p>
                      <p className="font-semibold text-blue-600">
                        PKR {plan.remainingAmount?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Payment Progress</span>
                      <span className="font-medium">
                        {plan.payments?.filter((p: any) => p.status === 'PAID').length || 0} / {plan.installments} paid
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${((plan.payments?.filter((p: any) => p.status === 'PAID').length || 0) / plan.installments) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {plan.status === 'ACTIVE' && (
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="btn-primary w-full"
                    >
                      <DollarSign className="w-4 h-4" />
                      Record Payment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Record Payment</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Plan #{selectedPlan.id.slice(-8).toUpperCase()}</p>
              <p className="text-lg font-semibold mt-1">
                Monthly Amount: PKR {selectedPlan.monthlyAmount?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Remaining: PKR {selectedPlan.remainingAmount?.toLocaleString() || 0}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount (PKR)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                step="0.01"
                min="0"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setPaymentAmount('');
                }}
                className="btn-ghost flex-1"
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="btn-primary flex-1"
                disabled={recordPaymentMutation.isPending || !paymentAmount}
              >
                {recordPaymentMutation.isPending ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
