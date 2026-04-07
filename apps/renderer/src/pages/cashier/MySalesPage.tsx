import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesService, settingsService } from '../../services';
import { Eye, Printer, Search, X, ShieldCheck, Hash, FileText } from 'lucide-react';

// ─── Invoice Detail Modal ─────────────────────────────────────────────────────

function InvoiceDetailModal({ sale, settings, onClose }: { sale: any; settings: any; onClose: () => void }) {
  const fmt = (n: number) => `PKR ${(n || 0).toLocaleString('en-PK')}`;
  const shopName    = settings?.shop_name    || 'Home Appliances Shop';
  const shopAddress = settings?.shop_address || '';
  const shopPhone   = settings?.shop_phone   || '';
  const footer      = settings?.receipt_footer || 'Thank you for your purchase!';

  const handlePrint = () => {
    const content = document.getElementById('my-sale-invoice')!.innerHTML;
    const html = `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNumber}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#111;padding:20px}
        .header{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:16px}
        .header h1{font-size:22px;color:#2563eb;font-weight:700}
        .header p{font-size:11px;color:#555;margin-top:2px}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
        table{width:100%;border-collapse:collapse;margin-bottom:12px}
        th{background:#2563eb;color:#fff;font-size:11px;padding:6px 8px;text-align:left}
        td{border-bottom:1px solid #e5e7eb;padding:6px 8px;font-size:11px}
        tr:nth-child(even) td{background:#f9fafb}
        .totals{margin-left:auto;width:260px}
        .totals td:last-child{text-align:right;font-weight:600}
        .grand td{font-size:14px;font-weight:700;color:#2563eb;border-top:2px solid #2563eb}
        .footer{text-align:center;margin-top:20px;border-top:1px dashed #ccc;padding-top:12px;color:#777;font-size:11px}
        @media print{button{display:none}}
      </style></head><body>${content}</body></html>`;
    const w = window as any;
    if (w.electron?.printReceipt) {
      w.electron.printReceipt(html);
    } else {
      const win = window.open('', '_blank', 'width=800,height=900');
      if (!win) { alert('Print blocked. Please allow popups.'); return; }
      win.document.write(html);
      win.document.close(); win.focus(); win.print(); win.close();
    }
  };

  const saleDate = new Date(sale.createdAt).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-[680px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 bg-blue-600 rounded-t-xl">
          <span className="font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4" /> {sale.invoiceNumber}
          </span>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div id="my-sale-invoice" className="p-6">
          <div className="header text-center border-b-2 border-blue-600 pb-4 mb-5">
            <h1 className="text-2xl font-bold text-blue-600">{shopName}</h1>
            {shopAddress && <p className="text-slate-500 text-xs mt-1">{shopAddress}</p>}
            {shopPhone   && <p className="text-slate-500 text-xs">Tel: {shopPhone}</p>}
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

          <table className="w-full text-sm mb-4 border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white text-xs">
                <th className="text-left py-2 px-3">Item</th>
                <th className="text-center py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Unit Price</th>
                <th className="text-right py-2 px-2">Disc.</th>
                <th className="text-right py-2 px-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item: any, i: number) => (
                <tr key={item.id} className={i%2===0?'bg-white':'bg-slate-50'}>
                  <td className="py-2 px-3 text-slate-800">
                    <div className="font-medium">{item.product?.name}</div>
                    <div className="text-xs text-slate-500">SKU: {item.product?.sku}{item.product?.brand?.name && ` · ${item.product.brand.name}`}</div>
                    {item.serialNumber && <div className="text-xs text-slate-500 flex items-center gap-1"><Hash className="w-3 h-3"/>S/N: {item.serialNumber}</div>}
                    {item.warrantyMonths > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 mt-1">
                        <ShieldCheck className="w-3 h-3"/>{item.warrantyMonths} Month Warranty
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-2 px-2 text-right text-slate-700">PKR {item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-red-500">{item.discount>0?`-PKR ${item.discount.toLocaleString()}`:'—'}</td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-800">PKR {item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto w-72 text-sm space-y-1.5 mb-4">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>- {fmt(sale.discount)}</span></div>}
            {sale.taxAmount > 0 && <div className="flex justify-between text-slate-600"><span>Tax ({sale.tax}%)</span><span>{fmt(sale.taxAmount)}</span></div>}
            <div className="flex justify-between font-bold text-blue-600 text-base border-t border-blue-200 pt-2">
              <span>TOTAL</span><span>{fmt(sale.total)}</span>
            </div>
            {sale.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between text-slate-600"><span>Amount Paid</span><span>{fmt(sale.amountPaid)}</span></div>
                <div className="flex justify-between font-semibold text-emerald-600"><span>Change</span><span>{fmt(sale.changeGiven)}</span></div>
              </>
            )}
          </div>

          <div className="text-center border-t border-dashed border-slate-300 pt-3 text-xs text-slate-500">{footer}</div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200">
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MySalesPage ──────────────────────────────────────────────────────────────

export default function MySalesPage() {
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data = [], isLoading } = useQuery({ queryKey: ['my-sales'], queryFn: salesService.getAll });
  const { data: settingsArr = [] } = useQuery({ queryKey: ['settings'], queryFn: settingsService.getAll });
  const settings = Object.fromEntries((settingsArr as any[]).map((s: any) => [s.key, s.value]));

  const filtered = (data as any[]).filter((s: any) =>
    !search ||
    s.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const paymentBadge = (pm: string) => {
    const map: Record<string, string> = {
      CASH: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      CARD: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
      BANK_TRANSFER: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
      INSTALLMENT: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    };
    return map[pm] || 'bg-slate-700 text-slate-600';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Sales History</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-500" />
          <input className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            placeholder="Search invoice or customer…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <X className="w-3.5 h-3.5 text-slate-500 cursor-pointer" onClick={() => setSearch('')} />}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-slate-500 text-xs uppercase tracking-wide">
              <th className="pb-3 pr-4 font-medium text-left">Invoice #</th>
              <th className="pb-3 pr-4 font-medium text-left">Customer</th>
              <th className="pb-3 pr-4 font-medium text-left">Items</th>
              <th className="pb-3 pr-4 font-medium text-right">Total</th>
              <th className="pb-3 pr-4 font-medium text-left">Payment</th>
              <th className="pb-3 pr-4 font-medium text-left">Date</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">Loading sales…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">No sales found</td></tr>
            ) : filtered.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-primary-400 font-semibold">{s.invoiceNumber}</span>
                </td>
                <td className="py-3 pr-4 text-slate-600">{s.customer?.name || <span className="text-slate-500 italic">Walk-in</span>}</td>
                <td className="py-3 pr-4 text-slate-500">{s.items?.length} item{s.items?.length !== 1 ? 's' : ''}</td>
                <td className="py-3 pr-4 text-slate-800 font-semibold text-right">PKR {s.total?.toLocaleString()}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentBadge(s.paymentMethod)}`}>
                    {s.paymentMethod?.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-500 text-xs">
                  {new Date(s.createdAt).toLocaleString('en-PK', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </td>
                <td className="py-3 text-right">
                  <button onClick={() => setSelectedSale(s)}
                    className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 ml-auto border border-primary-500/30 hover:border-primary-500/60 rounded px-2 py-1 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSale && (
        <InvoiceDetailModal sale={selectedSale} settings={settings} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
}

