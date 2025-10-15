import { FastifyPluginAsync } from 'fastify';
import { logger } from '../../config/logger';
import { addOutboundMessageJob } from '../../queues/queues';
import type { Bitrix24OutboundWebhook } from '../../types/bitrix24.types';

/**
 * Rotas de webhook do Bitrix24
 */
const bitrix24WebhookRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /webhooks/bitrix24/outbound
   * Recebe notificações de mensagens enviadas pelos agentes no Bitrix24
   */
  fastify.post<{
    Body: Bitrix24OutboundWebhook;
  }>('/bitrix24/outbound', {
    schema: {
      description: 'Recebe webhooks de mensagens de saída do Bitrix24 (respostas dos agentes)',
      tags: ['Bitrix24 Webhooks'],
      body: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              PARAMS: {
                type: 'object',
              },
            },
          },
          ts: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body;

    logger.info({
      msg: '📨 Webhook recebido do Bitrix24',
      event: body.event,
    });

    // Verifica se é um evento de mensagem adicionada
    if (body.event !== 'ONIMMESSAGEADD') {
      return reply.code(200).send({ status: 'ignored' });
    }

    await processOutboundMessage(body);

    return reply.code(200).send({ status: 'ok' });
  });
};

/**
 * Processa uma mensagem de saída do Bitrix24 (resposta do agente)
 * Adiciona job à fila para processamento assíncrono
 */
async function processOutboundMessage(webhook: Bitrix24OutboundWebhook): Promise<void> {
  try {
    const params = webhook.data.PARAMS;
    const dialogId = params.DIALOG_ID;
    const message = params.MESSAGE;
    const fromUserId = params.FROM_USER_ID;
    const messageId = params.MESSAGE_ID;

    logger.info({
      msg: '📤 Recebendo mensagem de saída do Bitrix24',
      dialogId,
      fromUserId,
    });

    // Extrai o ID do chat do DIALOG_ID (formato: "chatXXXX")
    const chatIdMatch = dialogId.match(/chat(\d+)/);
    if (!chatIdMatch) {
      logger.warn('⚠️ Formato inválido de DIALOG_ID', { dialogId });
      return;
    }

    const bitrixChatId = parseInt(chatIdMatch[1], 10);

    // Adiciona à fila para processamento assíncrono
    await addOutboundMessageJob({
      bitrixChatId: bitrixChatId,
      message: message,
      fromUserId: fromUserId,
      messageId: messageId,
      timestamp: webhook.ts,
    });

    logger.info({
      msg: '📤 Mensagem adicionada à fila de processamento',
      messageId: messageId,
    });

  } catch (error) {
    logger.error({
      msg: '❌ Erro ao adicionar mensagem à fila',
      error: error instanceof Error ? error.message : error,
    });
  }
}

export default bitrix24WebhookRoutes;

