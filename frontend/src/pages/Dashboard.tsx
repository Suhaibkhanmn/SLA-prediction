// src/pages/Dashboard.tsx

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Clock, CheckCircle, Archive, Plus } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { getDailyStats, getTrends, fetchOpsStats } from '../services/api';
import { NewPredictionModal } from '../components/NewPredictionModal';
import AlertPanel from '../components/AlertPanel';
import type {
  DailyStats,
  TrendsResponse,
  TrendsHourlyPoint,
  TrendsRiskBucket,
} from '../types';

interface DashboardProps {
  onViewAll: () => void;
}

const RISK_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366f1'];

export const Dashboard: React.FC<DashboardProps> = ({ onViewAll }) => {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [hourlyData, setHourlyData] = useState<TrendsHourlyPoint[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<TrendsRiskBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  const [ops, setOps] = useState<any | null>(null);

  useEffect(() => {
    const loadStatsAndTrends = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, trendsRes] = await Promise.all([getDailyStats(), getTrends()]);
        setStats(statsRes);

        const trends: TrendsResponse = trendsRes;
        setHourlyData(trends.hourly ?? []);

        const withColors = (trends.risk_distribution ?? []).map((bucket, idx) => ({
          ...bucket,
          color: bucket.color || RISK_COLORS[idx % RISK_COLORS.length],
        }));
        setRiskDistribution(withColors);
      } catch (err) {
        console.error('Failed to load stats/trends:', err);
        setError('Live stats unavailable. Please retry.');
      } finally {
        setLoading(false);
      }
    };

    loadStatsAndTrends();
    fetchOpsStats().then(setOps).catch(console.error);
  }, []);

  const totalPredictions = stats?.total_predictions ?? 0;
  const highRisk = stats?.high_risk ?? 0;
  const mediumRisk = stats?.medium_risk ?? 0;
  const accuracyValue = stats?.accuracy;
  const accuracy =
    accuracyValue === undefined
      ? '--'
      : `${(accuracyValue <= 1 ? accuracyValue * 100 : accuracyValue).toFixed(1)}%`;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Operations Overview</h1>
            <p className="text-slate-500 text-sm">
              {loading
                ? 'Loading live metrics...'
                : error ?? 'Real-time metrics for today.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPredictModalOpen(true)}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Prediction
            </button>
            <button className="hidden md:flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
              <Archive className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Predictions"
            value={totalPredictions.toLocaleString()}
            icon={Activity}
            trend="12%"
            trendUp={true}
          />
          <StatCard
            title="High Risk Orders"
            value={highRisk.toLocaleString()}
            icon={AlertTriangle}
            trend="5%"
            trendUp={false}
          />
          <StatCard
            title="Medium Risk Orders"
            value={mediumRisk.toLocaleString()}
            icon={Clock}
            trend="3%"
            trendUp={false}
          />
          <StatCard
            title="Model Accuracy"
            value={accuracy}
            icon={CheckCircle}
            trend="0.4%"
            trendUp={true}
          />
          {ops && (
            <>
              <StatCard
                title="Resolution %"
                value={`${ops.resolution_rate}%`}
                icon={CheckCircle}
                trend=""
                trendUp={true}
              />
              <StatCard
                title="Mean Response Time"
                value={`${Math.round((ops.mean_response_time_sec ?? 0) / 60)} min`}
                icon={Clock}
                trend=""
                trendUp={false}
              />
              <StatCard
                title="False Positives"
                value={`${ops.false_positive_rate}%`}
                icon={AlertTriangle}
                trend=""
                trendUp={false}
              />
              <StatCard
                title="Total Alerts"
                value={ops.total_alerts?.toLocaleString?.() ?? ops.total_alerts}
                icon={Activity}
                trend=""
                trendUp={true}
              />
            </>
          )}
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">High Risk Volume (24h)</h3>
              <button
                onClick={onViewAll}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Trends &rarr;
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-6">Current Risk Split</h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-2xl font-bold text-slate-900">
                  {totalPredictions.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">Total</span>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color || '#6366f1' }}
                    />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {totalPredictions > 0 ? Math.round((item.value / totalPredictions) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="mt-6">
          <AlertPanel />
        </div>
      </div>

      {/* Modal */}
      <NewPredictionModal
        isOpen={isPredictModalOpen}
        onClose={() => setIsPredictModalOpen(false)}
      />
    </>
  );
};
