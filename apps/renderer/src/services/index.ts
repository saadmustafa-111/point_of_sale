import api from './api';

export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then((r) => r.data),

  getProfile: () => api.get('/auth/profile').then((r) => r.data),
};

export const usersService = {
  getAll: ()                    => api.get('/users').then((r) => r.data),
  getOne: (id: string)          => api.get(`/users/${id}`).then((r) => r.data),
  create: (data: any)           => api.post('/users', data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then((r) => r.data),
  delete: (id: string)          => api.delete(`/users/${id}`).then((r) => r.data),
};

export const categoriesService = {
  getAll: ()                    => api.get('/categories').then((r) => r.data),
  create: (data: any)           => api.post('/categories', data).then((r) => r.data),
  update: (id: string, d: any)  => api.put(`/categories/${id}`, d).then((r) => r.data),
  delete: (id: string)          => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const brandsService = {
  getAll: ()                    => api.get('/brands').then((r) => r.data),
  create: (data: any)           => api.post('/brands', data).then((r) => r.data),
  update: (id: string, d: any)  => api.put(`/brands/${id}`, d).then((r) => r.data),
  delete: (id: string)          => api.delete(`/brands/${id}`).then((r) => r.data),
};

export const productsService = {
  getAll: (search?: string)     => api.get('/products', { params: { search } }).then((r) => r.data),
  getOne: (id: string)          => api.get(`/products/${id}`).then((r) => r.data),
  getByBarcode: (code: string)  => api.get(`/products/barcode/${code}`).then((r) => r.data),
  getLowStock: ()               => api.get('/products/low-stock').then((r) => r.data),
  create: (data: any)           => api.post('/products', data).then((r) => r.data),
  update: (id: string, d: any)  => api.put(`/products/${id}`, d).then((r) => r.data),
  delete: (id: string)          => api.delete(`/products/${id}`).then((r) => r.data),
};

export const customersService = {
  getAll: (search?: string)     => api.get('/customers', { params: { search } }).then((r) => r.data),
  create: (data: any)           => api.post('/customers', data).then((r) => r.data),
  update: (id: string, d: any)  => api.put(`/customers/${id}`, d).then((r) => r.data),
};

export const salesService = {
  getAll: ()                    => api.get('/sales').then((r) => r.data),
  getOne: (id: string)          => api.get(`/sales/${id}`).then((r) => r.data),
  create: (data: any)           => api.post('/sales', data).then((r) => r.data),
  deleteAll: ()                 => api.delete('/sales').then((r) => r.data),
};

export const inventoryService = {
  getAll: (productId?: string)  => api.get('/inventory', { params: { productId } }).then((r) => r.data),
  create: (data: any)           => api.post('/inventory', data).then((r) => r.data),
};

export const reportsService = {
  daily: (date: string)         => api.get('/reports/daily', { params: { date } }).then((r) => r.data),
  monthly: (year: number, month: number) =>
    api.get('/reports/monthly', { params: { year, month } }).then((r) => r.data),
  topProducts: (limit?: number) => api.get('/reports/top-products', { params: { limit } }).then((r) => r.data),
  lowStock: ()                  => api.get('/reports/low-stock').then((r) => r.data),
  cashierSales: (s?: string, e?: string) =>
    api.get('/reports/cashier-sales', { params: { startDate: s, endDate: e } }).then((r) => r.data),
};

export const settingsService = {
  getAll: ()                             => api.get('/settings').then((r) => r.data),
  set: (key: string, value: string)      => api.put(`/settings/${key}`, { value }).then((r) => r.data),
  bulk: (entries: {key:string;value:string}[]) => api.put('/settings', { entries }).then((r) => r.data),
};

// ── Installments ──────────────────────────────────────────────────────────────
export const installmentsService = {
  createPlan: (data: any)        => api.post('/installments/plans', data).then((r) => r.data),
  getAll: (status?: string)      => api.get('/installments/plans', { params: { status } }).then((r) => r.data),
  getPlan: (id: string)          => api.get(`/installments/plans/${id}`).then((r) => r.data),
  getPlanBySale: (saleId: string) => api.get(`/installments/plans/sale/${saleId}`).then((r) => r.data),
  recordPayment: (data: any)     => api.post('/installments/payments', data).then((r) => r.data),
  updatePlan: (id: string, d: any) => api.put(`/installments/plans/${id}`, d).then((r) => r.data),
  getOverdue: ()                 => api.get('/installments/overdue').then((r) => r.data),
  getUpcoming: (days?: number)   => api.get('/installments/upcoming', { params: { days } }).then((r) => r.data),
  markOverdue: ()                => api.post('/installments/mark-overdue').then((r) => r.data),
};

// ── Returns & Exchanges ───────────────────────────────────────────────────────
export const returnsService = {
  create: (data: any)            => api.post('/returns', data).then((r) => r.data),
  getAll: (status?: string, type?: string) => 
    api.get('/returns', { params: { status, type } }).then((r) => r.data),
  getOne: (id: string)           => api.get(`/returns/${id}`).then((r) => r.data),
  update: (id: string, d: any)   => api.put(`/returns/${id}`, d).then((r) => r.data),
  approve: (id: string, approvedBy: string) => 
    api.post(`/returns/${id}/approve`, { approvedBy }).then((r) => r.data),
  reject: (id: string, approvedBy: string, notes?: string) => 
    api.post(`/returns/${id}/reject`, { approvedBy, notes }).then((r) => r.data),
  complete: (id: string)         => api.post(`/returns/${id}/complete`).then((r) => r.data),
};

// ── Service & Repair ──────────────────────────────────────────────────────────
export const serviceService = {
  createJob: (data: any)         => api.post('/service/jobs', data).then((r) => r.data),
  getAll: (status?: string, priority?: string) => 
    api.get('/service/jobs', { params: { status, priority } }).then((r) => r.data),
  getJob: (id: string)           => api.get(`/service/jobs/${id}`).then((r) => r.data),
  updateJob: (id: string, d: any) => api.put(`/service/jobs/${id}`, d).then((r) => r.data),
  addParts: (data: any)          => api.post('/service/parts', data).then((r) => r.data),
  addCharges: (data: any)        => api.post('/service/charges', data).then((r) => r.data),
  getByCustomer: (customerId: string) => api.get(`/service/customer/${customerId}`).then((r) => r.data),
  getStats: ()                   => api.get('/service/stats').then((r) => r.data),
};

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const suppliersService = {
  getAll: (search?: string)      => api.get('/suppliers', { params: { search } }).then((r) => r.data),
  getOne: (id: string)           => api.get(`/suppliers/${id}`).then((r) => r.data),
  getSummary: ()                 => api.get('/suppliers/summary').then((r) => r.data),
  create: (data: any)            => api.post('/suppliers', data).then((r) => r.data),
  update: (id: string, d: any)   => api.put(`/suppliers/${id}`, d).then((r) => r.data),
};

// ── Purchases (Purchase Orders + Supplier Payments) ───────────────────────────
export const purchasesService = {
  // Orders
  createOrder: (data: any)       => api.post('/purchases/orders', data).then((r) => r.data),
  getOrders: (supplierId?: string, status?: string) =>
    api.get('/purchases/orders', { params: { supplierId, status } }).then((r) => r.data),
  getOrder: (id: string)         => api.get(`/purchases/orders/${id}`).then((r) => r.data),
  receiveOrder: (id: string, data: any) => api.post(`/purchases/orders/${id}/receive`, data).then((r) => r.data),
  cancelOrder: (id: string)      => api.post(`/purchases/orders/${id}/cancel`).then((r) => r.data),
  // Payments
  recordPayment: (data: any)     => api.post('/purchases/payments', data).then((r) => r.data),
  getPayments: (supplierId?: string, orderId?: string) =>
    api.get('/purchases/payments', { params: { supplierId, orderId } }).then((r) => r.data),
  // Stats
  getStats: ()                   => api.get('/purchases/stats').then((r) => r.data),
};
