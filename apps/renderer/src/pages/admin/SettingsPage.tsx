import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, salesService } from '../../services';
import { getApiBaseUrl, setApiBaseUrl } from '../../services/api';
import toast from 'react-hot-toast';
import {
  AlertTriangle, DatabaseBackup, Monitor, Printer,
  Save, Server, ShieldCheck, Trash2,
} from 'lucide-react';

const BUSINESS_FIELDS = [
  { key: 'pos_name', label: 'POS / Software Name', placeholder: 'Home Appliances POS' },
  { key: 'shop_name', label: 'Shop Name', placeholder: 'Al-Noor Home Appliances' },
  { key: 'shop_address', label: 'Address' },
  { key: 'shop_phone', label: 'Phone' },
  { key: 'tax_id', label: 'Tax/NTN Number' },
  { key: 'currency', label: 'Currency', placeholder: 'PKR' },
];

const RECEIPT_FIELDS = [
  { key: 'receipt_footer', label: 'Receipt Footer' },
  { key: 'tax_rate', label: 'Tax Rate (%)' },
  { key: 'receipt_format', label: 'Receipt Format', type: 'select', options: [
    { value: 'thermal_80', label: 'Thermal Receipt (80mm)' },
    { value: 'thermal_58', label: 'Thermal Receipt (58mm)' },
    { value: 'a4', label: 'A4 Invoice' },
  ] },
];

const ALL_SETTING_FIELDS = [...BUSINESS_FIELDS, ...RECEIPT_FIELDS];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [initialised, setInitialised] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [appMode, setAppMode] = useState<'server' | 'client' | null>(null);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [printers, setPrinters] = useState<Array<{ name: string; displayName?: string; isDefault?: boolean }>>([]);
  const [printerSettings, setPrinterSettings] = useState({ defaultPrinter: '', silentPrint: false, autoPrint: false });
  const [testingPrint, setTestingPrint] = useState(false);
  const queryClient = useQueryClient();

  const { isLoading, data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getAll,
  });

  useEffect(() => {
    if (settingsData && !initialised) {
      const map: Record<string, string> = {};
      (settingsData as any[]).forEach((s: any) => { map[s.key] = s.value; });
      setValues({
        pos_name: 'Home Appliances POS',
        currency: 'PKR',
        receipt_format: 'thermal_80',
        tax_rate: '0',
        ...map,
      });
      setInitialised(true);
    }
  }, [settingsData, initialised]);

  useEffect(() => {
    const api = window.electronAPI || window.electron;
    if (!api) return;
    api.getAppMode().then(setAppMode).catch(() => undefined);
    api.getApiUrl().then((url) => { if (url) setApiUrl(url); }).catch(() => undefined);
    api.getServerInfo().then(setServerInfo).catch(() => undefined);
    api.getPrinters().then(setPrinters).catch(() => undefined);
    api.getPrinterSettings().then(setPrinterSettings).catch(() => undefined);
  }, []);

  const saveSettingsMut = useMutation({
    mutationFn: () => settingsService.bulk(
      ALL_SETTING_FIELDS.map((f) => ({ key: f.key, value: values[f.key] || '' })),
    ),
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const clearMut = useMutation({
    mutationFn: () => salesService.deleteAll(),
    onSuccess: () => {
      toast.success('All sales data cleared');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setConfirmClear(false);
    },
    onError: () => toast.error('Failed to clear sales data'),
  });

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('');
    try {
      const api = window.electronAPI || window.electron;
      const result = api
        ? await api.testConnection(apiUrl)
        : { ok: (await fetch(`${apiUrl.replace(/\/+$/, '')}/health`)).ok };
      if (result.ok) {
        setConnectionStatus('Connection successful');
        toast.success('Connection successful');
      } else {
        const message = result.error || 'Connection failed';
        setConnectionStatus(message);
        toast.error(message);
      }
    } catch (err: any) {
      const message = err?.message || 'Connection failed';
      setConnectionStatus(message);
      toast.error(message);
    } finally {
      setTestingConnection(false);
    }
  };

  const saveApiUrl = async () => {
    const api = window.electronAPI || window.electron;
    if (!api) {
      setApiBaseUrl(apiUrl);
      toast.success('API URL updated for this session');
      return;
    }

    try {
      const savedUrl = await api.setApiUrl(apiUrl);
      setApiUrl(savedUrl);
      setApiBaseUrl(savedUrl);
      toast.success('API URL saved on this computer');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save API URL');
    }
  };

  const changeMode = async (mode: 'server' | 'client') => {
    const api = window.electronAPI || window.electron;
    if (!api) return;
    try {
      const savedMode = await api.setAppMode(mode);
      const savedUrl = await api.getApiUrl();
      setAppMode(savedMode);
      if (savedUrl) {
        setApiUrl(savedUrl);
        setApiBaseUrl(savedUrl);
      }
      toast.success(`${mode === 'server' ? 'Server' : 'Client'} mode saved`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change app mode');
    }
  };

  const savePrinterSettings = async () => {
    const api = window.electronAPI || window.electron;
    if (!api) {
      toast.error('Printer settings are available in the Electron app only');
      return;
    }

    try {
      const saved = await api.setPrinterSettings(printerSettings);
      setPrinterSettings(saved);
      toast.success('Printer settings saved on this computer');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save printer settings');
    }
  };

  const printTestPage = async () => {
    const api = window.electronAPI || window.electron;
    if (!api) {
      toast.error('Test print is available in the Electron app only');
      return;
    }

    if (printerSettings.silentPrint && !printerSettings.defaultPrinter) {
      toast.error('Select a default printer before using Silent Print.');
      setTestingPrint(false);
      return;
    }

    setTestingPrint(true);
    try {
      const format = values.receipt_format || 'thermal_80';
      const paper = format === 'thermal_58' ? '58mm' : '80mm';
      const isA4 = format === 'a4';
      const html = isA4 ? generateA4TestHTML(values) : generateThermalTestHTML(values, paper);
      const result = await api.printReceipt({
        html,
        silent: printerSettings.silentPrint,
        printerName: printerSettings.defaultPrinter || undefined,
        width: isA4 ? 'a4' : paper,
        copies: 1,
      });
      if (result.success) toast.success('Test page sent to printer');
      else {
        console.error('[Print] Test page failed:', result.error || result.reason);
        toast.error('Receipt could not be printed. Please check printer settings and try Print Test Page.');
      }
    } catch (err: any) {
      console.error('[Print] Test page failed:', err);
      toast.error('Receipt could not be printed. Please check printer settings and try Print Test Page.');
    } finally {
      setTestingPrint(false);
    }
  };

  const renderField = (field: any) => (
    <div key={field.key} className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{field.label}</label>
      {field.type === 'select' ? (
        <select
          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
          value={values[field.key] || ''}
          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
        >
          <option value="">Select...</option>
          {field.options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition placeholder:text-slate-400"
          value={values[field.key] || ''}
          placeholder={field.placeholder || ''}
          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
        />
      )}
    </div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure business details, LAN connection, receipts, and delivery options.</p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Header icon={Save} title="Business / POS Name" />
        <div className="p-6 grid md:grid-cols-2 gap-5">
          {BUSINESS_FIELDS.map(renderField)}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Header icon={Server} title="Server Connection" />
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            <Info label="Current Mode" value={appMode ? (appMode === 'server' ? 'Server / Main Computer' : 'Client / Cashier Computer') : 'Browser / Dev'} />
            <Info label="Default Hostname" value={serverInfo?.defaultHostname || 'SHOP-SERVER'} />
            <Info label="Backend Port" value={String(serverInfo?.port || 3000)} />
          </div>

          {appMode === 'server' && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Give this URL to cashier computers:</p>
              <div className="space-y-2">
                <code className="block bg-white rounded-lg px-3 py-2 text-sm text-slate-700">{serverInfo?.shopServerUrl || 'http://SHOP-SERVER:3000/api/v1'}</code>
                {(serverInfo?.lanUrls || []).map((url: string) => (
                  <code key={url} className="block bg-white rounded-lg px-3 py-2 text-sm text-slate-700">{url}</code>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Current API URL</label>
            <input
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
              value={apiUrl}
              disabled={appMode === 'server'}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            {appMode === 'server' && <p className="text-xs text-slate-500 mt-1">Server mode uses the local backend and database on this computer.</p>}
            {appMode === 'client' && <p className="text-xs text-slate-500 mt-1">Client mode should point to the main computer, for example http://192.168.1.10:3000/api/v1.</p>}
          </div>

          {connectionStatus && (
            <p className={`text-sm font-medium ${connectionStatus.includes('successful') ? 'text-emerald-600' : 'text-red-600'}`}>{connectionStatus}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button onClick={testConnection} disabled={testingConnection} className="px-5 py-2.5 rounded-xl border border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 disabled:opacity-60">
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            {appMode === 'client' && (
              <button onClick={saveApiUrl} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                Save API URL
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Header icon={Monitor} title="App Mode" />
        <div className="p-6 flex flex-wrap gap-3">
          <button onClick={() => changeMode('server')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold border ${appMode === 'server' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            Server / Main Computer
          </button>
          <button onClick={() => changeMode('client')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold border ${appMode === 'client' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            Client / Cashier Computer
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Header icon={Printer} title="Receipt, Printer & Tax" />
        <div className="p-6 grid md:grid-cols-2 gap-5">
          {RECEIPT_FIELDS.map(renderField)}

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Default Printer on This Computer</label>
            <select
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
              value={printerSettings.defaultPrinter}
              onChange={(e) => setPrinterSettings((prev) => ({ ...prev, defaultPrinter: e.target.value }))}
            >
              <option value="">Use system default / show print dialog</option>
              {printers.map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName || printer.name}{printer.isDefault ? ' (System Default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Printer selection is saved locally on each computer because printer names differ per PC.</p>
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 accent-blue-600"
              checked={printerSettings.silentPrint}
              onChange={(e) => setPrinterSettings((prev) => ({ ...prev, silentPrint: e.target.checked }))}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-700">Silent Print</span>
              <span className="block text-xs text-slate-500 mt-0.5">Print without the Windows/macOS print dialog. Requires a valid default printer.</span>
            </span>
          </label>

          {printerSettings.silentPrint && !printerSettings.defaultPrinter && (
            <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Silent Print is enabled, but no printer is selected. Select a default printer or turn Silent Print off to use the print dialog.
            </div>
          )}

          <label className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 accent-blue-600"
              checked={printerSettings.autoPrint}
              onChange={(e) => setPrinterSettings((prev) => ({ ...prev, autoPrint: e.target.checked }))}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-700">Auto Print After Sale</span>
              <span className="block text-xs text-slate-500 mt-0.5">Automatically sends the receipt after successful checkout.</span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button onClick={savePrinterSettings} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
              Save Printer Settings
            </button>
            <button onClick={printTestPage} disabled={testingPrint} className="px-5 py-2.5 rounded-xl border border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 disabled:opacity-60">
              {testingPrint ? 'Printing...' : 'Print Test Page'}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Header icon={DatabaseBackup} title="Backup" />
        <div className="p-6 rounded-b-2xl">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-800">Backup placeholder</p>
            <p className="text-xs text-amber-700 mt-1">Automatic backup/restore is not implemented yet. For delivery, back up the server computer database file regularly.</p>
          </div>
        </div>
      </section>

      <div className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-end">
        <button
          onClick={() => saveSettingsMut.mutate()}
          disabled={saveSettingsMut.isPending}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-60 shadow-sm shadow-blue-200"
        >
          {saveSettingsMut.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><ShieldCheck className="w-4 h-4" />Save All Settings</>}
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <Header icon={AlertTriangle} title="Danger Zone" danger />
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Clear All Sales Data</p>
            <p className="text-xs text-slate-500 mt-0.5">Permanently deletes all sales and invoice records. Cannot be undone.</p>
          </div>
          <button onClick={() => setConfirmClear(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" />Clear Sales
          </button>
        </div>
      </section>

      {confirmClear && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Clear All Sales?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">This will permanently delete all sales, invoices, and sale items from the database.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => clearMut.mutate()} disabled={clearMut.isPending} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {clearMut.isPending ? 'Clearing...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateThermalTestHTML(settings: Record<string, string>, paper: '58mm' | '80mm') {
  const width = paper === '58mm' ? 219 : 302;
  const font = paper === '58mm' ? '10px' : '11px';
  const title = settings.pos_name || settings.shop_name || 'Home Appliances POS';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Printer Test</title>
    <style>@page{size:${paper} auto;margin:0}body{width:${paper};font-family:'Courier New',monospace;font-size:${font};padding:${paper === '58mm' ? '2mm' : '4mm'};color:#000}.line{border-top:1px dashed #000;margin:8px 0}</style>
    </head><body><div style="width:${width}px">
      <div style="text-align:center;font-weight:bold">${title}</div>
      <div style="text-align:center">THERMAL PRINTER TEST</div>
      <div class="line"></div>
      <div>Paper: ${paper}</div>
      <div>Date: ${new Date().toLocaleString()}</div>
      <div class="line"></div>
      <div>Item A x 1 <span style="float:right">Rs. 100</span></div>
      <div>Item B x 2 <span style="float:right">Rs. 200</span></div>
      <div class="line"></div>
      <div style="font-weight:bold">TOTAL <span style="float:right">Rs. 300</span></div>
      <div class="line"></div>
      <div style="text-align:center">Print OK</div>
    </div></body></html>`;
}

function generateA4TestHTML(settings: Record<string, string>) {
  const title = settings.pos_name || settings.shop_name || 'Home Appliances POS';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Printer Test</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}.box{border:1px solid #ddd;padding:24px;max-width:720px;margin:auto}h1{color:#2563eb}</style>
    </head><body><div class="box"><h1>${title}</h1><h2>A4 Printer Test</h2><p>If you can read this page, printing is configured correctly.</p><p>${new Date().toLocaleString()}</p></div></body></html>`;
}

function Header({ icon: Icon, title, danger = false }: { icon: any; title: string; danger?: boolean }) {
  return (
    <div className={`px-6 py-4 border-b flex items-center gap-2 ${danger ? 'border-red-100' : 'border-slate-100'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
        <Icon className={`w-4 h-4 ${danger ? 'text-red-600' : 'text-blue-600'}`} />
      </div>
      <h2 className={`text-sm font-bold ${danger ? 'text-red-600' : 'text-slate-700'}`}>{title}</h2>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-1 break-all">{value}</p>
    </div>
  );
}
