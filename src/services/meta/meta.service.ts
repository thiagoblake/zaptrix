import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type {
  MetaSendMessageRequest,
  MetaSendMessageResponse,
  MetaErrorResponse,
} from '../../types/meta.types';

/**
 * Serviço para interagir com a Meta Cloud API (WhatsApp Business API)
 */
export class MetaService {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor() {
    this.baseURL = `https://graph.facebook.com/${env.META_API_VERSION}`;
    this.phoneNumberId = env.META_PHONE_NUMBER_ID;
    this.accessToken = env.META_ACCESS_TOKEN;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
      },
      timeout: 30000, // 30 segundos
    });

    // Interceptor para logging de requisições
    this.client.interceptors.request.use(
      (config) => {
        logger.debug({
          msg: 'Meta API Request',
          method: config.method,
          url: config.url,
        });
        return config;
      },
      (error) => {
        logger.error('Meta API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de respostas
    this.client.interceptors.response.use(
      (response) => {
        logger.debug({
          msg: 'Meta API Response',
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        if (error.response) {
          const metaError = error.response.data as MetaErrorResponse;
          logger.error({
            msg: 'Meta API Error Response',
            status: error.response.status,
            error: metaError.error,
          });
        } else {
          logger.error('Meta API Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verifica o token de verificação do webhook da Meta
   * @param mode - Modo do webhook
   * @param token - Token recebido
   * @param challenge - Challenge da Meta
   * @returns Challenge se válido, null caso contrário
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
      logger.info('✅ Webhook da Meta verificado com sucesso');
      return challenge;
    }

    logger.warn('❌ Falha na verificação do webhook da Meta', { mode, token });
    return null;
  }

  /**
   * Envia uma mensagem de texto via WhatsApp
   * @param to - Número do WhatsApp do destinatário (formato: 55XXXXXXXXXXX)
   * @param message - Texto da mensagem
   * @returns Resposta da API com ID da mensagem
   */
  async sendMessage(to: string, message: string): Promise<MetaSendMessageResponse | null> {
    try {
      const payload: MetaSendMessageRequest = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      };

      const response = await this.client.post<MetaSendMessageResponse>(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      logger.info({
        msg: '✅ Mensagem enviada via WhatsApp',
        to: to,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao enviar mensagem via WhatsApp',
        to: to,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Marca uma mensagem como lida
   * @param messageId - ID da mensagem a ser marcada como lida
   * @returns Sucesso ou falha da operação
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });

      logger.debug({
        msg: 'Mensagem marcada como lida',
        messageId: messageId,
      });

      return true;
    } catch (error) {
      logger.error({
        msg: 'Erro ao marcar mensagem como lida',
        messageId: messageId,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }
}

// Exporta instância singleton
export const metaService = new MetaService();

