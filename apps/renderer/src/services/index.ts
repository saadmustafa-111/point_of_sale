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
