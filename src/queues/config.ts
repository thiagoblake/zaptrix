import { QueueOptions, WorkerOptions, DefaultJobOptions } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Configuração base para conexão com Redis (BullMQ)
 */
export const queueConnection = {
  connection: redis,
};

/**
 * Configurações padrão para todas as filas
 */
export const defaultQueueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1 segundo inicial
    },
    removeOnComplete: {
      age: 24 * 3600, // Remove após 24 horas
      count: 1000, // Mantém últimos 1000
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Remove após 7 dias
    },
  },
};

/**
 * Configurações para workers
 */
export const defaultWorkerOptions: Omit<WorkerOptions, 'connection'> = {
  connection: redis,
  concurrency: 5, // Processar até 5 jobs em paralelo
  limiter: {
    max: 10, // Máximo 10 jobs
    duration: 1000, // Por segundo
  },
};

/**
 * Configurações específicas por fila
 */
export const queueConfigs = {
  // Fila para mensagens recebidas do WhatsApp
  incomingMessages: {
    name: 'incoming-messages',
    options: {
      ...defaultQueueOptions,
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        priority: 1, // Alta prioridade
      } as DefaultJobOptions,
    },
    workerOptions: {
      ...defaultWorkerOptions,
      concurrency: 10, // Mais concorrência para mensagens recebidas
    },
  },

  // Fila para mensagens de saída do Bitrix24
  outboundMessages: {
    name: 'outbound-messages',
    options: {
      ...defaultQueueOptions,
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        priority: 2, // Prioridade média
      } as DefaultJobOptions,
    },
    workerOptions: {
      ...defaultWorkerOptions,
      concurrency: 8,
    },
  },

  // Fila para envio via Meta API
  metaMessages: {
    name: 'meta-messages',
    options: {
      ...defaultQueueOptions,
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        priority: 1,
        attempts: 5, // Mais tentativas para envio
      } as DefaultJobOptions,
    },
    workerOptions: {
      ...defaultWorkerOptions,
      concurrency: 5,
    },
  },

  // Fila para envio via Bitrix24 API
  bitrix24Messages: {
    name: 'bitrix24-messages',
    options: {
      ...defaultQueueOptions,
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        priority: 1,
        attempts: 5,
      } as DefaultJobOptions,
    },
    workerOptions: {
      ...defaultWorkerOptions,
      concurrency: 5,
    },
  },
};

/**
 * Event handlers para todas as filas
 */
export const setupQueueEvents = (queueName: string) => {
  logger.info(`📋 Fila '${queueName}' inicializada`);
};

export const setupWorkerEvents = (workerName: string) => {
  logger.info(`👷 Worker '${workerName}' inicializado`);
};

