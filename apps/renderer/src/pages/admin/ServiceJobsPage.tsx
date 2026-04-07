import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceService, customersService, productsService, usersService } from '../../services';
import { Wrench, Clock, CheckCircle, AlertTriangle, User, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServiceJobsPage() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create job form state
  const [newJob, setNewJob] = useState({
    customerId: '',
    productId: '',
    serialNumber: '',
    issue: '',
    priority: 'NORMAL',
    warrantyStatus: 'OUT_OF_WARRANTY',
    technicianId: '',
    estimatedCost: '',
  });

  // Fetch customers, products, and technicians for create form
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersService.getAll(),
    enabled: showCreateModal,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
    enabled: showCreateModal,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
    enabled: showCreateModal,
  });

  // Fetch all service jobs
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['service-jobs'],
    queryFn: () => serviceService.getAll(),
  });

  // Fetch service stats
  const { data: stats } = useQuery({
    queryKey: ['service-stats'],
    queryFn: () => serviceService.getStats(),
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      serviceService.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['service-stats'] });
      toast.success('Service job updated successfully');
      setSelectedJob(null);
      setUpdateStatus('');
      setUpdateNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update job');
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (data: any) => serviceService.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['service-stats'] });
      toast.success('Service job created successfully');
      setShowCreateModal(false);
      setNewJob({
        customerId: '',
        productId: '',
        serialNumber: '',
        issue: '',
        priority: 'NORMAL',
        warrantyStatus: 'OUT_OF_WARRANTY',
        technicianId: '',
        estimatedCost: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create job');
    },
  });

  const handleCreateJob = () => {
    if (!newJob.customerId || !newJob.issue) {
      toast.error('Please fill in required fields (Customer and Issue)');
      return;
    }

    const jobData: any = {
      customerId: newJob.customerId,
      issue: newJob.issue,
      priority: newJob.priority,
      warrantyStatus: newJob.warrantyStatus,
    };

    if (newJob.productId) jobData.productId = newJob.productId;
    if (newJob.serialNumber) jobData.serialNumber = newJob.serialNumber;
    if (newJob.technicianId) jobData.technicianId = newJob.technicianId;
    if (newJob.estimatedCost) jobData.estimatedCost = parseFloat(newJob.estimatedCost);

    createJobMutation.mutate(jobData);
  };

  const handleUpdateJob = () => {
    if (!selectedJob || !updateStatus) return;

    const updateData: any = { status: updateStatus };
    if (updateNotes) {
      updateData.solution = updateNotes;
    }
    if (updateStatus === 'COMPLETED') {
      updateData.completedDate = new Date().toISOString();
    }

    updateJobMutation.mutate({ id: selectedJob.id, data: updateData });
  };

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter((job: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return job.status === 'PENDING' || job.status === 'DIAGNOSED';
    if (activeTab === 'in-progress') return job.status === 'IN_PROGRESS' || job.status === 'PARTS_ORDERED';
    if (activeTab === 'completed') return job.status === 'COMPLETED' || job.status === 'DELIVERED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      DIAGNOSED: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-purple-100 text-purple-700',
      PARTS_ORDERED: 'bg-orange-100 text-orange-700',
      COMPLETED: 'bg-green-100 text-green-700',
      DELIVERED: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status as keyof typeof styles] || styles.PENDING}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-700',
      NORMAL: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[priority as keyof typeof styles] || styles.NORMAL}`}>
        {priority}
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service & Repair Jobs</h1>
          <p className="text-gray-600 mt-1">Manage service requests and repair jobs</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Service Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {jobs.filter((j: any) => j.status === 'PENDING' || j.status === 'DIAGNOSED').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">
                {jobs.filter((j: any) => j.status === 'IN_PROGRESS' || j.status === 'PARTS_ORDERED').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {jobs.filter((j: any) => j.status === 'COMPLETED' || j.status === 'DELIVERED').length}
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
            {['all', 'pending', 'in-progress', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="p-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No service jobs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job: any) => (
                <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Job #{job.jobNumber}
                        </h3>
                        {getStatusBadge(job.status)}
                        {getPriorityBadge(job.priority)}
                        {job.warrantyStatus === 'IN_WARRANTY' && (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">
                            WARRANTY
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Customer: {job.customer?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Product: {job.product?.name || 'N/A'} 
                        {job.serialNumber && ` • S/N: ${job.serialNumber}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {job.estimatedCost && (
                        <div>
                          <p className="text-sm text-gray-600">Est. Cost</p>
                          <p className="text-xl font-bold text-gray-900">
                            PKR {job.estimatedCost?.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">Issue:</p>
                    <p className="text-sm text-gray-600">{job.issue}</p>
                    {job.diagnosis && (
                      <>
                        <p className="text-sm font-medium text-gray-700 mt-2 mb-1">Diagnosis:</p>
                        <p className="text-sm text-gray-600">{job.diagnosis}</p>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    {job.technician && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Technician: {job.technician.fullName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Received: {new Date(job.receivedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Parts and Charges */}
                  {(job.parts?.length > 0 || job.charges?.length > 0) && (
                    <div className="mb-3 p-3 bg-blue-50 rounded text-sm">
                      {job.parts?.length > 0 && (
                        <p className="text-gray-700">
                          Parts: {job.parts.length} item(s)
                        </p>
                      )}
                      {job.charges?.length > 0 && (
                        <p className="text-gray-700">
                          Charges: {job.charges.length} item(s)
                        </p>
                      )}
                      {job.actualCost && (
                        <p className="font-semibold text-gray-900 mt-1">
                          Actual Cost: PKR {job.actualCost.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {job.status !== 'COMPLETED' && job.status !== 'DELIVERED' && (
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="btn-primary w-full"
                    >
                      <Wrench className="w-4 h-4" />
                      Update Status
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Update Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Update Service Job</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Job #{selectedJob.jobNumber}</p>
              <p className="text-sm text-gray-600 mt-1">Current Status: {selectedJob.status}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select status...</option>
                <option value="PENDING">Pending</option>
                <option value="DIAGNOSED">Diagnosed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PARTS_ORDERED">Parts Ordered</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes / Solution
              </label>
              <textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Add notes about the update..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setUpdateStatus('');
                  setUpdateNotes('');
                }}
                className="btn-ghost flex-1"
                disabled={updateJobMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateJob}
                className="btn-primary flex-1"
                disabled={updateJobMutation.isPending || !updateStatus}
              >
                {updateJobMutation.isPending ? 'Updating...' : 'Update Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Service Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold mb-4">Create New Service Job</h2>
            
            <div className="space-y-4 mb-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={newJob.customerId}
                  onChange={(e) => setNewJob({ ...newJob, customerId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select customer...</option>
                  {customers.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product (Optional)
                </label>
                <select
                  value={newJob.productId}
                  onChange={(e) => setNewJob({ ...newJob, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select product...</option>
                  {products.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.brand?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number (Optional)
                </label>
                <input
                  type="text"
                  value={newJob.serialNumber}
                  onChange={(e) => setNewJob({ ...newJob, serialNumber: e.target.value })}
                  placeholder="Enter serial number..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newJob.issue}
                  onChange={(e) => setNewJob({ ...newJob, issue: e.target.value })}
                  placeholder="Describe the problem..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newJob.priority}
                    onChange={(e) => setNewJob({ ...newJob, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Warranty Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Status
                  </label>
                  <select
                    value={newJob.warrantyStatus}
                    onChange={(e) => setNewJob({ ...newJob, warrantyStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="IN_WARRANTY">In Warranty</option>
                    <option value="OUT_OF_WARRANTY">Out of Warranty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Technician Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Technician (Optional)
                  </label>
                  <select
                    value={newJob.technicianId}
                    onChange={(e) => setNewJob({ ...newJob, technicianId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select technician...</option>
                    {users.filter((u: any) => u.role === 'ADMIN' || u.role === 'CASHIER').map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Cost (PKR)
                  </label>
                  <input
                    type="number"
                    value={newJob.estimatedCost}
                    onChange={(e) => setNewJob({ ...newJob, estimatedCost: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewJob({
                    customerId: '',
                    productId: '',
                    serialNumber: '',
                    issue: '',
                    priority: 'NORMAL',
                    warrantyStatus: 'OUT_OF_WARRANTY',
                    technicianId: '',
                    estimatedCost: '',
                  });
                }}
                className="btn-ghost flex-1"
                disabled={createJobMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJob}
                className="btn-primary flex-1"
                disabled={createJobMutation.isPending || !newJob.customerId || !newJob.issue}
              >
                {createJobMutation.isPending ? 'Creating...' : 'Create Service Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
