import axios, { AxiosInstance } from 'axios';
import { portalService } from '../portal/portal.service';
import { logger } from '../../config/logger';
import type { PortalConfig } from '../../db/schema';
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
 * Suporta múltiplos portais (multi-tenant)
 */
export class Bitrix24Service {
  private client: AxiosInstance;
  private portal: PortalConfig | null = null;
  private accessToken: string | null = null;

  constructor(portal?: PortalConfig) {
    if (portal) {
      this.portal = portal;
    }

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
   * Define o portal a ser usado (multi-tenant)
   */
  setPortal(portal: PortalConfig): void {
    this.portal = portal;
  }

  /**
   * Garante que o token de acesso está válido, renovando se necessário
   */
  private async ensureValidToken(): Promise<void> {
    try {
      if (!this.portal) {
        throw new Error('Portal não configurado');
      }

      // Recarrega portal do banco para pegar tokens atualizados
      const config = await portalService.findById(this.portal.id);

      if (!config) {
        logger.warn('⚠️ Configuração do portal não encontrada no banco de dados');
        throw new Error('Portal não configurado');
      }

      this.portal = config;

      // Verifica se o token ainda é válido (com margem de 5 minutos)
      const now = new Date();
      const expirationTime = config.tokenExpirationTime;

      if (!expirationTime || now >= new Date(expirationTime.getTime() - 5 * 60 * 1000)) {
        logger.info('🔄 Token expirado ou próximo de expirar, renovando...');
        await this.refreshAccessToken(config.refreshToken!, config.id);
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
  private async refreshAccessToken(refreshToken: string, portalId: string): Promise<void> {
    try {
      if (!this.portal) {
        throw new Error('Portal não configurado');
      }

      const response = await axios.get<Bitrix24AuthResponse>(
        `${this.portal.portalUrl}/oauth/token/`,
        {
          params: {
            grant_type: 'refresh_token',
            client_id: this.portal.clientId,
            client_secret: this.portal.clientSecret,
            refresh_token: refreshToken,
          },
        }
      );

      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;

      // Atualiza tokens no banco via PortalService
      await portalService.updateTokens(portalId, access_token, new_refresh_token, expires_in);

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
      if (!this.portal) {
        throw new Error('Portal não configurado');
      }

      const response = await this.client.post<Bitrix24ApiResponse<number>>(
        `${this.portal.portalUrl}/rest/crm.contact.add`,
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
      if (!this.portal) {
        throw new Error('Portal não configurado');
      }

      const response = await this.client.post<Bitrix24ApiResponse<number>>(
        `${this.portal.portalUrl}/rest/crm.lead.add`,
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
      if (!this.portal) {
        throw new Error('Portal não configurado');
      }

      const response = await this.client.post<Bitrix24ApiResponse<number>>(
        `${this.portal.portalUrl}/rest/imconnector.send.messages`,
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
      if (!this.portal) {
        throw new Error('Portal não configurado');
      }

      const response = await this.client.post<Bitrix24ApiResponse<number>>(
        `${this.portal.portalUrl}/rest/im.message.add`,
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
      if (!this.portal) {
        throw new Error('Portal não configurado');
      }

      const response = await this.client.post<Bitrix24ApiResponse<Bitrix24Contact[]>>(
        `${this.portal.portalUrl}/rest/crm.contact.list`,
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
  /**
   * Cria uma instância para um portal específico
   */
  static forPortal(portal: PortalConfig): Bitrix24Service {
    return new Bitrix24Service(portal);
  }
}

// Exporta classe (não singleton para suportar multi-tenant)
// Use Bitrix24Service.forPortal(portal) para criar instâncias
export const bitrix24Service = new Bitrix24Service();

