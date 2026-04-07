import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, salesService } from '../../services';
import toast from 'react-hot-toast';
import { Save, Trash2, AlertTriangle } from 'lucide-react';

const FIELDS = [
  { key:'shop_name',     label:'Shop Name' },
  { key:'shop_address',  label:'Address' },
  { key:'shop_phone',    label:'Phone' },
  { key:'tax_id',        label:'Tax/NTN Number' },
  { key:'currency',      label:'Currency' },
  { key:'receipt_footer',label:'Receipt Footer' },
  { key:'tax_rate',      label:'Tax Rate (%)' },
  { key:'receipt_format',label:'Receipt Format', type:'select', options:[
    { value:'thermal', label:'Thermal Receipt (80mm)' },
    { value:'a4',      label:'A4 Invoice' }
  ]},
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string,string>>({});
  const [initialised, setInitialised] = useState(false);
  const queryClient = useQueryClient();

  const { isLoading, data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getAll,
  });

  // Populate form once data arrives (React Query v5 removed onSuccess from useQuery)
  useEffect(() => {
    if (settingsData && !initialised) {
      const map: Record<string,string> = {};
      (settingsData as any[]).forEach((s: any) => { map[s.key] = s.value; });
      setValues(map);
      setInitialised(true);
    }
  }, [settingsData, initialised]);

  const mut = useMutation({
    mutationFn: () => settingsService.bulk(FIELDS.map(f=>({ key:f.key, value: values[f.key]||'' }))),
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const [confirmClear, setConfirmClear] = useState(false);

  const clearMut = useMutation({
    mutationFn: () => salesService.deleteAll(),
    onSuccess: () => {
      toast.success('All sales data cleared');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setConfirmClear(false);
    },
    onError: () => toast.error('Failed to clear sales data'),
  });

  if (isLoading) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Settings</h1>

      {/* Shop / Receipt Settings */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Shop Info & Receipt</h2>
        {FIELDS.map(f=>(
          <div key={f.key}>
            <label className="label">{f.label}</label>
            {(f as any).type === 'select' ? (
              <select 
                className="input" 
                value={values[f.key]||''} 
                onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))}
              >
                <option value="">Select...</option>
                {(f as any).options.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input className="input" value={values[f.key]||''} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))} />
            )}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <button className="btn-primary" onClick={()=>mut.mutate()} disabled={mut.isPending}>
            <Save className="w-4 h-4"/>{mut.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border border-red-200 space-y-3">
        <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4"/>Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Clear All Sales Data</p>
            <p className="text-xs text-slate-500">Permanently deletes all sales &amp; invoice records. Cannot be undone.</p>
          </div>
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5"/> Clear Sales
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600"/>
              </div>
              <h3 className="text-base font-bold text-slate-800">Clear All Sales?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">This will permanently delete <strong>all sales, invoices, and sale items</strong> from the database. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => clearMut.mutate()}
                disabled={clearMut.isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {clearMut.isPending ? 'Clearing…' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
