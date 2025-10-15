import { Queue } from 'bullmq';
import { queueConfigs, setupQueueEvents } from './config';
import { logger } from '../config/logger';
import type {
  ProcessIncomingMessageJob,
  ProcessOutboundMessageJob,
  SendMetaMessageJob,
  SendBitrix24MessageJob,
} from './types';

/**
 * Fila para processar mensagens recebidas do WhatsApp
 */
export const incomingMessagesQueue = new Queue<ProcessIncomingMessageJob>(
  queueConfigs.incomingMessages.name,
  queueConfigs.incomingMessages.options
);

/**
 * Fila para processar mensagens de saída do Bitrix24
 */
export const outboundMessagesQueue = new Queue<ProcessOutboundMessageJob>(
  queueConfigs.outboundMessages.name,
  queueConfigs.outboundMessages.options
);

/**
 * Fila para enviar mensagens via Meta API
 */
export const metaMessagesQueue = new Queue<SendMetaMessageJob>(
  queueConfigs.metaMessages.name,
  queueConfigs.metaMessages.options
);

/**
 * Fila para enviar mensagens via Bitrix24 API
 */
export const bitrix24MessagesQueue = new Queue<SendBitrix24MessageJob>(
  queueConfigs.bitrix24Messages.name,
  queueConfigs.bitrix24Messages.options
);

// Setup event listeners
setupQueueEvents(queueConfigs.incomingMessages.name);
setupQueueEvents(queueConfigs.outboundMessages.name);
setupQueueEvents(queueConfigs.metaMessages.name);
setupQueueEvents(queueConfigs.bitrix24Messages.name);

/**
 * Adiciona job para processar mensagem recebida
 */
export async function addIncomingMessageJob(data: ProcessIncomingMessageJob): Promise<void> {
  try {
    await incomingMessagesQueue.add('process', data, {
      jobId: data.messageId, // Usa messageId como jobId para deduplicação
    });

    logger.info({
      msg: '📥 Job de mensagem recebida adicionado à fila',
      messageId: data.messageId,
      from: data.from,
    });
  } catch (error) {
    logger.error({
      msg: '❌ Erro ao adicionar job de mensagem recebida',
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * Adiciona job para processar mensagem de saída
 */
export async function addOutboundMessageJob(data: ProcessOutboundMessageJob): Promise<void> {
  try {
    await outboundMessagesQueue.add('process', data, {
      jobId: data.messageId, // Deduplicação
    });

    logger.info({
      msg: '📤 Job de mensagem de saída adicionado à fila',
      messageId: data.messageId,
      bitrixChatId: data.bitrixChatId,
    });
  } catch (error) {
    logger.error({
      msg: '❌ Erro ao adicionar job de mensagem de saída',
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * Adiciona job para enviar mensagem via Meta API
 */
export async function addMetaMessageJob(data: SendMetaMessageJob): Promise<void> {
  try {
    await metaMessagesQueue.add('send', data);

    logger.debug({
      msg: '📱 Job de envio Meta adicionado à fila',
      to: data.to,
    });
  } catch (error) {
    logger.error({
      msg: '❌ Erro ao adicionar job de envio Meta',
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * Adiciona job para enviar mensagem via Bitrix24 API
 */
export async function addBitrix24MessageJob(data: SendBitrix24MessageJob): Promise<void> {
  try {
    await bitrix24MessagesQueue.add('send', data);

    logger.debug({
      msg: '🏢 Job de envio Bitrix24 adicionado à fila',
      chatId: data.chatId,
    });
  } catch (error) {
    logger.error({
      msg: '❌ Erro ao adicionar job de envio Bitrix24',
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * Obtém estatísticas das filas
 */
export async function getQueuesStats() {
  try {
    const [incoming, outbound, meta, bitrix24] = await Promise.all([
      incomingMessagesQueue.getJobCounts(),
      outboundMessagesQueue.getJobCounts(),
      metaMessagesQueue.getJobCounts(),
      bitrix24MessagesQueue.getJobCounts(),
    ]);

    return {
      incomingMessages: incoming,
      outboundMessages: outbound,
      metaMessages: meta,
      bitrix24Messages: bitrix24,
    };
  } catch (error) {
    logger.error({
      msg: '❌ Erro ao obter estatísticas das filas',
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

/**
 * Fecha todas as filas
 */
export async function closeQueues(): Promise<void> {
  await Promise.all([
    incomingMessagesQueue.close(),
    outboundMessagesQueue.close(),
    metaMessagesQueue.close(),
    bitrix24MessagesQueue.close(),
  ]);
  logger.info('📋 Todas as filas fechadas');
}

