import { useQuery } from '@tanstack/react-query';
import { reportsService, salesService } from '../../services';
import {
  ShoppingCart, TrendingUp, AlertTriangle, Package,
  ArrowUpRight, ReceiptText, Users, Clock,
} from 'lucide-react';

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, gradient, iconBg }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-sm border border-white/60 ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/40" />
      </div>
      <p className="text-xs font-medium text-white/70 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-white leading-none">{value ?? '—'}</p>
      {sub && <p className="text-xs text-white/60 mt-1.5">{sub}</p>}
    </div>
  );
}

// ── Recent Sale Row ──────────────────────────────────────────────────────────
function SaleRow({ sale }: { sale: any }) {
  const pmColors: Record<string, string> = {
    CASH: 'bg-emerald-100 text-emerald-700',
    CARD: 'bg-blue-100 text-blue-700',
    BANK_TRANSFER: 'bg-purple-100 text-purple-700',
    INSTALLMENT: 'bg-amber-100 text-amber-700',
  };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        <ReceiptText className="w-4 h-4 text-primary-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-none">{sale.invoiceNumber}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{sale.cashier?.fullName} · {sale.customer?.name || 'Walk-in'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-slate-800">PKR {sale.total?.toLocaleString()}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${pmColors[sale.paymentMethod] || 'bg-slate-100 text-slate-600'}`}>
          {sale.paymentMethod?.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

// ── Top Product Bar ──────────────────────────────────────────────────────────
function ProductBar({ name, qty, max, rank }: { name: string; qty: number; max: number; rank: number }) {
  const pct = max > 0 ? Math.round((qty / max) * 100) : 0;
  const colors = ['bg-primary-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-400'];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium truncate max-w-[180px]">
          <span className="text-slate-400 mr-1.5">#{rank}</span>{name}
        </span>
        <span className="text-slate-700 font-bold ml-2">{qty} sold</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colors[rank - 1] || 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const now   = new Date();
  // Use LOCAL date (not UTC) so the backend queries the correct calendar day
  const today  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const { data: daily }    = useQuery({ queryKey: ['daily', today], queryFn: () => reportsService.daily(today) });
  const { data: lowStock } = useQuery({ queryKey: ['lowStock'], queryFn: reportsService.lowStock });
  const { data: topProds } = useQuery({ queryKey: ['topProds'], queryFn: () => reportsService.topProducts(5) });
  const { data: allSales = [] } = useQuery({ queryKey: ['sales'], queryFn: salesService.getAll });

  const recentSales = (allSales as any[]).slice(0, 6);
  const maxQty = topProds?.[0]?.totalQty || 1;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">{greeting}, Admin 👋</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {now.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          Live data
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Today's Sales"
          value={daily?.count ?? 0}
          sub={`${daily?.itemsSold ?? 0} items sold`}
          gradient="bg-gradient-to-br from-blue-600 to-blue-500"
          iconBg="bg-blue-700"
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Revenue"
          value={`PKR ${(daily?.total ?? 0).toLocaleString()}`}
          sub={`Disc: PKR ${(daily?.discount ?? 0).toLocaleString()}`}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-500"
          iconBg="bg-emerald-700"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={lowStock?.length ?? 0}
          sub={lowStock?.length ? 'Needs restock soon' : 'All stocked well'}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          iconBg="bg-amber-600"
        />
        <StatCard
          icon={Package}
          label="Top Product"
          value={topProds?.[0]?.product?.name ?? 'No data'}
          sub={topProds?.[0] ? `${topProds[0].totalQty} units sold` : 'Make your first sale'}
          gradient="bg-gradient-to-br from-purple-600 to-violet-500"
          iconBg="bg-purple-700"
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Sales */}
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
                <ReceiptText className="w-3.5 h-3.5 text-primary-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-700">Recent Sales</h2>
            </div>
            <span className="text-xs text-slate-400">{(allSales as any[]).length} total</span>
          </div>
          <div className="px-5 pb-2">
            {recentSales.length ? (
              recentSales.map((s: any) => <SaleRow key={s.id} sale={s} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No sales yet today</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-700">Top Products</h2>
          </div>
          <div className="px-5 py-4 space-y-3.5">
            {topProds?.length ? (
              topProds.map((p: any, i: number) => (
                <ProductBar key={p.product?.id} name={p.product?.name} qty={p.totalQty} max={maxQty} rank={i + 1} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Package className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No sales data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Low Stock Alerts */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-700">Low Stock Alerts</h2>
            </div>
            {lowStock?.length > 0 && (
              <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{lowStock.length} items</span>
            )}
          </div>
          <div className="px-5 py-3">
            {lowStock?.length ? (
              <ul className="divide-y divide-slate-100">
                {(lowStock as any[]).slice(0, 6).map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{p.name}</span>
                    </div>
                    <span className="badge-danger ml-3 shrink-0">{p.stock} left</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-3 py-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-500">All products are well stocked.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-700">Today's Summary</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { label: 'Transactions',       value: daily?.count ?? 0,                          color: 'bg-blue-500' },
              { label: 'Items Sold',         value: daily?.itemsSold ?? 0,                      color: 'bg-emerald-500' },
              { label: 'Total Revenue',      value: `PKR ${(daily?.total ?? 0).toLocaleString()}`, color: 'bg-purple-500' },
              { label: 'Total Discount',     value: `PKR ${(daily?.discount ?? 0).toLocaleString()}`, color: 'bg-amber-500' },
              { label: 'Net (after disc.)',  value: `PKR ${((daily?.total ?? 0) - (daily?.discount ?? 0)).toLocaleString()}`, color: 'bg-blue-600' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${row.color}`} />
                  <span className="text-sm text-slate-500">{row.label}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
