import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, Monitor, Server, Wifi } from 'lucide-react';
import { setApiBaseUrl } from '../services/api';

const DEFAULT_CLIENT_URL = 'http://SHOP-SERVER:3000/api/v1';
const SERVER_LOCAL_URL = 'http://localhost:3000/api/v1';

type Mode = 'server' | 'client';

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [serverUrl, setServerUrl] = useState(DEFAULT_CLIENT_URL);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    window.electron?.getServerInfo().then(setServerInfo).catch(() => undefined);
  }, []);

  const testUrl = async (url: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = window.electron
        ? await window.electron.testConnection(url)
        : { ok: (await fetch(`${url.replace(/\/+$/, '')}/health`)).ok };
      const message = result.ok ? 'Connection successful' : result.error || 'Connection failed';
      setTestResult({ ok: result.ok, message });
      if (result.ok) toast.success(message);
      else toast.error(message);
      return result.ok;
    } catch (err: any) {
      const message = err?.message || 'Connection failed';
      setTestResult({ ok: false, message });
      toast.error(message);
      return false;
    } finally {
      setTesting(false);
    }
  };

  const finishServerSetup = async () => {
    if (!window.electron) {
      setApiBaseUrl('/api/v1');
      onComplete();
      return;
    }

    setSaving(true);
    try {
      await window.electron.setAppMode('server');
      const apiUrl = await window.electron.getApiUrl();
      setApiBaseUrl(apiUrl || SERVER_LOCAL_URL);
      toast.success('Server mode enabled');
      onComplete();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to enable server mode');
    } finally {
      setSaving(false);
    }
  };

  const finishClientSetup = async () => {
    const ok = await testUrl(serverUrl);
    if (!ok) return;

    if (!window.electron) {
      setApiBaseUrl(serverUrl);
      onComplete();
      return;
    }

    setSaving(true);
    try {
      await window.electron.setAppMode('client');
      const savedUrl = await window.electron.setApiUrl(serverUrl);
      setApiBaseUrl(savedUrl);
      toast.success('Client mode enabled');
      onComplete();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save client connection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">First Run Setup</h1>
              <p className="text-sm text-slate-500">Choose how this computer will use the POS system.</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedMode('server')}
              className={`text-left rounded-xl border p-5 transition ${
                selectedMode === 'server' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <Server className="w-6 h-6 text-blue-600 mb-3" />
              <h2 className="font-bold text-slate-900">Server / Main Computer</h2>
              <p className="text-sm text-slate-500 mt-1">Stores the central database and starts the backend API.</p>
            </button>

            <button
              onClick={() => setSelectedMode('client')}
              className={`text-left rounded-xl border p-5 transition ${
                selectedMode === 'client' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <Wifi className="w-6 h-6 text-blue-600 mb-3" />
              <h2 className="font-bold text-slate-900">Client / Cashier Computer</h2>
              <p className="text-sm text-slate-500 mt-1">Connects to the main computer over the same Wi-Fi/LAN.</p>
            </button>
          </div>

          {selectedMode === 'server' && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 space-y-3">
              <h3 className="font-semibold text-blue-900">Server connection info</h3>
              <p className="text-sm text-blue-800">Use one of these URLs on cashier/client computers:</p>
              <div className="space-y-2 text-sm">
                <code className="block rounded-lg bg-white px-3 py-2 text-slate-700">{serverInfo?.shopServerUrl || DEFAULT_CLIENT_URL}</code>
                {(serverInfo?.lanUrls || []).map((url: string) => (
                  <code key={url} className="block rounded-lg bg-white px-3 py-2 text-slate-700">{url}</code>
                ))}
              </div>
              <button
                onClick={finishServerSetup}
                disabled={saving}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Saving...' : 'Use This Computer as Server'}
              </button>
            </div>
          )}

          {selectedMode === 'client' && (
            <div className="rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Server API URL</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder={DEFAULT_CLIENT_URL}
                />
                <p className="text-xs text-slate-500 mt-1">Example fallback: http://192.168.1.10:3000/api/v1</p>
              </div>

              {testResult && (
                <p className={`text-sm font-medium ${testResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                  {testResult.message}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => testUrl(serverUrl)}
                  disabled={testing || saving}
                  className="rounded-lg border border-blue-600 px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={finishClientSetup}
                  disabled={testing || saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Client Mode'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
