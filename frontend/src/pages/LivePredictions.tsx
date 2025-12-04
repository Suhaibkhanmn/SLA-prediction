import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Truck, Sparkles } from "lucide-react";
import { RiskBadge } from "../components/RiskBadge";
import { AIModal } from "../components/AIModal";
import { getLogs } from "../services/api";
import { callGemini } from "../services/gemini";
import type { Order } from "../types";

export const LivePredictions: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [selectedOrderForAi, setSelectedOrderForAi] = useState<Order | null>(null);

  /* Load initial logs */
  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logs = await getLogs(20);
      setOrders(logs);
    } catch (err) {
      console.error("Backend not reachable:", err);
    }
  };

  /* Auto-refresh every 3 seconds */
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleAnalyzeRisk = async (order: Order) => {
    setSelectedOrderForAi(order);
    setIsAiModalOpen(true);
    setAiLoading(true);

    const prompt = `
      You are a logistics expert. Analyze this high-risk delivery order:

      Order ID: ${order.order_id}
      Carrier: ${order.carrier}
      Risk Score: ${order.risk_score}

      Explain why it may miss SLA and suggest a single operational fix.
      Keep it under 80 words.
    `;

    const result = await callGemini(prompt);
    setAiResult(result);
    setAiLoading(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isPaused ? "bg-slate-300" : "bg-emerald-500 animate-pulse"}`} />
            <h2 className="font-bold text-slate-900">Live Ingest Feed</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
              Updates every 3s
            </span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {isPaused ? "Resume Stream" : "Pause Stream"}
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Time</th>
                <th className="p-4">Carrier</th>
                <th className="p-4">Risk</th>
                <th className="p-4">Prediction</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {orders.map((order) => (
                  <motion.tr
                    key={order.order_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hover:bg-slate-50"
                  >
                    <td className="p-4 font-mono">{order.order_id}</td>
                    <td className="p-4">{new Date(order.timestamp).toLocaleTimeString()}</td>
                    <td className="p-4 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      {order.carrier}
                    </td>
                    <td className="p-4"><RiskBadge score={order.risk_score} /></td>
                    <td className="p-4">
                      {order.will_miss_sla ? (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Will Miss
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">On Time</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {order.risk_score > 0.7 ? (
                        <button
                          onClick={() => handleAnalyzeRisk(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-xs border border-indigo-200"
                        >
                          <Sparkles className="w-3 h-3" />
                          Analyze
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Normal</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <AIModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title={`Risk Analysis: ${selectedOrderForAi?.order_id}`}
        content={aiResult}
        isLoading={aiLoading}
      />
    </>
  );
};
