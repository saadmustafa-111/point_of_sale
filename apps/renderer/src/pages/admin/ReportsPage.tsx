import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../services';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart2, Calendar, TrendingUp, Package, Users } from 'lucide-react';

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [tab, setTab] = useState<'daily' | 'monthly' | 'top' | 'cashier'>('daily');
  const [date, setDate] = useState(today);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const { data: daily }   = useQuery({ queryKey: ['rep-daily', date],        queryFn: () => reportsService.daily(date),          enabled: tab === 'daily'   });
  const { data: monthly } = useQuery({ queryKey: ['rep-monthly', year, month], queryFn: () => reportsService.monthly(year, month), enabled: tab === 'monthly' });
  const { data: top }     = useQuery({ queryKey: ['rep-top'],                queryFn: () => reportsService.topProducts(10),       enabled: tab === 'top'     });
  const { data: cashier } = useQuery({ queryKey: ['rep-cashier'],            queryFn: () => reportsService.cashierSales(),        enabled: tab === 'cashier' });

  const tabs = [
    { key: 'daily',   label: 'Daily',        icon: Calendar   },
    { key: 'monthly', label: 'Monthly',       icon: TrendingUp },
    { key: 'top',     label: 'Top Products',  icon: Package    },
    { key: 'cashier', label: 'Cashier-wise',  icon: Users      },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Analyse sales performance and trends</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Daily */}
      {tab === 'daily' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" className="pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          {daily && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Orders',    value: daily.count,                                          color: 'text-slate-800',   bg: 'bg-blue-50',   iconBg: 'text-blue-600' },
                { label: 'Revenue',         value: `PKR ${(daily.total ?? 0).toLocaleString()}`,         color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'text-emerald-600' },
                { label: 'Avg Order Value', value: `PKR ${daily.count ? Math.round(daily.total / daily.count).toLocaleString() : 0}`, color: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'text-purple-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}
          {!daily && <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 shadow-sm">No data for selected date</div>}
        </div>
      )}

      {/* Monthly */}
      {tab === 'monthly' && (
        <div className="space-y-5">
          <div className="flex gap-3">
            <input type="number" className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-28" value={year} onChange={e => setYear(+e.target.value)} min={2020} max={2030} />
            <select className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-40" value={month} onChange={e => setMonth(+e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
            </select>
          </div>
          {monthly && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Monthly Revenue</p>
                <p className="text-3xl font-extrabold text-emerald-600">PKR {(monthly.total ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Total Sales</p>
                <p className="text-3xl font-extrabold text-blue-600">{monthly.count}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Products */}
      {tab === 'top' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-700">Top 10 Products by Quantity Sold</h2>
          </div>
          {top ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={(top as any[]).map((p: any) => ({ name: p.product?.name?.slice(0, 16), qty: p.totalQty }))} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="qty" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400 py-8">No sales data available</p>}
        </div>
      )}

      {/* Cashier-wise */}
      {tab === 'cashier' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-700">Sales by Cashier</h2>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['#', 'Cashier', 'Sales Count', 'Total Revenue'].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {cashier ? (cashier as any[]).map((c: any, idx: number) => (
                <tr key={c.cashier.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">{c.cashier.fullName.charAt(0)}</div>
                      <span className="font-semibold text-slate-800">{c.cashier.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{c.count}</td>
                  <td className="px-5 py-4 font-bold text-emerald-600">PKR {(c.total ?? 0).toLocaleString()}</td>
                </tr>
              )) : <tr><td colSpan={4} className="text-center py-8 text-slate-400">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
