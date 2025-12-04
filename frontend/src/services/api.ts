// src/services/api.ts
import {
  Order,
  PredictionResponse,
  DailyStats,
  TrendsResponse,
  Settings,
  TrendsHourlyPoint,
  TrendsRiskBucket,
  CarrierPerformance,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders(extra?: HeadersInit): HeadersInit {
  const stored = localStorage.getItem("sla_auth");
  let token: string | null = null;
  if (stored) {
    try {
      token = JSON.parse(stored).token;
    } catch {
      token = null;
    }
  }

  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ------------------------------
// HEALTH
// ------------------------------
export async function getHealth() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

// ------------------------------
// LOGS
// ------------------------------
export async function getLogs(limit: number = 50): Promise<Order[]> {
  const res = await fetch(`${API_URL}/logs?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch logs");

  const data = await res.json();

  return data.map((log: any) => ({
    order_id: log.order_id,
    risk_score: log.miss_sla_proba,
    will_miss_sla: log.will_miss_sla,
    carrier: log.carrier || "Unknown",
    timestamp: log.timestamp,
    destination: "Unknown",
    items: log.items,
    distance: log.distance,
    hub_load: log.hub_load,
    traffic: log.traffic,
    weather: log.weather,
    priority: log.priority,
  }));
}

// ------------------------------
// PREDICT
// ------------------------------
export async function predict(
  order: Partial<Order>
): Promise<PredictionResponse> {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      order_id: order.order_id,
      created_at: new Date().toISOString(),
      promised_at: new Date(Date.now() + 3600000).toISOString(),
      distance_km: order.distance || 5,
      items_count: order.items || 1,
      hub_load: order.hub_load || 0.5,
      traffic_index: order.traffic || 0.5,
      weather_code: order.weather || "CLEAR",
      priority: order.priority || "NORMAL",
      carrier: order.carrier || "BIKE",
    }),
  });

  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}

// ------------------------------
// STATS
// ------------------------------

export async function fetchOpsStats() {
  const res = await fetch(`${API_URL}/stats/ops`, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error("Failed to load ops stats");
  }
  return res.json();
}

function normalizeHourly(data: any[] = []): TrendsHourlyPoint[] {
  return data
    .map((point) => ({
      time: point.time ?? point.hour ?? point.label ?? '00:00',
      risk: point.risk ?? point.high_risk ?? point.value ?? 0,
    }))
    .filter((point) => Boolean(point.time));
}

function normalizeRiskDistribution(data: any[] = []): TrendsRiskBucket[] {
  return data.map((bucket) => ({
    name: bucket.name ?? bucket.label ?? 'Unknown',
    value: bucket.value ?? bucket.count ?? 0,
    color: bucket.color,
  }));
}

function normalizeCarrierPerformance(data: any[] = []): CarrierPerformance[] {
  return data.map((carrier) => ({
    name: carrier.name ?? 'Unknown',
    onTime: carrier.onTime ?? carrier.on_time ?? carrier.on_time_pct ?? 0,
    delayed:
      carrier.delayed ??
      carrier.delayed_pct ??
      (typeof carrier.onTime === 'number' ? Math.max(0, 100 - carrier.onTime) : 0),
  }));
}

export async function getDailyStats(): Promise<DailyStats> {
  const res = await fetch(`${API_URL}/stats/today`, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error('Failed to fetch daily stats');
  }
  const data = await res.json();
  return {
    total_predictions: data.total_predictions ?? data.total ?? 0,
    high_risk: data.high_risk ?? 0,
    medium_risk: data.medium_risk ?? 0,
    low_risk: data.low_risk ?? 0,
    accuracy: data.accuracy ?? 0,
  };
}

export async function getTrends(): Promise<TrendsResponse> {
  const res = await fetch(`${API_URL}/stats/trends`, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error('Failed to fetch trends');
  }
  const data = await res.json();
  return {
    hourly: normalizeHourly(data.hourly),
    risk_distribution: normalizeRiskDistribution(data.risk_distribution),
    carrier_performance: normalizeCarrierPerformance(data.carrier_performance),
  };
}

// ------------------------------
// SETTINGS
// ------------------------------
export async function getSettings(): Promise<Settings> {
  const res = await fetch(`${API_URL}/settings`, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error('Failed to fetch settings');
  }
  return res.json();
}

export async function updateSettings(
  payload: Settings
): Promise<Settings> {
  const res = await fetch(`${API_URL}/settings`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to update settings");
  }
  return res.json();
}

// ------------------------------
// ALERTS
// ------------------------------

export async function fetchAlerts(limit = 50, status?: string) {
  const url = new URL(`${API_URL}/alerts`);
  url.searchParams.set("limit", `${limit}`);
  if (status) {
    url.searchParams.set("status", status);
  }
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) {
    throw new Error("Failed to load alerts");
  }
  return res.json();
}

export async function acknowledgeAlert(id: number) {
  const res = await fetch(`${API_URL}/alerts/${id}/ack`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to acknowledge alert");
  }
  return res.json();
}

export async function resolveAlert(
  id: number,
  actualMissed: boolean,
  notes?: string
) {
  const res = await fetch(`${API_URL}/alerts/${id}/resolve`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      actual_sla_missed: actualMissed,
      resolution_notes: notes ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to resolve alert");
  }
  return res.json();
}

export async function postAlertAction(
  id: number,
  actionType: string,
  payload?: any
) {
  const res = await fetch(`${API_URL}/alerts/${id}/actions`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      action_type: actionType,
      payload: payload ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to record action");
  }
  return res.json();
}

export async function fetchAlertActions(alertId: number) {
  const res = await fetch(`${API_URL}/alerts/${alertId}/actions`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to load alert actions");
  }
  return res.json();
}