import { FastifyPluginAsync } from 'fastify';
import { metaService } from '../../services/meta/meta.service';
import { conversationMapper } from '../../core/mapper';
import { logger } from '../../config/logger';
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
 * Envia para o WhatsApp via Meta Cloud API
 */
async function processOutboundMessage(webhook: Bitrix24OutboundWebhook): Promise<void> {
  try {
    const params = webhook.data.PARAMS;
    const dialogId = params.DIALOG_ID;
    const message = params.MESSAGE;
    const fromUserId = params.FROM_USER_ID;

    logger.info({
      msg: '📤 Processando mensagem de saída do Bitrix24',
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

    // Busca mapeamento pelo ID do chat do Bitrix24
    const mapping = await conversationMapper.findByBitrixChatId(bitrixChatId);

    if (!mapping) {
      logger.warn({
        msg: '⚠️ Mapeamento não encontrado para chat',
        bitrixChatId,
      });
      return;
    }

    // Verifica se a mensagem é do sistema ou de um agente
    // (Evita loop: não reenvia mensagens que vieram do próprio webhook da Meta)
    if (fromUserId === '0' || !fromUserId) {
      logger.debug('Mensagem do sistema, ignorando');
      return;
    }

    // Envia mensagem via WhatsApp
    const result = await metaService.sendMessage(
      mapping.metaWhatsappId,
      message
    );

    if (result) {
      logger.info({
        msg: '✅ Mensagem enviada ao WhatsApp',
        whatsappId: mapping.metaWhatsappId,
        metaMessageId: result.messages[0].id,
      });

      // Atualiza timestamp da última mensagem
      await conversationMapper.updateLastMessage(mapping.metaWhatsappId);
    } else {
      logger.error('❌ Falha ao enviar mensagem ao WhatsApp');
    }

  } catch (error) {
    logger.error({
      msg: '❌ Erro ao processar mensagem de saída do Bitrix24',
      error: error instanceof Error ? error.message : error,
    });
  }
}

export default bitrix24WebhookRoutes;

