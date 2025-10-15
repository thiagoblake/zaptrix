import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import type { ConversationMapping } from '../../db/schema';

/**
 * Serviço de Cache usando Redis
 * Implementa cache para mapeamentos de conversas e outros dados frequentes
 */
export class CacheService {
  private readonly TTL = {
    CONVERSATION_MAPPING: 3600, // 1 hora
    BITRIX_TOKEN: 3000, // 50 minutos (token expira em 1h)
    WEBHOOK_DEDUP: 300, // 5 minutos para deduplicação
  };

  /**
   * Armazena um mapeamento de conversa no cache
   * @param metaWhatsappId - ID do WhatsApp
   * @param mapping - Dados do mapeamento
   */
  async setCon versationMapping(
    metaWhatsappId: string,
    mapping: ConversationMapping
  ): Promise<void> {
    try {
      const key = `mapping:meta:${metaWhatsappId}`;
      await redis.setex(key, this.TTL.CONVERSATION_MAPPING, JSON.stringify(mapping));
      
      // Também indexa pelo chat ID do Bitrix24 para busca reversa
      const reverseKey = `mapping:bitrix:${mapping.bitrixChatId}`;
      await redis.setex(reverseKey, this.TTL.CONVERSATION_MAPPING, JSON.stringify(mapping));

      logger.debug({
        msg: '💾 Mapeamento armazenado no cache',
        metaWhatsappId,
        bitrixChatId: mapping.bitrixChatId,
      });
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao armazenar mapeamento no cache',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Busca um mapeamento pelo ID do WhatsApp
   * @param metaWhatsappId - ID do WhatsApp
   * @returns Mapeamento ou null
   */
  async getConversationMappingByMetaId(
    metaWhatsappId: string
  ): Promise<ConversationMapping | null> {
    try {
      const key = `mapping:meta:${metaWhatsappId}`;
      const data = await redis.get(key);

      if (data) {
        logger.debug({
          msg: '✅ Mapeamento encontrado no cache',
          metaWhatsappId,
        });
        return JSON.parse(data) as ConversationMapping;
      }

      return null;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao buscar mapeamento no cache',
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Busca um mapeamento pelo ID do chat do Bitrix24
   * @param bitrixChatId - ID do chat no Bitrix24
   * @returns Mapeamento ou null
   */
  async getConversationMappingByBitrixChatId(
    bitrixChatId: number
  ): Promise<ConversationMapping | null> {
    try {
      const key = `mapping:bitrix:${bitrixChatId}`;
      const data = await redis.get(key);

      if (data) {
        logger.debug({
          msg: '✅ Mapeamento encontrado no cache (Bitrix)',
          bitrixChatId,
        });
        return JSON.parse(data) as ConversationMapping;
      }

      return null;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao buscar mapeamento no cache (Bitrix)',
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Remove um mapeamento do cache
   * @param metaWhatsappId - ID do WhatsApp
   * @param bitrixChatId - ID do chat no Bitrix24
   */
  async deleteConversationMapping(
    metaWhatsappId: string,
    bitrixChatId: number
  ): Promise<void> {
    try {
      await redis.del(`mapping:meta:${metaWhatsappId}`);
      await redis.del(`mapping:bitrix:${bitrixChatId}`);

      logger.debug({
        msg: '🗑️ Mapeamento removido do cache',
        metaWhatsappId,
        bitrixChatId,
      });
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao remover mapeamento do cache',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Verifica se uma mensagem já foi processada (deduplicação)
   * @param messageId - ID da mensagem
   * @returns true se já foi processada, false caso contrário
   */
  async isMessageProcessed(messageId: string): Promise<boolean> {
    try {
      const key = `msg:processed:${messageId}`;
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao verificar mensagem processada',
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Marca uma mensagem como processada
   * @param messageId - ID da mensagem
   */
  async markMessageAsProcessed(messageId: string): Promise<void> {
    try {
      const key = `msg:processed:${messageId}`;
      await redis.setex(key, this.TTL.WEBHOOK_DEDUP, '1');

      logger.debug({
        msg: '✅ Mensagem marcada como processada',
        messageId,
      });
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao marcar mensagem como processada',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Armazena token de acesso do Bitrix24 no cache
   * @param portalUrl - URL do portal
   * @param token - Token de acesso
   */
  async setBitrixToken(portalUrl: string, token: string): Promise<void> {
    try {
      const key = `bitrix:token:${portalUrl}`;
      await redis.setex(key, this.TTL.BITRIX_TOKEN, token);

      logger.debug({
        msg: '💾 Token Bitrix24 armazenado no cache',
        portalUrl,
      });
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao armazenar token Bitrix24 no cache',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Busca token de acesso do Bitrix24 no cache
   * @param portalUrl - URL do portal
   * @returns Token ou null
   */
  async getBitrixToken(portalUrl: string): Promise<string | null> {
    try {
      const key = `bitrix:token:${portalUrl}`;
      const token = await redis.get(key);

      if (token) {
        logger.debug({
          msg: '✅ Token Bitrix24 encontrado no cache',
          portalUrl,
        });
      }

      return token;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao buscar token Bitrix24 no cache',
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Limpa todo o cache (use com cuidado!)
   */
  async flushAll(): Promise<void> {
    try {
      await redis.flushdb();
      logger.warn('⚠️ Cache Redis limpo completamente');
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao limpar cache',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getStats(): Promise<{
    usedMemory: string;
    connectedClients: number;
    totalKeys: number;
  }> {
    try {
      const info = await redis.info('memory');
      const clients = await redis.info('clients');
      const dbsize = await redis.dbsize();

      const usedMemoryMatch = info.match(/used_memory_human:(.*)/);
      const connectedClientsMatch = clients.match(/connected_clients:(.*)/);

      return {
        usedMemory: usedMemoryMatch ? usedMemoryMatch[1].trim() : 'N/A',
        connectedClients: connectedClientsMatch ? parseInt(connectedClientsMatch[1].trim()) : 0,
        totalKeys: dbsize,
      };
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao obter estatísticas do cache',
        error: error instanceof Error ? error.message : error,
      });
      return {
        usedMemory: 'N/A',
        connectedClients: 0,
        totalKeys: 0,
      };
    }
  }
}

// Exporta instância singleton
export const cacheService = new CacheService();

