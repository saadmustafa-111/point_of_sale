import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesService, settingsService } from '../../services';
import { Eye, Search, X, ShieldCheck, Hash, FileText, Printer } from 'lucide-react';

function InvoiceDetailModal({ sale, settings, onClose }: { sale: any; settings: any; onClose: () => void }) {
  const fmt = (n: number) => `PKR ${(n || 0).toLocaleString('en-PK')}`;
  const shopName = settings?.shop_name || 'Home Appliances Shop';
  const shopAddress = settings?.shop_address || '';
  const shopPhone = settings?.shop_phone || '';
  const footer = settings?.receipt_footer || 'Thank you for your purchase!';

  const handlePrint = () => {
    const content = document.getElementById('admin-sale-invoice')!.innerHTML;
    const html = `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNumber}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#111;padding:20px}.header{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:16px}.header h1{font-size:22px;color:#2563eb;font-weight:700}.header p{font-size:11px;color:#555}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th{background:#2563eb;color:#fff;font-size:11px;padding:6px 8px;text-align:left}td{border-bottom:1px solid #e5e7eb;padding:6px 8px;font-size:11px}tr:nth-child(even) td{background:#f9fafb}.grand td{font-size:14px;font-weight:700;color:#2563eb;border-top:2px solid #2563eb}.footer{text-align:center;margin-top:20px;border-top:1px dashed #ccc;padding-top:12px;color:#777;font-size:11px}@media print{button{display:none}}</style>
      </head><body>${content}</body></html>`;
    const api = window.electronAPI || window.electron;
    if (api?.printReceipt) {
      api.printReceipt({ html, width: 'a4', copies: 1 }).then((result) => {
        if (!result.success) {
          console.error('[Print] Admin invoice print failed:', result.error || result.reason);
          alert('Receipt could not be printed. Please check printer settings and try Print Test Page.');
        }
      }).catch((err) => {
        console.error('[Print] Admin invoice print failed:', err);
        alert('Receipt could not be printed. Please check printer settings and try Print Test Page.');
      });
    } else {
      const win = window.open('', '_blank', 'width=800,height=900');
      if (!win) { alert('Print blocked. Please allow popups.'); return; }
      win.document.write(html);
      win.document.close(); win.focus(); win.print(); win.close();
    }
  };

  const saleDate = new Date(sale.createdAt).toLocaleString('en-PK', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-[680px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 bg-blue-600 rounded-t-xl">
          <span className="font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4"/>{sale.invoiceNumber}</span>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div id="admin-sale-invoice" className="p-6">
          <div className="header text-center border-b-2 border-blue-600 pb-4 mb-5">
            <h1 className="text-2xl font-bold text-blue-600">{shopName}</h1>
            {shopAddress && <p className="text-slate-500 text-xs mt-1">{shopAddress}</p>}
            {shopPhone && <p className="text-slate-500 text-xs">Tel: {shopPhone}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase">Invoice #</p>
              <p className="font-bold text-slate-800 text-base">{sale.invoiceNumber}</p>
              <p className="text-xs text-slate-500 uppercase mt-2">Date</p>
              <p className="font-medium text-slate-700">{saleDate}</p>
              <p className="text-xs text-slate-500 uppercase mt-2">Cashier</p>
              <p className="font-medium text-slate-700">{sale.cashier?.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Customer</p>
              <p className="font-bold text-slate-800">{sale.customer?.name || 'Walk-in Customer'}</p>
              {sale.customer?.phone && <p className="text-xs text-slate-500">{sale.customer.phone}</p>}
              <p className="text-xs text-slate-500 uppercase mt-2">Payment</p>
              <p className="font-medium text-slate-700">{sale.paymentMethod?.replace('_', ' ')}</p>
            </div>
          </div>
          <table className="w-full text-sm mb-4">
            <thead><tr className="bg-blue-600 text-white text-xs">
              <th className="text-left py-2 px-3">Item</th>
              <th className="text-center py-2 px-2">Qty</th>
              <th className="text-right py-2 px-2">Unit Price</th>
              <th className="text-right py-2 px-2">Disc.</th>
              <th className="text-right py-2 px-3">Amount</th>
            </tr></thead>
            <tbody>
              {sale.items?.map((item: any, i: number) => (
                <tr key={item.id} className={i%2===0?'bg-white':'bg-slate-50'}>
                  <td className="py-2 px-3 text-slate-800">
                    <div className="font-medium">{item.product?.name}</div>
                    <div className="text-xs text-slate-500">SKU: {item.product?.sku}{item.product?.brand?.name && ` · ${item.product.brand.name}`}</div>
                    {item.serialNumber && <div className="text-xs text-slate-500 flex items-center gap-1"><Hash className="w-3 h-3"/>S/N: {item.serialNumber}</div>}
                    {item.warrantyMonths > 0 && <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 mt-1"><ShieldCheck className="w-3 h-3"/>{item.warrantyMonths} Month Warranty</span>}
                  </td>
                  <td className="py-2 px-2 text-center">{item.quantity}</td>
                  <td className="py-2 px-2 text-right">PKR {item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-red-500">{item.discount>0?`-PKR ${item.discount.toLocaleString()}`:'—'}</td>
                  <td className="py-2 px-3 text-right font-semibold">PKR {item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto w-72 text-sm space-y-1.5 mb-4">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>- {fmt(sale.discount)}</span></div>}
            {sale.taxAmount > 0 && <div className="flex justify-between text-slate-600"><span>Tax ({sale.tax}%)</span><span>{fmt(sale.taxAmount)}</span></div>}
            <div className="flex justify-between font-bold text-blue-600 text-base border-t border-blue-200 pt-2"><span>TOTAL</span><span>{fmt(sale.total)}</span></div>
            {sale.paymentMethod === 'CASH' && <>
              <div className="flex justify-between text-slate-600"><span>Amount Paid</span><span>{fmt(sale.amountPaid)}</span></div>
              <div className="flex justify-between font-semibold text-emerald-600"><span>Change</span><span>{fmt(sale.changeGiven)}</span></div>
            </>}
          </div>
          <div className="text-center border-t border-dashed border-slate-300 pt-3 text-xs text-slate-500">{footer}</div>
        </div>
        <div className="flex gap-3 p-4 border-t border-slate-200">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50">
            <Printer className="w-4 h-4"/> Print
          </button>
          <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-800">
            <X className="w-4 h-4"/> Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesAdminPage() {
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data = [], isLoading } = useQuery({ queryKey: ['sales'], queryFn: salesService.getAll });
  const { data: settingsArr = [] } = useQuery({ queryKey: ['settings'], queryFn: settingsService.getAll });
  const settings = Object.fromEntries((settingsArr as any[]).map((s: any) => [s.key, s.value]));

  const filtered = (data as any[]).filter((s: any) =>
    !search ||
    s.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.cashier?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.reduce((sum: number, s: any) => sum + (s.total || 0), 0);

  const paymentBadge = (pm: string) => {
    const map: Record<string, string> = {
      CASH: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      CARD: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
      BANK_TRANSFER: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
      INSTALLMENT: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    };
    return map[pm] || 'bg-slate-700 text-slate-600';
  };

  const allSales = data as any[];
  const totalSalesRevenue = allSales.reduce((s: number, x: any) => s + (x.total || 0), 0);
  const cashCount  = allSales.filter((s: any) => s.paymentMethod === 'CASH').length;
  const avgOrder   = allSales.length ? Math.round(totalSalesRevenue / allSales.length) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Sales</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage all sales transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Hash className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Total Sales</p><p className="text-2xl font-bold text-slate-800">{allSales.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Total Revenue</p><p className="text-xl font-bold text-emerald-600">PKR {totalSalesRevenue.toLocaleString()}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><FileText className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Avg Order</p><p className="text-xl font-bold text-purple-600">PKR {avgOrder.toLocaleString()}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Printer className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Cash Sales</p><p className="text-2xl font-bold text-amber-600">{cashCount}</p></div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Search invoice, cashier, customer…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setSearch('')} />}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['#', 'Invoice', 'Cashier', 'Customer', 'Items', 'Total', 'Payment', 'Date', ''].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && <tr><td colSpan={9} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-slate-400"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm">Loading sales…</span></div></td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={9} className="text-center py-16 text-slate-400">No sales found</td></tr>}
              {filtered.map((s: any, idx: number) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-5 py-4"><span className="font-mono text-xs font-bold text-blue-600">{s.invoiceNumber}</span></td>
                  <td className="px-5 py-4 text-slate-600 font-medium">{s.cashier?.fullName}</td>
                  <td className="px-5 py-4 text-slate-500">{s.customer?.name || <span className="italic text-slate-400 text-xs">Walk-in</span>}</td>
                  <td className="px-5 py-4 text-slate-500">{s.items?.length}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">PKR {s.total?.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${paymentBadge(s.paymentMethod)}`}>
                      {s.paymentMethod?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs">
                    {new Date(s.createdAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setSelectedSale(s)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" />View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">Showing {filtered.length} of {allSales.length} sales · Total: PKR {totalRevenue.toLocaleString()}</div>}
      </div>

      {selectedSale && (
        <InvoiceDetailModal sale={selectedSale} settings={settings} onClose={() => setSelectedSale(null)}/>
      )}
    </div>
  );
}
