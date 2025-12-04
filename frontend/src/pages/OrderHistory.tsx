import { useState, useEffect } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { AIModal } from '../components/AIModal';
import { getLogs } from '../services/api';
import { callGemini } from '../services/gemini';
import type { Order } from '../types';

export const OrderHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftResult, setDraftResult] = useState("");
  const [selectedDraftOrder, setSelectedDraftOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const logs = await getLogs(50);
        setOrders(logs);
        setError(null);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError('Unable to load orders from backend.');
      }
    };
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(o =>
    o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.carrier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDraftEmail = async (order: Order) => {
    setSelectedDraftOrder(order);
    setIsDraftModalOpen(true);
    setDraftLoading(true);

    const prompt = `
      Write a polite, empathetic customer service email for Order ${order.order_id}.

      Context: The order is delayed.
      Carrier: ${order.carrier}
      Destination: ${order.destination || 'Unknown'}
      
      Tone: Professional but apologetic.
      Length: Short (2-3 sentences max).
      Action: Offering a 5% discount code "SORRY5".
    `;

    const result = await callGemini(prompt);
    setDraftResult(result);
    setDraftLoading(false);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, Carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Order ID</th>
                <th className="p-4 font-semibold text-slate-600">Date</th>
                <th className="p-4 font-semibold text-slate-600">Carrier</th>
                <th className="p-4 font-semibold text-slate-600">Destination</th>
                <th className="p-4 font-semibold text-slate-600">Risk</th>
                <th className="p-4 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-slate-600">{order.order_id}</td>
                  <td className="p-4 text-slate-500">{new Date(order.timestamp).toLocaleDateString()}</td>
                  <td className="p-4">{order.carrier}</td>
                  <td className="p-4">{order.destination || 'Unknown'}</td>
                  <td className="p-4"><RiskBadge score={order.risk_score} /></td>
                  <td className="p-4">
                    {order.will_miss_sla ? (
                      <button
                        onClick={() => handleDraftEmail(order)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Draft Email
                      </button>
                    ) : (
                      <span className="text-emerald-600 text-xs font-medium">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="p-8 text-center text-slate-500">No orders found matching your search.</div>
          )}
        </div>
      </div>

      <AIModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        title={`Draft Alert: ${selectedDraftOrder?.order_id}`}
        content={draftResult}
        isLoading={draftLoading}
        onAction={() => navigator.clipboard.writeText(draftResult)}
      />
    </>
  );
};

