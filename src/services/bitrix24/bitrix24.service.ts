import axios, { AxiosInstance } from 'axios';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { portalConfig } from '../../db/schema';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type {
  Bitrix24AuthResponse,
  Bitrix24ApiResponse,
  Bitrix24Contact,
  Bitrix24Lead,
  Bitrix24Chat,
  Bitrix24Message,
  CreateContactParams,
  CreateLeadParams,
  CreateOpenChannelParams,
  SendMessageParams,
} from '../../types/bitrix24.types';

/**
 * Serviço para interagir com a API REST do Bitrix24
 * Gerencia autenticação, refresh de tokens e operações de CRM e Chat
 */
export class Bitrix24Service {
  private client: AxiosInstance;
  private portalUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.portalUrl = env.BITRIX_PORTAL_URL;

    this.client = axios.create({
      timeout: 30000, // 30 segundos
    });

    // Interceptor para adicionar token nas requisições
    this.client.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        
        if (this.accessToken && config.url) {
          const separator = config.url.includes('?') ? '&' : '?';
          config.url = `${config.url}${separator}auth=${this.accessToken}`;
        }

        logger.debug({
          msg: 'Bitrix24 API Request',
          method: config.method,
          url: config.url?.split('?')[0], // Remove token do log
        });

        return config;
      },
      (error) => {
        logger.error('Bitrix24 API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de respostas
    this.client.interceptors.response.use(
      (response) => {
        logger.debug({
          msg: 'Bitrix24 API Response',
          status: response.status,
          hasError: !!response.data?.error,
        });
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error({
            msg: 'Bitrix24 API Error Response',
            status: error.response.status,
            error: error.response.data,
          });
        } else {
          logger.error('Bitrix24 API Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Garante que o token de acesso está válido, renovando se necessário
   */
  private async ensureValidToken(): Promise<void> {
    try {
      // Busca configuração do portal no banco
      const [config] = await db
        .select()
        .from(portalConfig)
        .where(eq(portalConfig.portalUrl, this.portalUrl))
        .limit(1);

      if (!config) {
        logger.warn('⚠️ Configuração do portal não encontrada no banco de dados');
        throw new Error('Portal não configurado');
      }

      // Verifica se o token ainda é válido (com margem de 5 minutos)
      const now = new Date();
      const expirationTime = config.tokenExpirationTime;

      if (!expirationTime || now >= new Date(expirationTime.getTime() - 5 * 60 * 1000)) {
        logger.info('🔄 Token expirado ou próximo de expirar, renovando...');
        await this.refreshAccessToken(config.refreshToken!);
      } else {
        this.accessToken = config.accessToken!;
      }
    } catch (error) {
      logger.error('❌ Erro ao garantir token válido:', error);
      throw error;
    }
  }

  /**
   * Renova o access token usando o refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<void> {
    try {
      const response = await axios.get<Bitrix24AuthResponse>(
        `${this.portalUrl}/oauth/token/`,
        {
          params: {
            grant_type: 'refresh_token',
            client_id: env.BITRIX_CLIENT_ID,
            client_secret: env.BITRIX_CLIENT_SECRET,
            refresh_token: refreshToken,
          },
        }
      );

      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;

      // Calcula tempo de expiração
      const expirationTime = new Date(Date.now() + expires_in * 1000);

      // Atualiza no banco de dados
      await db
        .update(portalConfig)
        .set({
          accessToken: access_token,
          refreshToken: new_refresh_token,
          tokenExpirationTime: expirationTime,
          updatedAt: new Date(),
        })
        .where(eq(portalConfig.portalUrl, this.portalUrl));

      this.accessToken = access_token;

      logger.info('✅ Token renovado com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao renovar token:', error);
      throw new Error('Falha ao renovar token do Bitrix24');
    }
  }

  /**
   * Cria um novo contato no Bitrix24
   */
  async createContact(params: CreateContactParams): Promise<number | null> {
    try {
      const response = await this.client.post<Bitrix24ApiResponse<number>>(
        `${this.portalUrl}/rest/crm.contact.add`,
        { fields: params }
      );

      if (response.data.error) {
        logger.error('Erro ao criar contato:', response.data.error_description);
        return null;
      }

      const contactId = response.data.result!;
      logger.info({
        msg: '✅ Contato criado no Bitrix24',
        contactId: contactId,
      });

      return contactId;
    } catch (error) {
      logger.error('❌ Erro ao criar contato:', error);
      return null;
    }
  }

  /**
   * Cria um novo lead no Bitrix24
   */
  async createLead(params: CreateLeadParams): Promise<number | null> {
    try {
      const response = await this.client.post<Bitrix24ApiResponse<number>>(
        `${this.portalUrl}/rest/crm.lead.add`,
        { fields: params }
      );

      if (response.data.error) {
        logger.error('Erro ao criar lead:', response.data.error_description);
        return null;
      }

      const leadId = response.data.result!;
      logger.info({
        msg: '✅ Lead criado no Bitrix24',
        leadId: leadId,
      });

      return leadId;
    } catch (error) {
      logger.error('❌ Erro ao criar lead:', error);
      return null;
    }
  }

  /**
   * Cria um novo chat de Canal Aberto no Bitrix24
   */
  async createOpenLineChat(entityId: string, title: string): Promise<number | null> {
    try {
      const response = await this.client.post<Bitrix24ApiResponse<number>>(
        `${this.portalUrl}/rest/imconnector.send.messages`,
        {
          CONNECTOR: 'custom',
          LINE: 'zaptrix',
          MESSAGES: [
            {
              external_id: entityId,
              user: {
                name: title,
                avatar: '',
              },
              message: {
                text: 'Conversa iniciada via WhatsApp',
                date: new Date().toISOString(),
              },
            },
          ],
        }
      );

      if (response.data.error) {
        logger.error('Erro ao criar chat do Canal Aberto:', response.data.error_description);
        return null;
      }

      const chatId = response.data.result!;
      logger.info({
        msg: '✅ Chat de Canal Aberto criado',
        chatId: chatId,
      });

      return chatId;
    } catch (error) {
      logger.error('❌ Erro ao criar chat do Canal Aberto:', error);
      return null;
    }
  }

  /**
   * Envia uma mensagem para um chat no Bitrix24
   */
  async sendMessage(params: SendMessageParams): Promise<number | null> {
    try {
      const response = await this.client.post<Bitrix24ApiResponse<number>>(
        `${this.portalUrl}/rest/im.message.add`,
        params
      );

      if (response.data.error) {
        logger.error('Erro ao enviar mensagem:', response.data.error_description);
        return null;
      }

      const messageId = response.data.result!;
      logger.info({
        msg: '✅ Mensagem enviada no Bitrix24',
        messageId: messageId,
        chatId: params.DIALOG_ID,
      });

      return messageId;
    } catch (error) {
      logger.error('❌ Erro ao enviar mensagem:', error);
      return null;
    }
  }

  /**
   * Busca um contato pelo telefone
   */
  async findContactByPhone(phone: string): Promise<Bitrix24Contact | null> {
    try {
      const response = await this.client.post<Bitrix24ApiResponse<Bitrix24Contact[]>>(
        `${this.portalUrl}/rest/crm.contact.list`,
        {
          filter: { PHONE: phone },
          select: ['ID', 'NAME', 'LAST_NAME', 'PHONE'],
        }
      );

      if (response.data.error || !response.data.result || response.data.result.length === 0) {
        return null;
      }

      return response.data.result[0];
    } catch (error) {
      logger.error('❌ Erro ao buscar contato por telefone:', error);
      return null;
    }
  }
}

// Exporta instância singleton
export const bitrix24Service = new Bitrix24Service();

