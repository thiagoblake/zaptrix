import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Serviço para enviar templates do WhatsApp
 * Templates são mensagens pré-aprovadas pela Meta
 */
export class TemplateService {
  private readonly baseURL: string;
  private readonly accessToken: string;

  constructor() {
    this.baseURL = `https://graph.facebook.com/${env.META_API_VERSION}`;
    this.accessToken = env.META_ACCESS_TOKEN;
  }

  /**
   * Envia template simples sem parâmetros
   */
  async sendTemplate(to: string, templateName: string, languageCode: string = 'pt_BR'): Promise<any> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
        },
      };

      const response = await axios.post(
        `${this.baseURL}/${env.META_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info({
        msg: '✅ Template enviado',
        to,
        template: templateName,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao enviar template',
        template: templateName,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Envia template com parâmetros
   */
  async sendTemplateWithParams(
    to: string,
    templateName: string,
    parameters: string[],
    languageCode: string = 'pt_BR'
  ): Promise<any> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: [
            {
              type: 'body',
              parameters: parameters.map(param => ({
                type: 'text',
                text: param,
              })),
            },
          ],
        },
      };

      const response = await axios.post(
        `${this.baseURL}/${env.META_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info({
        msg: '✅ Template com parâmetros enviado',
        to,
        template: templateName,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao enviar template com parâmetros',
        template: templateName,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Envia template com botões
   */
  async sendTemplateWithButtons(
    to: string,
    templateName: string,
    buttonPayloads: string[],
    languageCode: string = 'pt_BR'
  ): Promise<any> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: [
            {
              type: 'button',
              sub_type: 'quick_reply',
              index: 0,
              parameters: buttonPayloads.map((payload, index) => ({
                type: 'payload',
                payload: payload,
              })),
            },
          ],
        },
      };

      const response = await axios.post(
        `${this.baseURL}/${env.META_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info({
        msg: '✅ Template com botões enviado',
        to,
        template: templateName,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao enviar template com botões',
        template: templateName,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Lista templates aprovados
   */
  async listTemplates(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/${env.META_PHONE_NUMBER_ID}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info({
        msg: '✅ Templates listados',
        count: response.data.data?.length || 0,
      });

      return response.data;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao listar templates',
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}

// Exporta instância singleton
export const templateService = new TemplateService();

