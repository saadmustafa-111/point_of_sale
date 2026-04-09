import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, customersService, salesService, categoriesService, settingsService, installmentsService } from '../../services';
import {
  Search, Trash2, Printer, CheckCircle, Plus, Minus,
  UserPlus, X, Banknote, CreditCard, Building2, Calendar,
  Package, Tag, ShieldCheck, Hash, Receipt, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateThermalReceiptHTML } from '../../components/ThermalReceipt';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  discount: number;
  serialNumber: string;
  warrantyMonths: number;
  brandName: string;
  categoryName: string;
  showSerial: boolean;
}

const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'Cash',          icon: Banknote },
  { value: 'CARD',          label: 'Card',          icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
  { value: 'INSTALLMENT',   label: 'Installment',   icon: Calendar },
];

// ─── Invoice Print Modal ──────────────────────────────────────────────────────

function InvoiceModal({ sale, settings, installmentPlan, onClose }: { sale: any; settings: any; installmentPlan?: any; onClose: () => void }) {
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>(settings?.receipt_format || 'thermal');
  const fmt = (n: number) => `PKR ${n.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  const shopName    = settings?.shop_name    || 'Home Appliances Shop';
  const shopAddress = settings?.shop_address || '';
  const shopPhone   = settings?.shop_phone   || '';
  const footer      = settings?.receipt_footer || 'Thank you for your purchase!';

  const handlePrintThermal = () => {
    const html = generateThermalReceiptHTML(sale, settings);
    const w = window as any;
    if (w.electron?.printReceipt) {
      w.electron.printReceipt(html);
      toast.success('Printing thermal receipt...');
    } else {
      const win = window.open('', '_blank', 'width=400,height=800');
      if (!win) { alert('Print blocked. Please allow popups.'); return; }
      win.document.write(html);
      win.document.close(); win.focus(); win.print(); win.close();
    }
  };

  const handlePrintA4 = () => {
    const printContent = document.getElementById('invoice-content')!.innerHTML;
    const html = `<!DOCTYPE html><html><head><title>Invoice ${sale.invoiceNumber}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 22px; color: #2563eb; font-weight: 700; }
        .header p  { font-size: 11px; color: #555; margin-top: 2px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .meta-box label { font-size: 10px; text-transform: uppercase; color: #888; }
        .meta-box p { font-size: 12px; font-weight: 600; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #2563eb; color: #fff; font-size: 11px; padding: 6px 8px; text-align: left; }
        td { border-bottom: 1px solid #e5e7eb; padding: 6px 8px; font-size: 11px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .totals { margin-left: auto; width: 260px; }
        .totals tr td:first-child { color: #555; }
        .totals tr td:last-child { text-align: right; font-weight: 600; }
        .totals .grand td { font-size: 14px; font-weight: 700; color: #2563eb; border-top: 2px solid #2563eb; }
        .warranty-badge { font-size: 10px; color: #059669; background: #d1fae5; border-radius: 3px; padding: 1px 4px; margin-left: 4px; }
        .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 12px; color: #777; font-size: 11px; }
        .payment-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
        .serial { font-size: 10px; color: #666; }
        @media print { button { display:none; } }
      </style></head><body>${printContent}</body></html>`;
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
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-blue-600 rounded-t-xl">
          <div className="flex items-center gap-2 text-white">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Sale Complete — {sale.invoiceNumber}</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" className="p-6">
          {/* Header */}
          <div className="header text-center border-b-2 border-blue-600 pb-4 mb-5">
            <h1 className="text-2xl font-bold text-blue-600">{shopName}</h1>
            {shopAddress && <p className="text-slate-500 text-xs mt-1">{shopAddress}</p>}
            {shopPhone   && <p className="text-slate-500 text-xs">Tel: {shopPhone}</p>}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Invoice #</p>
              <p className="font-bold text-slate-800 text-base">{sale.invoiceNumber}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-2">Date</p>
              <p className="font-medium text-slate-700">{saleDate}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-2">Cashier</p>
              <p className="font-medium text-slate-700">{sale.cashier?.fullName}</p>
            </div>
            <div>
              {sale.customer ? (
                <>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
                  <p className="font-bold text-slate-800">{sale.customer.name}</p>
                  {sale.customer.phone && <p className="text-xs text-slate-500">{sale.customer.phone}</p>}
                  {sale.customer.address && <p className="text-xs text-slate-500">{sale.customer.address}</p>}
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
                  <p className="text-slate-600 italic">Walk-in Customer</p>
                </>
              )}
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-2">Payment</p>
              <p className="font-medium text-slate-700">{sale.paymentMethod?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm mb-4 border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white text-xs">
                <th className="text-left py-2 px-3 rounded-tl">Item</th>
                <th className="text-center py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Unit Price</th>
                <th className="text-right py-2 px-2">Disc.</th>
                <th className="text-right py-2 px-3 rounded-tr">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item: any, idx: number) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2 px-3 text-slate-800">
                    <div className="font-medium">{item.product?.name}</div>
                    <div className="text-xs text-slate-500">SKU: {item.product?.sku}
                      {item.product?.brand?.name && ` · ${item.product.brand.name}`}
                    </div>
                    {item.serialNumber && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Hash className="w-3 h-3" /> S/N: {item.serialNumber}
                      </div>
                    )}
                    {item.warrantyMonths > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 mt-1">
                        <ShieldCheck className="w-3 h-3" /> {item.warrantyMonths} Month Warranty
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-2 px-2 text-right text-slate-700">PKR {item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-red-500">{item.discount > 0 ? `-PKR ${item.discount.toLocaleString()}` : '—'}</td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-800">PKR {item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto w-72 text-sm space-y-1.5 mb-5">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>- {fmt(sale.discount)}</span></div>}
            {sale.taxAmount > 0 && <div className="flex justify-between text-slate-600"><span>Tax ({sale.tax}%)</span><span>{fmt(sale.taxAmount)}</span></div>}
            <div className="flex justify-between font-bold text-blue-600 text-base border-t border-blue-200 pt-2 mt-1">
              <span>TOTAL</span><span>{fmt(sale.total)}</span>
            </div>
            {sale.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between text-slate-600"><span>Amount Paid</span><span>{fmt(sale.amountPaid)}</span></div>
                <div className="flex justify-between font-semibold text-emerald-600"><span>Change</span><span>{fmt(sale.changeGiven)}</span></div>
              </>
            )}
          </div>

          {/* Warranty Summary */}
          {sale.items?.some((i: any) => i.warrantyMonths > 0) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-xs text-emerald-800">
              <p className="font-semibold mb-1 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Warranty Information</p>
              {sale.items.filter((i: any) => i.warrantyMonths > 0).map((i: any) => (
                <p key={i.id}>{i.product?.name}: {i.warrantyMonths} month(s) from {new Date(sale.createdAt).toLocaleDateString()}</p>
              ))}
            </div>
          )}

          {/* Installment Plan Details */}
          {sale.paymentMethod === 'INSTALLMENT' && installmentPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-800">
              <p className="font-semibold mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Installment Plan Details
              </p>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                <div className="flex justify-between">
                  <span className="text-blue-600">Down Payment</span>
                  <span className="font-bold">PKR {(installmentPlan.downPayment ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Monthly Payment</span>
                  <span className="font-bold">PKR {(installmentPlan.monthlyAmount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Installments</span>
                  <span className="font-bold">{installmentPlan.installments} months</span>
                </div>
                {installmentPlan.payments?.[0]?.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-blue-600">First Due Date</span>
                    <span className="font-bold">{new Date(installmentPlan.payments[0].dueDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {sale.paymentMethod === 'INSTALLMENT' && !installmentPlan && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-800">
              <p className="font-semibold flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Installment Plan Pending
              </p>
              <p className="mt-0.5 text-orange-700">Go to Installments page to create a payment plan for this sale.</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center border-t border-dashed border-slate-300 pt-3 text-xs text-slate-500">
            <p>{footer}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 p-4 border-t border-slate-200">
          {/* Print Format Toggle */}
          <div className="flex gap-2 p-2 bg-slate-100 rounded-lg">
            <button
              onClick={() => setPrintFormat('thermal')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                printFormat === 'thermal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-4 h-4" /> Thermal Receipt (80mm)
            </button>
            <button
              onClick={() => setPrintFormat('a4')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                printFormat === 'a4'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Printer className="w-4 h-4" /> A4 Invoice
            </button>
          </div>

          {/* Print and New Sale Buttons */}
          <div className="flex gap-3">
            <button
              onClick={printFormat === 'thermal' ? handlePrintThermal : handlePrintA4}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
            >
              {printFormat === 'thermal' ? <Receipt className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
              Print {printFormat === 'thermal' ? 'Receipt' : 'Invoice'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Add Customer Modal ─────────────────────────────────────────────────

function AddCustomerModal({ onSave, onClose }: { onSave: (c: any) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const mut = useMutation({
    mutationFn: () => customersService.create({ name, phone, address }),
    onSuccess: (data) => { toast.success('Customer added'); onSave(data); },
    onError: () => toast.error('Failed to add customer'),
  });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-80 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">New Customer</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="label">Name *</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Customer name" autoFocus /></div>
          <div><label className="label">Phone</label><input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 03001234567" /></div>
          <div><label className="label">Address</label><input className="input" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Optional" /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1 justify-center" disabled={!name || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Installment Plan Modal ───────────────────────────────────────────────────

function InstallmentPlanModal({
  total,
  saleId,
  customerName,
  onDone,
  onSkip,
}: {
  total: number;
  saleId: string;
  customerName: string;
  onDone: (plan: any) => void;
  onSkip: () => void;
}) {
  const [downPayment, setDownPayment] = useState('');
  const [months, setMonths] = useState('6');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const downNum   = parseFloat(downPayment) || 0;
  const monthsNum = parseInt(months) || 1;
  const remaining = Math.max(0, total - downNum);
  const monthly   = monthsNum > 0 ? +(remaining / monthsNum).toFixed(2) : 0;

  const mut = useMutation({
    mutationFn: () =>
      installmentsService.createPlan({
        saleId,
        totalAmount: total,
        downPayment: downNum,
        monthlyAmount: monthly,
        installments: monthsNum,
        startDate,
      }),
    onSuccess: (plan) => {
      toast.success('Installment plan created!');
      onDone(plan);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create plan'),
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Installment Plan</h2>
            <p className="text-sm text-gray-500">Customer: <strong>{customerName}</strong></p>
          </div>
        </div>

        {/* Sale total */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 flex justify-between text-sm">
          <span className="text-blue-700 font-medium">Sale Total</span>
          <span className="text-blue-900 font-bold">PKR {total.toLocaleString()}</span>
        </div>

        <div className="space-y-4">
          {/* Down Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Down Payment (PKR) <span className="text-gray-400 font-normal">— paid today</span>
            </label>
            <input
              type="number"
              value={downPayment}
              onChange={e => setDownPayment(e.target.value)}
              min="0"
              max={total}
              placeholder="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Number of Months */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Monthly Installments</label>
            <div className="flex gap-2">
              {[3, 6, 9, 12, 18, 24].map(m => (
                <button
                  key={m}
                  onClick={() => setMonths(String(m))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    months === String(m)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <input
              type="number"
              value={months}
              onChange={e => setMonths(e.target.value)}
              min="1"
              max="60"
              className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Or enter custom months"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Installment Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Down Payment</span>
              <span className="font-semibold">PKR {downNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Remaining on Credit</span>
              <span className="font-semibold text-orange-600">PKR {remaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-1">
              <span className="text-gray-700 font-medium">Monthly Payment × {monthsNum}</span>
              <span className="font-bold text-blue-700 text-base">PKR {monthly.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium"
          >
            Skip — Add Plan Later
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || monthsNum < 1 || !startDate}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm"
          >
            {mut.isPending ? 'Creating...' : 'Create Plan ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main POSPage ─────────────────────────────────────────────────────────────

export default function POSPage() {
  const qc = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);

  // State
  const [search, setSearch]               = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [discount, setDiscount]           = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [amountPaid, setAmountPaid]       = useState<string>('');
  const [customerId, setCustomerId]       = useState('');
  const [customerName, setCustomerName]   = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [lastSale, setLastSale]           = useState<any>(null);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [lastInstallmentPlan, setLastInstallmentPlan] = useState<any>(null);

  // Ref to capture paymentMethod at the moment of checkout (avoids stale closure)
  const paymentMethodRef = useRef<string>('CASH');

  // Queries
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesService.getAll });
  const { data: products = [] } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsService.getAll(search || undefined),
    enabled: true,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => customersService.getAll(customerSearch || undefined),
    enabled: customerSearch.length > 0,
  });
  const { data: settingsArr = [] } = useQuery({ queryKey: ['settings'], queryFn: settingsService.getAll });
  const settings = Object.fromEntries((settingsArr as any[]).map((s: any) => [s.key, s.value]));
  const taxRate = parseFloat(settings.tax_rate || '0');

  // Filtered products
  const displayedProducts = products.filter((p: any) => {
    if (!p.isActive) return false;
    if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) return false;
    return true;
  });

  // Cart calculations
  const subtotal    = +cart.reduce((s, i) => s + i.unitPrice * i.quantity - i.discount, 0).toFixed(2);
  const discountAmt = +Math.min(discount, subtotal).toFixed(2);
  const taxAmount   = +((subtotal - discountAmt) * (taxRate / 100)).toFixed(2);
  const total       = +Math.max(0, subtotal - discountAmt + taxAmount).toFixed(2);
  const paidNum     = +parseFloat(amountPaid || '0').toFixed(2);
  const change      = +Math.max(0, paidNum - total).toFixed(2);

  // Mutations
  const saleMut = useMutation({
    mutationFn: salesService.create,
    onSuccess: (data) => {
      setLastSale(data);
      setCart([]);
      setDiscount(0);
      setAmountPaid('');
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Invoice ${data.invoiceNumber} created!`);
      // Use ref to reliably read paymentMethod at time of checkout
      if (paymentMethodRef.current === 'INSTALLMENT') {
        setShowInstallmentModal(true);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Sale failed'),
  });

  // Cart actions
  const addToCart = useCallback((product: any) => {
    if (!product.isActive) return toast.error('Product is inactive');
    if (product.stock === 0) return toast.error('Out of stock');
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error(`Only ${product.stock} in stock`); return prev; }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id, name: product.name, sku: product.sku,
        unitPrice: product.salePrice, quantity: 1, stock: product.stock,
        discount: 0, serialNumber: '', warrantyMonths: product.warrantyMonths || 0,
        brandName: product.brand?.name || '', categoryName: product.category?.name || '',
        showSerial: false,
      }];
    });
    setSearch('');
    searchRef.current?.focus();
  }, []);

  const updateQty = (id: string, delta: number) =>
    setCart(prev => prev.map(i => i.productId === id
      ? { ...i, quantity: Math.max(1, Math.min(i.stock, i.quantity + delta)) } : i));

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.productId !== id));

  const updateDiscount = (id: string, value: number) =>
    setCart(prev => prev.map(i => i.productId === id ? { ...i, discount: Math.max(0, value) } : i));

  const updateSerial = (id: string, sn: string) =>
    setCart(prev => prev.map(i => i.productId === id ? { ...i, serialNumber: sn } : i));

  const toggleSerial = (id: string) =>
    setCart(prev => prev.map(i => i.productId === id ? { ...i, showSerial: !i.showSerial } : i));

  // Barcode / search
  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.length >= 8) {
      try { const p = await productsService.getByBarcode(val); addToCart(p); } catch {}
    }
  };

  // Checkout
  const handleCheckout = () => {
    if (!cart.length) return toast.error('Cart is empty');
    if (paymentMethod === 'CASH' && paidNum < total) return toast.error('Amount paid is less than total');
    if (paymentMethod === 'INSTALLMENT' && !customerId) return toast.error('Please select a customer for installment sale');
    paymentMethodRef.current = paymentMethod; // capture before async
    saleMut.mutate({
      items: cart.map(i => ({
        productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice,
        discount: i.discount, serialNumber: i.serialNumber || undefined,
        warrantyMonths: i.warrantyMonths,
      })),
      customerId: customerId || undefined,
      discount: discountAmt, tax: taxRate,
      amountPaid: paymentMethod === 'CASH' ? paidNum : total,
      paymentMethod: paymentMethod as any,
    });
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left: Product Search & Grid ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">

        {/* Search Bar */}
        <div className="p-3 border-b border-border bg-card">
          <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border focus-within:border-primary-500 transition-colors">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input ref={searchRef} className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              placeholder="Search product name, SKU or scan barcode…" value={search}
              onChange={e => handleSearch(e.target.value)} autoFocus />
            {search && <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 px-3 py-2 border-b border-border overflow-x-auto scrollbar-hide">
          <button onClick={() => setCategoryFilter('ALL')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === 'ALL' ? 'bg-primary-600 text-white' : 'bg-surface text-slate-500 hover:text-slate-700 border border-border'}`}>
            All
          </button>
          {(categories as any[]).map((c: any) => (
            <button key={c.id} onClick={() => setCategoryFilter(c.id)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === c.id ? 'bg-primary-600 text-white' : 'bg-surface text-slate-500 hover:text-slate-700 border border-border'}`}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 xl:grid-cols-3 gap-2.5 content-start">
          {displayedProducts.map((p: any) => (
            <button key={p.id} onClick={() => addToCart(p)}
              className={`card text-left hover:border-primary-500/50 transition-all active:scale-95 focus:outline-none focus:border-primary-500 ${p.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={p.stock === 0}>
              <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{p.sku}</p>
              {p.brand && <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-1"><Tag className="w-3 h-3"/>{p.brand.name}</span>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-primary-400 font-bold text-sm">PKR {p.salePrice.toLocaleString()}</span>
                <span className={`text-xs font-medium ${p.stock === 0 ? 'text-red-400' : p.stock <= p.lowStockLimit ? 'text-amber-400' : 'text-slate-500'}`}>
                  {p.stock === 0 ? 'Out' : `${p.stock} left`}
                </span>
              </div>
              {p.warrantyMonths > 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                  <ShieldCheck className="w-3 h-3" /> {p.warrantyMonths}m warranty
                </div>
              )}
            </button>
          ))}
          {displayedProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
              <Package className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Billing Panel ────────────────────────────────────────────── */}
      <div className="w-[400px] flex flex-col bg-card overflow-hidden">

        {/* Customer Section */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input className="input text-sm pr-8" placeholder="Search or select customer…"
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setShowCustDropdown(true); if (!e.target.value) { setCustomerId(''); setCustomerName(''); } }}
                onFocus={() => setShowCustDropdown(true)} />
              {customerId && <X className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 cursor-pointer" onClick={() => { setCustomerId(''); setCustomerName(''); setCustomerSearch(''); }} />}
            </div>
            <button title="Add new customer" className="btn-ghost p-2" onClick={() => setShowAddCustomer(true)}>
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
          {showCustDropdown && customers.length > 0 && customerSearch && (
            <div className="absolute z-20 bg-card border border-border rounded-lg shadow-xl mt-1 w-72">
              {(customers as any[]).slice(0,6).map((c: any) => (
                <button key={c.id} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 flex justify-between"
                  onClick={() => { setCustomerId(c.id); setCustomerName(c.name); setCustomerSearch(c.name); setShowCustDropdown(false); }}>
                  <span>{c.name}</span>
                  {c.phone && <span className="text-slate-500 text-xs">{c.phone}</span>}
                </button>
              ))}
            </div>
          )}
          {customerId && <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Selected: {customerName}</p>}
        </div>

        {/* Cart Header */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-slate-50">
          <span className="text-sm font-semibold text-slate-700">
            Cart {cart.length > 0 && <span className="ml-1 bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{cart.length}</span>}
          </span>
          {cart.length > 0 && (
            <button onClick={() => { setCart([]); setDiscount(0); setAmountPaid(''); }}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Clear Cart
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Package className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1 text-slate-600">Scan barcode or click a product</p>
            </div>
          )}
          {cart.map((item) => {
            const lineTotal = item.unitPrice * item.quantity - item.discount;
            return (
              <div key={item.productId} className="bg-surface rounded-xl p-3 border border-border/50">
                {/* Item Header */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{item.sku}</span>
                      {item.brandName && <span className="text-xs text-slate-600">· {item.brandName}</span>}
                      {item.warrantyMonths > 0 && (
                        <span className="text-xs text-emerald-500 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3"/>{item.warrantyMonths}m
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-300 p-1 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Qty + Unit Price */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors">
                      <Minus className="w-3 h-3 text-slate-600" />
                    </button>
                    <span className="text-sm font-bold text-slate-800 w-7 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, +1)} className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors">
                      <Plus className="w-3 h-3 text-slate-600" />
                    </button>
                    <span className="text-xs text-slate-500 ml-1">× PKR {item.unitPrice.toLocaleString()}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">PKR {lineTotal.toLocaleString()}</span>
                </div>

                {/* Per-item discount */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500 shrink-0">Item Disc.</span>
                  <input type="number" min="0" value={item.discount || ''}
                    onChange={e => updateDiscount(item.productId, +e.target.value)}
                    className="input py-0.5 text-xs w-24 text-right"
                    placeholder="0" />

                  {/* Serial Number toggle */}
                  <button onClick={() => toggleSerial(item.productId)}
                    className={`ml-auto flex items-center gap-1 text-xs rounded px-1.5 py-0.5 border transition-colors ${item.showSerial ? 'border-primary-500 text-primary-400 bg-primary-500/10' : 'border-border text-slate-500 hover:text-slate-600'}`}>
                    <Hash className="w-3 h-3" /> S/N
                  </button>
                </div>

                {/* Serial Number Input */}
                {item.showSerial && (
                  <div className="mt-2">
                    <input className="input py-1 text-xs w-full" placeholder="Enter serial/IMEI number…"
                      value={item.serialNumber}
                      onChange={e => updateSerial(item.productId, e.target.value)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Billing Summary + Checkout */}
        <div className="border-t border-border p-3 space-y-3">
          {/* Payment Method */}
          <div className="grid grid-cols-4 gap-1">
            {PAYMENT_METHODS.map(pm => {
              const Icon = pm.icon;
              return (
                <button key={pm.value}
                  onClick={() => { setPaymentMethod(pm.value); setAmountPaid(''); }}
                  className={`flex flex-col items-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${paymentMethod === pm.value ? 'bg-primary-600 border-primary-500 text-white' : 'border-border text-slate-500 hover:text-slate-600 hover:border-slate-600'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="leading-none">{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Totals */}
          <div className="bg-surface rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Bill Discount</span>
              <input type="number" min="0" value={discount || ''}
                onChange={e => setDiscount(+e.target.value)}
                className="input w-28 text-right py-1 text-xs" placeholder="0" />
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({taxRate}%)</span>
                <span>PKR {taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 border-t border-border pt-1.5 mt-1">
              <span>TOTAL</span>
              <span className="text-primary-600 text-lg">PKR {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Cash Tendering */}
          {paymentMethod === 'CASH' && (
            <div className="bg-surface rounded-xl p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <input type="number" min={total} value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="input w-32 text-right py-1 text-sm font-semibold"
                  placeholder={total.toString()} />
              </div>
              {paidNum > 0 && (
                <div className={`flex items-center justify-between font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span>Change Due</span>
                  <span className="text-base">PKR {change.toLocaleString()}</span>
                </div>
              )}
              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[total, Math.ceil(total/100)*100, Math.ceil(total/500)*500, Math.ceil(total/1000)*1000]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .slice(0,4)
                  .map(v => (
                  <button key={v} onClick={() => setAmountPaid(String(v))}
                    className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded px-2 py-1 transition-colors">
                    PKR {v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Installment info box */}
          {paymentMethod === 'INSTALLMENT' && (
            <div className={`rounded-xl p-3 text-sm border ${customerId ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
              {customerId ? (
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Customer <strong>{customerName}</strong> selected. An installment plan will be created after checkout.</span>
                </p>
              ) : (
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                  <span><strong>Select a customer</strong> above to proceed with installment sale.</span>
                </p>
              )}
            </div>
          )}

          {/* Checkout Button */}
          <button onClick={handleCheckout}
            disabled={saleMut.isPending || cart.length === 0 || (paymentMethod === 'CASH' && paidNum > 0 && paidNum < total) || (paymentMethod === 'INSTALLMENT' && !customerId)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors">
            <CheckCircle className="w-5 h-5" />
            {saleMut.isPending ? 'Processing…' : `Complete Sale · PKR ${total.toLocaleString()}`}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddCustomer && (
        <AddCustomerModal
          onSave={(c) => { setCustomerId(c.id); setCustomerName(c.name); setCustomerSearch(c.name); setShowAddCustomer(false); }}
          onClose={() => setShowAddCustomer(false)} />
      )}
      {showInstallmentModal && lastSale && (
        <InstallmentPlanModal
          total={lastSale.total}
          saleId={lastSale.id}
          customerName={lastSale.customer?.name || customerName}
          onDone={(plan) => {
            setLastInstallmentPlan(plan);
            setShowInstallmentModal(false);
            setCustomerId(''); setCustomerName(''); setCustomerSearch('');
          }}
          onSkip={() => {
            setLastInstallmentPlan(null);
            setShowInstallmentModal(false);
            setCustomerId(''); setCustomerName(''); setCustomerSearch('');
          }}
        />
      )}
      {lastSale && !showInstallmentModal && (
        <InvoiceModal
          sale={lastSale}
          settings={settings}
          installmentPlan={lastInstallmentPlan}
          onClose={() => { setLastSale(null); setLastInstallmentPlan(null); }}
        />
      )}
    </div>
  );
}
