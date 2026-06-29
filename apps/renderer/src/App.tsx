import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { setApiBaseUrl } from './services/api';
import { setupService } from './services';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SetupWizard = lazy(() => import('./pages/SetupWizard'));
const FirstAdminSetup = lazy(() => import('./pages/FirstAdminSetup'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const BrandsPage = lazy(() => import('./pages/admin/BrandsPage'));
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const SalesAdminPage = lazy(() => import('./pages/admin/SalesAdminPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const InstallmentsPage = lazy(() => import('./pages/admin/InstallmentsPage'));
const ReturnsPage = lazy(() => import('./pages/admin/ReturnsPage'));
const SuppliersPage = lazy(() => import('./pages/admin/SuppliersPage'));
const PurchasesPage = lazy(() => import('./pages/admin/PurchasesPage'));
const ExpensesPage = lazy(() => import('./pages/admin/ExpensesPage'));
const POSPage = lazy(() => import('./pages/cashier/POSPage'));
const MySalesPage = lazy(() => import('./pages/cashier/MySalesPage'));
const CustomersPage = lazy(() => import('./pages/cashier/CustomersPage'));

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function AppLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuthStore();
  const [bootState, setBootState] = useState<'loading' | 'setup' | 'first-admin' | 'ready'>('loading');

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const apiUrl = window.electron?.getApiUrl ? await window.electron.getApiUrl() : '/api/v1';
        setApiBaseUrl(apiUrl || '/api/v1');
        const maxAttempts = window.electron?.platform === 'win32' ? 40 : 20;
        let status: any = null;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          try {
            status = await setupService.status();
            break;
          } catch (err) {
            if (attempt === maxAttempts - 1) throw err;
            await wait(1500);
          }
        }

        const needsFirstAdmin = Boolean(status?.needsFirstAdmin);
        if (mounted) setBootState(needsFirstAdmin ? 'first-admin' : 'ready');
      } catch (_) {
        if (mounted) setBootState('ready');
      }
    }

    boot();
    return () => { mounted = false; };
  }, []);

  if (bootState === 'loading') {
    return <AppLoader />;
  }

  if (bootState === 'first-admin') {
    return (
      <Suspense fallback={<AppLoader />}>
        <FirstAdminSetup onComplete={() => setBootState('ready')} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<AppLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/setup" element={<SetupWizard onComplete={() => setBootState('first-admin')} />} />

        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="my-sales" element={<MySalesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="sales" element={<SalesAdminPage />} />
          <Route path="installments" element={<InstallmentsPage />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
