import { useEffect, useState } from "react";
import {
  fetchAlerts,
  acknowledgeAlert,
  resolveAlert,
  postAlertAction,
  fetchAlertActions,
} from "../services/api";

type Alert = {
  id: number;
  order_id: string;
  miss_sla_proba: number;
  threshold: number;
  triggered_at: string;
  status: "open" | "acknowledged" | "resolved";
  severity?: "high" | "medium" | "low" | string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  actual_sla_missed?: number | null;
};

export default function AlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [openActions, setOpenActions] = useState<number | null>(null);
  const [actions, setActions] = useState<Record<number, any[]>>({});

  const severityColor: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-slate-200 text-slate-700",
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts(50);
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000); // Refresh every 10 seconds
    return () => clearInterval(timer);
  }, []);

  const onAck = async (id: number) => {
    try {
      await acknowledgeAlert(id);
      await load();
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
      alert("Failed to acknowledge alert. Please try again.");
    }
  };

  const onResolve = async (id: number, missed: boolean) => {
    try {
      const notes = window.prompt("Resolution notes (optional):") ?? undefined;
      await resolveAlert(id, missed, notes);
      await load();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
      alert("Failed to resolve alert. Please try again.");
    }
  };

  const onAction = async (id: number, type: string) => {
    try {
      await postAlertAction(id, type);
      console.log(`Recorded action ${type} for alert ${id}`);

      if (openActions === id) {
        await loadActions(id);
      }
    } catch (err) {
      console.error("Failed to record action:", err);
      alert("Failed to record action. Please try again.");
    }
  };

  const loadActions = async (alertId: number) => {
    try {
      const data = await fetchAlertActions(alertId);
      setActions((prev) => ({ ...prev, [alertId]: data }));
    } catch (err) {
      console.error("Failed to load alert actions:", err);
      alert("Failed to load alert actions. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 text-lg">Recent Alerts</h2>
        {loading && (
          <span className="text-xs text-slate-400">Refreshing…</span>
        )}
      </div>

      {!loading && alerts.length === 0 && (
        <div className="text-slate-400 text-sm">No alerts yet</div>
      )}

      {alerts.length > 0 && (
        <div className="max-h-[380px] overflow-y-auto space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-slate-900 text-sm">
                  {a.order_id}
                </span>
                <span
                  className={`uppercase text-[10px] px-2 py-0.5 rounded-full ${severityColor[a.severity ?? "medium"] ??
                    "bg-slate-200 text-slate-700"
                    }`}
                >
                  {a.severity ?? "medium"}
                </span>
              </div>
              <div className="flex gap-3 mt-1 text-slate-600 text-xs">
                <span>
                  Risk: <span className="font-medium">{(a.miss_sla_proba * 100).toFixed(1)}%</span>
                </span>
                <span>
                  Thresh: {(a.threshold * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {new Date(a.triggered_at).toLocaleString()}
              </div>

              {/* Resolution info if resolved */}
              {a.status === "resolved" && a.resolved_at && (
                <div className="text-xs text-slate-500 mt-1">
                  Resolved: {new Date(a.resolved_at).toLocaleString()}
                  {a.actual_sla_missed !== null && (
                    <span className="ml-2">
                      ({a.actual_sla_missed === 1 ? "SLA Missed" : "SLA Met"})
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-2 flex flex-wrap gap-1">
                {a.status === "open" && (
                  <button
                    className="px-2 py-1 text-[11px] rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                    onClick={() => onAck(a.id)}
                  >
                    Acknowledge
                  </button>
                )}
                {a.status !== "resolved" && (
                  <>
                    <button
                      className="px-2 py-1 text-[11px] rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      onClick={() => onResolve(a.id, false)}
                    >
                      Resolved – SLA Met
                    </button>
                    <button
                      className="px-2 py-1 text-[11px] rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      onClick={() => onResolve(a.id, true)}
                    >
                      Resolved – SLA Missed
                    </button>
                  </>
                )}

                {/* Automation action buttons */}
                {a.status !== "resolved" && (
                  <>
                    <button
                      className="px-2 py-1 text-[11px] rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => onAction(a.id, "REROUTE")}
                    >
                      Reroute
                    </button>
                    <button
                      className="px-2 py-1 text-[11px] rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => onAction(a.id, "ESCALATE")}
                    >
                      Escalate
                    </button>
                    <button
                      className="px-2 py-1 text-[11px] rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => onAction(a.id, "CARRIER_RECOMMEND")}
                    >
                      Carrier
                    </button>
                    <button
                      className="px-2 py-1 text-[11px] rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => onAction(a.id, "DELAY_BROADCAST")}
                    >
                      Delay Msg
                    </button>
                  </>
                )}

                <button
                  className="px-2 py-0.5 text-[11px] rounded border border-slate-700"
                  onClick={async () => {
                    if (openActions === a.id) {
                      setOpenActions(null);
                    } else {
                      setOpenActions(a.id);
                      await loadActions(a.id);
                    }
                  }}
                >
                  {openActions === a.id ? "Hide actions" : "View actions"}
                </button>
              </div>

              {openActions === a.id && (
                <div className="mt-2 bg-slate-900 rounded p-2 text-[11px] text-slate-100">
                  {actions[a.id]?.length === 0 && (
                    <div className="text-slate-400">No actions recorded</div>
                  )}

                  {actions[a.id]?.map((act, i) => (
                    <div
                      key={i}
                      className="border-b border-slate-800 py-1 last:border-0"
                    >
                      <div className="font-semibold">{act.action_type}</div>
                      <div className="text-slate-400">
                        {new Date(act.created_at).toLocaleString()}
                      </div>
                      {act.payload && (
                        <pre className="text-slate-300 text-[10px] whitespace-pre-wrap">
                          {JSON.stringify(
                            typeof act.payload === "string"
                              ? JSON.parse(act.payload)
                              : act.payload,
                            null,
                            2
                          )}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
