import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { logger } from '../../config/logger';

/**
 * Serviço de métricas Prometheus
 * Coleta métricas de performance, throughput e health do sistema
 */
export class PrometheusService {
  public readonly register: Registry;

  // Contadores
  public readonly webhookReceived: Counter;
  public readonly messagesProcessed: Counter;
  public readonly messagesSucceeded: Counter;
  public readonly messagesFailed: Counter;
  public readonly apiCallsTotal: Counter;

  // Histogramas (latência)
  public readonly webhookProcessingDuration: Histogram;
  public readonly messageProcessingDuration: Histogram;
  public readonly apiCallDuration: Histogram;
  public readonly queueJobDuration: Histogram;

  // Gauges (valores atuais)
  public readonly activeConnections: Gauge;
  public readonly queueSize: Gauge;
  public readonly cacheHitRate: Gauge;

  constructor() {
    this.register = new Registry();

    // Coleta métricas padrão do Node.js
    collectDefaultMetrics({ register: this.register });

    // === CONTADORES ===

    this.webhookReceived = new Counter({
      name: 'zaptrix_webhook_received_total',
      help: 'Total de webhooks recebidos',
      labelNames: ['source', 'type'],
      registers: [this.register],
    });

    this.messagesProcessed = new Counter({
      name: 'zaptrix_messages_processed_total',
      help: 'Total de mensagens processadas',
      labelNames: ['direction', 'status'],
      registers: [this.register],
    });

    this.messagesSucceeded = new Counter({
      name: 'zaptrix_messages_succeeded_total',
      help: 'Total de mensagens enviadas com sucesso',
      labelNames: ['direction'],
      registers: [this.register],
    });

    this.messagesFailed = new Counter({
      name: 'zaptrix_messages_failed_total',
      help: 'Total de mensagens que falharam',
      labelNames: ['direction', 'error_type'],
      registers: [this.register],
    });

    this.apiCallsTotal = new Counter({
      name: 'zaptrix_api_calls_total',
      help: 'Total de chamadas API externas',
      labelNames: ['service', 'method', 'status'],
      registers: [this.register],
    });

    // === HISTOGRAMAS ===

    this.webhookProcessingDuration = new Histogram({
      name: 'zaptrix_webhook_processing_duration_seconds',
      help: 'Duração do processamento de webhooks',
      labelNames: ['source', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.messageProcessingDuration = new Histogram({
      name: 'zaptrix_message_processing_duration_seconds',
      help: 'Duração do processamento de mensagens',
      labelNames: ['direction'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.apiCallDuration = new Histogram({
      name: 'zaptrix_api_call_duration_seconds',
      help: 'Duração de chamadas API externas',
      labelNames: ['service', 'method'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.queueJobDuration = new Histogram({
      name: 'zaptrix_queue_job_duration_seconds',
      help: 'Duração de processamento de jobs na fila',
      labelNames: ['queue', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    // === GAUGES ===

    this.activeConnections = new Gauge({
      name: 'zaptrix_active_connections',
      help: 'Número de conexões ativas',
      labelNames: ['type'],
      registers: [this.register],
    });

    this.queueSize = new Gauge({
      name: 'zaptrix_queue_size',
      help: 'Tamanho atual das filas',
      labelNames: ['queue', 'status'],
      registers: [this.register],
    });

    this.cacheHitRate = new Gauge({
      name: 'zaptrix_cache_hit_rate',
      help: 'Taxa de acerto do cache',
      registers: [this.register],
    });

    logger.info('📊 Prometheus metrics inicializadas');
  }

  /**
   * Registra recebimento de webhook
   */
  recordWebhookReceived(source: 'meta' | 'bitrix24', type: string): void {
    this.webhookReceived.inc({ source, type });
  }

  /**
   * Registra processamento de mensagem
   */
  recordMessageProcessed(direction: 'incoming' | 'outbound', status: 'success' | 'failed'): void {
    this.messagesProcessed.inc({ direction, status });

    if (status === 'success') {
      this.messagesSucceeded.inc({ direction });
    } else {
      this.messagesFailed.inc({ direction, error_type: 'processing_error' });
    }
  }

  /**
   * Registra chamada API
   */
  recordApiCall(service: 'meta' | 'bitrix24', method: string, status: number): void {
    this.apiCallsTotal.inc({ service, method, status: status.toString() });
  }

  /**
   * Mede duração de processamento de webhook
   */
  measureWebhookProcessing(source: 'meta' | 'bitrix24'): () => void {
    const end = this.webhookProcessingDuration.startTimer({ source });
    return () => end({ status: 'success' });
  }

  /**
   * Mede duração de processamento de mensagem
   */
  measureMessageProcessing(direction: 'incoming' | 'outbound'): () => void {
    const end = this.messageProcessingDuration.startTimer({ direction });
    return () => end();
  }

  /**
   * Mede duração de chamada API
   */
  measureApiCall(service: 'meta' | 'bitrix24', method: string): () => void {
    const end = this.apiCallDuration.startTimer({ service, method });
    return () => end();
  }

  /**
   * Mede duração de job na fila
   */
  measureQueueJob(queue: string): () => void {
    const end = this.queueJobDuration.startTimer({ queue });
    return (status: 'success' | 'failed' = 'success') => end({ status });
  }

  /**
   * Atualiza tamanho da fila
   */
  updateQueueSize(queue: string, status: string, size: number): void {
    this.queueSize.set({ queue, status }, size);
  }

  /**
   * Atualiza taxa de acerto do cache
   */
  updateCacheHitRate(rate: number): void {
    this.cacheHitRate.set(rate);
  }

  /**
   * Atualiza número de conexões ativas
   */
  updateActiveConnections(type: 'redis' | 'postgres', count: number): void {
    this.activeConnections.set({ type }, count);
  }

  /**
   * Exporta métricas no formato Prometheus
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Retorna métricas em formato JSON
   */
  async getMetricsJSON(): Promise<any> {
    const metrics = await this.register.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Reseta todas as métricas (útil para testes)
   */
  reset(): void {
    this.register.resetMetrics();
  }
}

// Exporta instância singleton
export const prometheusService = new PrometheusService();

