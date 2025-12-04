import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Activity } from 'lucide-react';
import { predict } from '../services/api';
import type { PredictionResponse } from '../types';

interface NewPredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPredictionModal: React.FC<NewPredictionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [orderId, setOrderId] = useState(`UI-${Math.floor(Math.random() * 100000)}`);
  const [distance, setDistance] = useState(5);
  const [items, setItems] = useState(2);
  const [hubLoad, setHubLoad] = useState(0.5);
  const [traffic, setTraffic] = useState(0.6);
  const [weather, setWeather] = useState<'CLEAR' | 'RAIN' | 'STORM'>('CLEAR');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH'>('NORMAL');
  const [carrier, setCarrier] = useState('BIKE');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setOrderId(`UI-${Math.floor(Math.random() * 100000)}`);
    setDistance(5);
    setItems(2);
    setHubLoad(0.5);
    setTraffic(0.6);
    setWeather('CLEAR');
    setPriority('NORMAL');
    setCarrier('BIKE');
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prediction = await predict({
        order_id: orderId,
        distance,
        items,
        hub_load: hubLoad,
        traffic,
        weather,
        priority,
        carrier,
      });

      setResult(prediction);
    } catch (err: any) {
      console.error(err);
      setError('Failed to get prediction. Check backend & API URL.');
    } finally {
      setLoading(false);
    }
  };

  const riskLabel = (p: number) => {
    if (p >= 0.8) return 'Critical (High chance of SLA miss)';
    if (p >= 0.5) return 'Warning (Moderate risk)';
    return 'Low Risk (Likely on time)';
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                New SLA Prediction
              </h3>
              <p className="text-xs text-slate-500">
                Test the model with a single delivery order
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Order ID */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Distance */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Items */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Items Count
              </label>
              <input
                type="number"
                value={items}
                onChange={(e) => setItems(parseInt(e.target.value || '0', 10))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Hub Load */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Hub Load (0–1)
              </label>
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={hubLoad}
                onChange={(e) => setHubLoad(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Traffic */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Traffic Index (0–1)
              </label>
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={traffic}
                onChange={(e) => setTraffic(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Weather */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Weather
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="CLEAR">Clear</option>
                <option value="RAIN">Rain</option>
                <option value="STORM">Storm</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Carrier */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Carrier
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="BIKE">Bike</option>
                <option value="CAR">Car</option>
                <option value="SCOOTER">Scooter</option>
                <option value="VAN">Van</option>
              </select>
            </div>
          </div>

          {/* Result / Error */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-500">
                  Prediction for {result.order_id}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    result.will_miss_sla ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {result.will_miss_sla ? 'Will Miss SLA' : 'On Time'}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-slate-900">
                  {(result.miss_sla_proba * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500">
                  {riskLabel(result.miss_sla_proba)}
                </span>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Predicting...' : 'Predict SLA'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

