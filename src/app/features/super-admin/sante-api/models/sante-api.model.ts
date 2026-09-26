export interface ApiHealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface SystemHealthReport {
  statut_global: 'healthy' | 'unhealthy';
  message: string;
  server_timestamp: string;
  client_latency_ms: number;
  derniere_verification: string;
}
