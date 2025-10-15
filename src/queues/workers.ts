import { Worker, Job } from 'bullmq';
import { queueConfigs, setupWorkerEvents } from './config';
import { logger } from '../config/logger';
import { conversationMapper } from '../core/mapper';
import { metaService } from '../services/meta/meta.service';
import { bitrix24Service } from '../services/bitrix24/bitrix24.service';
import { cacheService } from '../services/cache/cache.service';
import { prometheusService } from '../services/metrics/prometheus.service';
import type {
  ProcessIncomingMessageJob,
  ProcessOutboundMessageJob,
  SendMetaMessageJob,
  SendBitrix24MessageJob,
  JobResult,
} from './types';

/**
 * Worker para processar mensagens recebidas do WhatsApp
 */
export const incomingMessagesWorker = new Worker<ProcessIncomingMessageJob, JobResult>(
  queueConfigs.incomingMessages.name,
  async (job: Job<ProcessIncomingMessageJob>) => {
    const { messageId, from, contactName, messageText } = job.data;
    const endTimer = prometheusService.measureQueueJob('incoming-messages');

    logger.info({
      msg: '⚙️ Processando mensagem recebida',
      jobId: job.id,
      messageId,
      from,
    });

    try {
      // Verifica se já foi processada (deduplicação)
      const isProcessed = await cacheService.isMessageProcessed(messageId);
      if (isProcessed) {
        logger.warn({
          msg: '⚠️ Mensagem já processada, ignorando',
          messageId,
        });
        return { success: true, message: 'Already processed' };
      }

      // Marca mensagem como lida no WhatsApp
      await metaService.markAsRead(messageId);

      // Busca ou cria mapeamento
      let mapping = await conversationMapper.findByMetaId(from);

      if (!mapping) {
        // Novo contato - cria no Bitrix24
        const contactId = await bitrix24Service.createContact({
          NAME: contactName,
          PHONE: [{ VALUE: from, VALUE_TYPE: 'WORK' }],
        });

        if (!contactId) {
          throw new Error('Falha ao criar contato no Bitrix24');
        }

        // Cria chat do Canal Aberto
        const chatId = await bitrix24Service.createOpenLineChat(
          from,
          `WhatsApp: ${contactName}`
        );

        if (!chatId) {
          throw new Error('Falha ao criar chat no Canal Aberto');
        }

        // Cria mapeamento
        mapping = await conversationMapper.create({
          metaWhatsappId: from,
          bitrixContactId: contactId,
          bitrixChatId: chatId,
          contactName: contactName,
        });

        if (!mapping) {
          throw new Error('Falha ao criar mapeamento');
        }
      } else {
        // Atualiza timestamp
        await conversationMapper.updateLastMessage(from);
      }

      // Envia mensagem para o Bitrix24
      const messageId_B24 = await bitrix24Service.sendMessage({
        DIALOG_ID: `chat${mapping.bitrixChatId}`,
        MESSAGE: messageText,
        SYSTEM: 'N',
      });

      if (!messageId_B24) {
        throw new Error('Falha ao enviar mensagem ao Bitrix24');
      }

      // Marca como processada
      await cacheService.markMessageAsProcessed(messageId);

      prometheusService.recordMessageProcessed('incoming', 'success');
      endTimer('success');

      logger.info({
        msg: '✅ Mensagem recebida processada com sucesso',
        messageId,
        bitrixMessageId: messageId_B24,
      });

      return {
        success: true,
        message: 'Message processed successfully',
        data: { bitrixMessageId: messageId_B24 },
      };
    } catch (error) {
      prometheusService.recordMessageProcessed('incoming', 'failed');
      endTimer('failed');

      logger.error({
        msg: '❌ Erro ao processar mensagem recebida',
        messageId,
        error: error instanceof Error ? error.message : error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  queueConfigs.incomingMessages.workerOptions
);

/**
 * Worker para processar mensagens de saída do Bitrix24
 */
export const outboundMessagesWorker = new Worker<ProcessOutboundMessageJob, JobResult>(
  queueConfigs.outboundMessages.name,
  async (job: Job<ProcessOutboundMessageJob>) => {
    const { bitrixChatId, message, fromUserId } = job.data;
    const endTimer = prometheusService.measureQueueJob('outbound-messages');

    logger.info({
      msg: '⚙️ Processando mensagem de saída',
      jobId: job.id,
      bitrixChatId,
    });

    try {
      // Ignora mensagens do sistema
      if (fromUserId === '0' || !fromUserId) {
        return { success: true, message: 'System message ignored' };
      }

      // Busca mapeamento
      const mapping = await conversationMapper.findByBitrixChatId(bitrixChatId);

      if (!mapping) {
        throw new Error('Mapeamento não encontrado');
      }

      // Envia via Meta API
      const result = await metaService.sendMessage(mapping.metaWhatsappId, message);

      if (!result) {
        throw new Error('Falha ao enviar mensagem via WhatsApp');
      }

      // Atualiza timestamp
      await conversationMapper.updateLastMessage(mapping.metaWhatsappId);

      prometheusService.recordMessageProcessed('outbound', 'success');
      endTimer('success');

      logger.info({
        msg: '✅ Mensagem de saída processada com sucesso',
        whatsappId: mapping.metaWhatsappId,
        metaMessageId: result.messages[0].id,
      });

      return {
        success: true,
        message: 'Message sent successfully',
        data: { metaMessageId: result.messages[0].id },
      };
    } catch (error) {
      prometheusService.recordMessageProcessed('outbound', 'failed');
      endTimer('failed');

      logger.error({
        msg: '❌ Erro ao processar mensagem de saída',
        bitrixChatId,
        error: error instanceof Error ? error.message : error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  queueConfigs.outboundMessages.workerOptions
);

/**
 * Worker para enviar mensagens via Meta API
 */
export const metaMessagesWorker = new Worker<SendMetaMessageJob, JobResult>(
  queueConfigs.metaMessages.name,
  async (job: Job<SendMetaMessageJob>) => {
    const { to, message } = job.data;

    logger.debug({
      msg: '⚙️ Enviando mensagem via Meta API',
      jobId: job.id,
      to,
    });

    try {
      const result = await metaService.sendMessage(to, message);

      if (!result) {
        throw new Error('Falha no envio');
      }

      return {
        success: true,
        data: { messageId: result.messages[0].id },
      };
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao enviar via Meta API',
        to,
        error: error instanceof Error ? error.message : error,
      });

      throw error; // Deixa o BullMQ fazer retry
    }
  },
  queueConfigs.metaMessages.workerOptions
);

/**
 * Worker para enviar mensagens via Bitrix24 API
 */
export const bitrix24MessagesWorker = new Worker<SendBitrix24MessageJob, JobResult>(
  queueConfigs.bitrix24Messages.name,
  async (job: Job<SendBitrix24MessageJob>) => {
    const { chatId, message } = job.data;

    logger.debug({
      msg: '⚙️ Enviando mensagem via Bitrix24 API',
      jobId: job.id,
      chatId,
    });

    try {
      const messageId = await bitrix24Service.sendMessage({
        DIALOG_ID: chatId,
        MESSAGE: message,
        SYSTEM: 'N',
      });

      if (!messageId) {
        throw new Error('Falha no envio');
      }

      return {
        success: true,
        data: { messageId },
      };
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao enviar via Bitrix24 API',
        chatId,
        error: error instanceof Error ? error.message : error,
      });

      throw error; // Deixa o BullMQ fazer retry
    }
  },
  queueConfigs.bitrix24Messages.workerOptions
);

// Setup event listeners para workers
setupWorkerEvents(queueConfigs.incomingMessages.name);
setupWorkerEvents(queueConfigs.outboundMessages.name);
setupWorkerEvents(queueConfigs.metaMessages.name);
setupWorkerEvents(queueConfigs.bitrix24Messages.name);

// Event handlers comuns para todos os workers
[
  incomingMessagesWorker,
  outboundMessagesWorker,
  metaMessagesWorker,
  bitrix24MessagesWorker,
].forEach((worker) => {
  worker.on('completed', (job) => {
    logger.debug({
      msg: '✅ Job completado',
      queue: worker.name,
      jobId: job.id,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error({
      msg: '❌ Job falhou',
      queue: worker.name,
      jobId: job?.id,
      error: err.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error({
      msg: '❌ Erro no worker',
      queue: worker.name,
      error: err.message,
    });
  });
});

/**
 * Fecha todos os workers
 */
export async function closeWorkers(): Promise<void> {
  await Promise.all([
    incomingMessagesWorker.close(),
    outboundMessagesWorker.close(),
    metaMessagesWorker.close(),
    bitrix24MessagesWorker.close(),
  ]);
  logger.info('👷 Todos os workers fechados');
}

