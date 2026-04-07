import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../services';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [tab, setTab] = useState<'daily'|'monthly'|'top'|'cashier'>('daily');
  const [date, setDate] = useState(today);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()+1);

  const { data: daily }   = useQuery({ queryKey:['rep-daily',date],    queryFn: ()=>reportsService.daily(date),              enabled: tab==='daily' });
  const { data: monthly } = useQuery({ queryKey:['rep-monthly',year,month], queryFn: ()=>reportsService.monthly(year,month), enabled: tab==='monthly' });
  const { data: top }     = useQuery({ queryKey:['rep-top'],            queryFn: ()=>reportsService.topProducts(10),           enabled: tab==='top' });
  const { data: cashier } = useQuery({ queryKey:['rep-cashier'],        queryFn: ()=>reportsService.cashierSales(),             enabled: tab==='cashier' });

  const tabs = [['daily','Daily'],['monthly','Monthly'],['top','Top Products'],['cashier','Cashier-wise']] as const;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Reports</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map(([key,label])=>(
          <button key={key} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===key ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            onClick={()=>setTab(key)}>{label}</button>
        ))}
      </div>

      {tab==='daily' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="date" className="input w-48" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          {daily && (
            <div className="grid grid-cols-3 gap-4">
              <div className="card text-center"><p className="text-slate-500 text-sm">Orders</p><p className="text-2xl font-bold text-slate-800">{daily.count}</p></div>
              <div className="card text-center"><p className="text-slate-500 text-sm">Revenue</p><p className="text-2xl font-bold text-emerald-400">PKR {daily.total?.toFixed(0)}</p></div>
              <div className="card text-center"><p className="text-slate-500 text-sm">Avg Order</p><p className="text-2xl font-bold text-slate-800">PKR {daily.count ? (daily.total/daily.count).toFixed(0) : 0}</p></div>
            </div>
          )}
        </div>
      )}

      {tab==='monthly' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input type="number" className="input w-28" value={year} onChange={e=>setYear(+e.target.value)} min={2020} max={2030} />
            <select className="input w-36" value={month} onChange={e=>setMonth(+e.target.value)}>
              {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('default',{month:'long'})}</option>)}
            </select>
          </div>
          {monthly && (
            <div className="card">
              <p className="text-slate-500 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-emerald-400">PKR {monthly.total?.toLocaleString()}</p>
              <p className="text-slate-500 text-sm mt-1">{monthly.count} sales</p>
            </div>
          )}
        </div>
      )}

      {tab==='top' && top && (
        <div className="card">
          <h2 className="text-sm font-medium text-slate-500 mb-4">Top 10 Products by Quantity Sold</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top.map((p:any)=>({ name: p.product?.name?.slice(0,15), qty: p.totalQty }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:11}} />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'8px' }} />
              <Bar dataKey="qty" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab==='cashier' && cashier && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-slate-500 text-left">
              <th className="pb-2 pr-4 font-medium">Cashier</th>
              <th className="pb-2 pr-4 font-medium">Sales Count</th>
              <th className="pb-2 font-medium">Total Revenue</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {cashier.map((c:any)=>(
                <tr key={c.cashier.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 text-slate-700">{c.cashier.fullName}</td>
                  <td className="py-3 pr-4 text-slate-500">{c.count}</td>
                  <td className="py-3 text-emerald-400 font-medium">PKR {c.total?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
