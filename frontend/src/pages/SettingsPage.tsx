// src/pages/SettingsPage.tsx

import { useEffect, useState } from 'react';
import { AlertOctagon, Mail } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';
import type { Settings } from '../types';

export const SettingsPage: React.FC = () => {
  const [threshold, setThreshold] = useState(0.8);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailsText, setEmailsText] = useState('ops@company.com');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const s: Settings = await getSettings();
        setThreshold(s.threshold);
        setEmailEnabled(s.enabled);
        setEmailsText(s.emails.join(', '));
        setError(null);
      } catch (err) {
        console.error('Failed to load settings', err);
        setError('Failed to load settings, using defaults.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: Settings = {
        threshold,
        enabled: emailEnabled,
        emails: emailsText
          .split(',')
          .map(e => e.trim())
          .filter(Boolean),
      };

      await updateSettings(payload);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Alert Configurations</h1>

      {loading && (
        <div className="mb-4 text-sm text-slate-500">
          Loading settings from backend...
        </div>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-indigo-600" />
            Risk Thresholds
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Determine when an order is flagged as &quot;High Risk&quot;.
          </p>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <div className="flex justify-between mb-4">
              <span className="font-medium text-slate-700">
                SLA Breach Probability Threshold
              </span>
              <span className="font-bold text-indigo-600 text-lg">
                {(threshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={threshold}
              disabled={loading || saving}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Strict (10%)</span>
              <span>Loose (100%)</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-indigo-600" />
            Notifications
          </h3>

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-medium text-slate-700">Email Alerts</p>
              <p className="text-sm text-slate-500">
                Receive instant digests for high-risk batches.
              </p>
            </div>
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => setEmailEnabled(!emailEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${emailEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${emailEnabled ? 'left-7' : 'left-1'
                  }`}
              />
            </button>
          </div>

          {emailEnabled && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Recipients (comma separated)
              </label>
              <textarea
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                disabled={loading || saving}
                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
          >
            Test Alert
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg shadow-sm shadow-indigo-200 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
