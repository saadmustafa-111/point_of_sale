import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { setApiBaseUrl } from './services/api';
import { setupService } from './services';
import LoginPage from './pages/LoginPage';
import SetupWizard from './pages/SetupWizard';
import FirstAdminSetup from './pages/FirstAdminSetup';
import DashboardLayout from './layouts/DashboardLayout';

// Admin pages
import DashboardPage      from './pages/admin/DashboardPage';
import ProductsPage       from './pages/admin/ProductsPage';
import CategoriesPage     from './pages/admin/CategoriesPage';
import BrandsPage         from './pages/admin/BrandsPage';
import InventoryPage      from './pages/admin/InventoryPage';
import UsersPage          from './pages/admin/UsersPage';
import SalesAdminPage     from './pages/admin/SalesAdminPage';
import ReportsPage        from './pages/admin/ReportsPage';
import SettingsPage       from './pages/admin/SettingsPage';
import InstallmentsPage   from './pages/admin/InstallmentsPage';
import ReturnsPage        from './pages/admin/ReturnsPage';
import SuppliersPage      from './pages/admin/SuppliersPage';
import PurchasesPage      from './pages/admin/PurchasesPage';

// Cashier pages
import POSPage            from './pages/cashier/POSPage';
import MySalesPage        from './pages/cashier/MySalesPage';
import CustomersPage      from './pages/cashier/CustomersPage';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/pos" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuthStore();
  const [bootState, setBootState] = useState<'loading' | 'setup' | 'first-admin' | 'ready'>('loading');

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const checkFirstAdmin = async (mode: 'server' | 'client' | null) => {
        if (mode !== 'server' && window.electron) return false;
        const status = await setupService.status();
        return Boolean(status?.needsFirstAdmin);
      };

      if (!window.electron) {
        setApiBaseUrl('/api/v1');
        try {
          const needsFirstAdmin = await checkFirstAdmin(null);
          if (mounted) setBootState(needsFirstAdmin ? 'first-admin' : 'ready');
        } catch (_) {
          if (mounted) setBootState('ready');
        }
        return;
      }

      try {
        const [mode, apiUrl] = await Promise.all([
          window.electron.getAppMode(),
          window.electron.getApiUrl(),
        ]);

        if (!mode || !apiUrl) {
          if (mounted) setBootState('setup');
          return;
        }

        setApiBaseUrl(apiUrl);
        const needsFirstAdmin = await checkFirstAdmin(mode);
        if (mounted) setBootState(needsFirstAdmin ? 'first-admin' : 'ready');
      } catch (_) {
        if (mounted) setBootState('setup');
      }
    }

    boot();
    return () => { mounted = false; };
  }, []);

  if (bootState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (bootState === 'setup') {
    return <SetupWizard onComplete={() => window.location.reload()} />;
  }

  if (bootState === 'first-admin') {
    return <FirstAdminSetup onComplete={() => setBootState('ready')} />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/dashboard' : '/pos'} replace /> : <LoginPage />} />

      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        {/* Admin routes */}
        <Route index element={<Navigate to={user?.role === 'ADMIN' ? '/dashboard' : '/pos'} replace />} />
        <Route path="dashboard" element={<PrivateRoute adminOnly><DashboardPage /></PrivateRoute>} />
        <Route path="products"  element={<PrivateRoute adminOnly><ProductsPage /></PrivateRoute>} />
        <Route path="categories" element={<PrivateRoute adminOnly><CategoriesPage /></PrivateRoute>} />
        <Route path="brands"    element={<PrivateRoute adminOnly><BrandsPage /></PrivateRoute>} />
        <Route path="inventory" element={<PrivateRoute adminOnly><InventoryPage /></PrivateRoute>} />
        <Route path="users"     element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
        <Route path="sales"     element={<PrivateRoute adminOnly><SalesAdminPage /></PrivateRoute>} />
        <Route path="installments" element={<PrivateRoute adminOnly><InstallmentsPage /></PrivateRoute>} />
        <Route path="returns"   element={<PrivateRoute adminOnly><ReturnsPage /></PrivateRoute>} />
        <Route path="suppliers" element={<PrivateRoute adminOnly><SuppliersPage /></PrivateRoute>} />
        <Route path="purchases" element={<PrivateRoute adminOnly><PurchasesPage /></PrivateRoute>} />
        <Route path="reports"   element={<PrivateRoute adminOnly><ReportsPage /></PrivateRoute>} />
        <Route path="settings"  element={<PrivateRoute adminOnly><SettingsPage /></PrivateRoute>} />

        {/* Cashier routes */}
        <Route path="pos"       element={<PrivateRoute><POSPage /></PrivateRoute>} />
        <Route path="my-sales"  element={<PrivateRoute><MySalesPage /></PrivateRoute>} />
        <Route path="customers" element={<PrivateRoute><CustomersPage /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
