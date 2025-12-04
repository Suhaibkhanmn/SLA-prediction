// src/pages/Trends.tsx

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getTrends } from '../services/api';
import type { TrendsResponse, TrendsHourlyPoint, CarrierPerformance } from '../types';

export const Trends: React.FC = () => {
  const [hourlyData, setHourlyData] = useState<TrendsHourlyPoint[]>([]);
  const [carrierPerf, setCarrierPerf] = useState<CarrierPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrends = async () => {
      try {
        setLoading(true);
        setError(null);
        const res: TrendsResponse = await getTrends();

        setHourlyData(res.hourly ?? []);
        setCarrierPerf(res.carrier_performance ?? []);
      } catch (err) {
        console.error('Failed to load trends:', err);
        setError('Live trends unavailable. Please retry.');
      } finally {
        setLoading(false);
      }
    };

    loadTrends();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Trends</h1>
        <p className="text-slate-500 text-sm">
          {loading
            ? 'Loading live trends...'
            : error ?? 'Carrier performance and hourly risk volume.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carrier Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6">Carrier SLA Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierPerf} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fontSize: 13, fill: '#475569' }}
                />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px' }} />
                <Legend />
                <Bar
                  dataKey="onTime"
                  name="On Time %"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                />
                <Bar
                  dataKey="delayed"
                  name="Delayed %"
                  stackId="a"
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Risk Volume */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6">Risk Volume by Hour</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="risk" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
