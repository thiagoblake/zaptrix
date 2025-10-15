import { FastifyPluginAsync } from 'fastify';
import { metaService } from '../../services/meta/meta.service';
import { logger } from '../../config/logger';
import { addIncomingMessageJob } from '../../queues/queues';
import type {
  MetaWebhookVerification,
  MetaWebhookMessage,
  MetaMessage,
} from '../../types/meta.types';

/**
 * Rotas de webhook da Meta Cloud API (WhatsApp)
 */
const metaWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /webhooks/meta
   * Verificação de webhook da Meta
   */
  fastify.get<{
    Querystring: MetaWebhookVerification;
  }>('/meta', {
    schema: {
      description: 'Verificação de webhook da Meta Cloud API',
      tags: ['Meta Webhooks'],
      querystring: {
        type: 'object',
        properties: {
          'hub.mode': { type: 'string' },
          'hub.verify_token': { type: 'string' },
          'hub.challenge': { type: 'string' },
        },
        required: ['hub.mode', 'hub.verify_token', 'hub.challenge'],
      },
      response: {
        200: {
          type: 'string',
          description: 'Challenge retornado pela Meta',
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query;

    const verifiedChallenge = metaService.verifyWebhook(mode, token, challenge);

    if (verifiedChallenge) {
      return reply.code(200).send(verifiedChallenge);
    }

    return reply.code(403).send({ error: 'Token de verificação inválido' });
  });

  /**
   * POST /webhooks/meta
   * Recebe notificações de mensagens da Meta
   */
  fastify.post<{
    Body: MetaWebhookMessage;
  }>('/meta', {
    schema: {
      description: 'Recebe webhooks de mensagens da Meta Cloud API',
      tags: ['Meta Webhooks'],
      body: {
        type: 'object',
        properties: {
          object: { type: 'string' },
          entry: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
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
      msg: '📨 Webhook recebido da Meta',
      object: body.object,
    });

    // Verifica se é uma notificação de mensagem do WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return reply.code(200).send({ status: 'ignored' });
    }

    // Processa cada entrada do webhook
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Processa mensagens recebidas
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await processIncomingMessage(message, value.contacts?.[0]?.profile?.name || 'Desconhecido');
          }
        }
      }
    }

    return reply.code(200).send({ status: 'ok' });
  });
};

/**
 * Processa uma mensagem recebida do WhatsApp
 * Adiciona job à fila para processamento assíncrono
 */
async function processIncomingMessage(message: MetaMessage, contactName: string): Promise<void> {
  try {
    const whatsappId = message.from;
    const messageText = message.text?.body || '[Mensagem não suportada]';

    logger.info({
      msg: '📩 Recebendo mensagem do WhatsApp',
      whatsappId,
      messageText,
      type: message.type,
    });

    // Adiciona à fila para processamento assíncrono
    await addIncomingMessageJob({
      messageId: message.id,
      from: whatsappId,
      contactName: contactName,
      messageText: messageText,
      messageType: message.type,
      timestamp: message.timestamp,
    });

    logger.info({
      msg: '📥 Mensagem adicionada à fila de processamento',
      messageId: message.id,
    });

  } catch (error) {
    logger.error({
      msg: '❌ Erro ao adicionar mensagem à fila',
      error: error instanceof Error ? error.message : error,
    });
  }
}

export default metaWebhookRoutes;

