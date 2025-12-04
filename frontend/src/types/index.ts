// src/types/index.ts

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Order {
  order_id: string;
  risk_score: number;
  will_miss_sla: boolean;
  carrier: string;
  timestamp: string;
  destination?: string;
  items?: number;
  distance?: number;
  hub_load?: number;
  traffic?: number;
  weather?: string;
  priority?: string;
}

export interface Stats {
  total: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  accuracy: number;
}

export interface UserProfile {
  email: string;
  name: string;
  avatar: string;
  role: string;
}

export interface AlertConfig {
  enabled: boolean;
  threshold: number;
  emails: string[];
}

export interface PredictionResponse {
  order_id: string;
  miss_sla_proba: number;
  will_miss_sla: boolean;
}

export interface LogEntry {
  order_id: string;
  timestamp: string;
  miss_sla_proba: number;
  will_miss_sla: boolean;
  distance?: number;
  items?: number;
  hub_load?: number;
  traffic?: number;
  weather?: string;
  priority?: string;
  carrier?: string;
}

/**
 * New types for stats + settings
 */

export interface DailyStats {
  total_predictions: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  accuracy: number; // 0–1 or percentage depending on backend
}

export interface TrendsHourlyPoint {
  time: string;
  risk: number;
}

export interface TrendsRiskBucket {
  name: string;
  value: number;
  color?: string;
}

export interface CarrierPerformance {
  name: string;
  onTime: number;
  delayed: number;
}

export interface TrendsResponse {
  hourly: TrendsHourlyPoint[];
  risk_distribution: TrendsRiskBucket[];
  carrier_performance?: CarrierPerformance[];
}

export interface Settings {
  threshold: number;      // 0–1
  enabled: boolean;
  emails: string[];       // list of email addresses
}
