import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Layers, Warehouse,
  Users, ShoppingCart, BarChart2, Settings,
  Store, Receipt, UserPlus, LogOut, ChevronRight,
  CreditCard, RefreshCw, Building2, ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: Package,         label: 'Products' },
  { to: '/categories',icon: Tag,             label: 'Categories' },
  { to: '/brands',    icon: Layers,          label: 'Brands' },
  { to: '/inventory', icon: Warehouse,       label: 'Inventory' },
  { to: '/sales',     icon: ShoppingCart,    label: 'All Sales' },
  { to: '/installments', icon: CreditCard,   label: 'Installments' },
  { to: '/returns',   icon: RefreshCw,    label: 'Returns/Exchange' },
  { to: '/suppliers', icon: Building2,    label: 'Suppliers' },
  { to: '/purchases', icon: ShoppingBag,  label: 'Purchase Ledger' },
  { to: '/users',     icon: Users,        label: 'Users' },
  { to: '/reports',   icon: BarChart2,       label: 'Reports' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
];

const cashierLinks = [
  { to: '/pos',       icon: Store,    label: 'Point of Sale' },
  { to: '/my-sales',  icon: Receipt,  label: 'My Sales' },
  { to: '/customers', icon: UserPlus, label: 'Customers' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? adminLinks : cashierLinks;

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col bg-card border-r border-border">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">POS System</p>
            <p className="text-xs text-slate-500">Home Appliances</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
<div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs text-primary-700 font-bold uppercase">
              {user?.fullName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
