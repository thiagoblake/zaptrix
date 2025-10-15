import { FastifyPluginAsync } from 'fastify';
import { metaService } from '../../services/meta/meta.service';
import { bitrix24Service } from '../../services/bitrix24/bitrix24.service';
import { conversationMapper } from '../../core/mapper';
import { logger } from '../../config/logger';
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
 * Lógica principal de mapeamento e envio para o Bitrix24
 */
async function processIncomingMessage(message: MetaMessage, contactName: string): Promise<void> {
  try {
    const whatsappId = message.from;
    const messageText = message.text?.body || '[Mensagem não suportada]';

    logger.info({
      msg: '📩 Processando mensagem do WhatsApp',
      whatsappId,
      messageText,
      type: message.type,
    });

    // Marca mensagem como lida
    await metaService.markAsRead(message.id);

    // Busca mapeamento existente
    let mapping = await conversationMapper.findByMetaId(whatsappId);

    if (!mapping) {
      // Novo contato - cria no Bitrix24
      logger.info({
        msg: '👤 Novo contato detectado, criando no Bitrix24',
        whatsappId,
        contactName,
      });

      // Cria contato no Bitrix24
      const contactId = await bitrix24Service.createContact({
        NAME: contactName,
        PHONE: [{ VALUE: whatsappId, VALUE_TYPE: 'WORK' }],
      });

      if (!contactId) {
        logger.error('❌ Falha ao criar contato no Bitrix24');
        return;
      }

      // Cria chat do Canal Aberto
      const chatId = await bitrix24Service.createOpenLineChat(
        whatsappId,
        `WhatsApp: ${contactName}`
      );

      if (!chatId) {
        logger.error('❌ Falha ao criar chat no Canal Aberto');
        return;
      }

      // Cria mapeamento
      mapping = await conversationMapper.create({
        metaWhatsappId: whatsappId,
        bitrixContactId: contactId,
        bitrixChatId: chatId,
        contactName: contactName,
      });

      if (!mapping) {
        logger.error('❌ Falha ao criar mapeamento de conversa');
        return;
      }
    } else {
      // Atualiza timestamp da última mensagem
      await conversationMapper.updateLastMessage(whatsappId);
    }

    // Envia mensagem para o Bitrix24
    const messageId = await bitrix24Service.sendMessage({
      DIALOG_ID: `chat${mapping.bitrixChatId}`,
      MESSAGE: messageText,
      SYSTEM: 'N',
    });

    if (messageId) {
      logger.info({
        msg: '✅ Mensagem enviada ao Bitrix24',
        bitrixChatId: mapping.bitrixChatId,
        bitrixMessageId: messageId,
      });
    } else {
      logger.error('❌ Falha ao enviar mensagem ao Bitrix24');
    }

  } catch (error) {
    logger.error({
      msg: '❌ Erro ao processar mensagem do WhatsApp',
      error: error instanceof Error ? error.message : error,
    });
  }
}

export default metaWebhookRoutes;

