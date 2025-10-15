import { eq } from 'drizzle-orm';
import { db } from '../db';
import { conversationMapping } from '../db/schema';
import { logger } from '../config/logger';
import { cacheService } from '../services/cache/cache.service';
import type { ConversationMapping, NewConversationMapping } from '../db/schema';

/**
 * Serviço de mapeamento de conversas entre Meta WhatsApp e Bitrix24
 * Gerencia a relação entre IDs de contatos nas duas plataformas
 */
export class ConversationMapper {
  /**
   * Busca um mapeamento existente pelo ID do WhatsApp (Meta)
   * Utiliza cache Redis para melhor performance
   * @param metaWhatsappId - ID do usuário no WhatsApp
   * @returns Mapeamento encontrado ou null
   */
  async findByMetaId(metaWhatsappId: string): Promise<ConversationMapping | null> {
    try {
      // Tenta buscar no cache primeiro
      const cached = await cacheService.getConversationMappingByMetaId(metaWhatsappId);
      if (cached) {
        return cached;
      }

      // Se não estiver no cache, busca no banco
      const [mapping] = await db
        .select()
        .from(conversationMapping)
        .where(eq(conversationMapping.metaWhatsappId, metaWhatsappId))
        .limit(1);

      // Se encontrou, armazena no cache
      if (mapping) {
        await cacheService.setConversationMapping(metaWhatsappId, mapping);
      }

      return mapping || null;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao buscar mapeamento por Meta ID',
        metaWhatsappId,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Busca um mapeamento existente pelo ID do chat no Bitrix24
   * Utiliza cache Redis para melhor performance
   * @param bitrixChatId - ID do chat no Bitrix24
   * @returns Mapeamento encontrado ou null
   */
  async findByBitrixChatId(bitrixChatId: number): Promise<ConversationMapping | null> {
    try {
      // Tenta buscar no cache primeiro
      const cached = await cacheService.getConversationMappingByBitrixChatId(bitrixChatId);
      if (cached) {
        return cached;
      }

      // Se não estiver no cache, busca no banco
      const [mapping] = await db
        .select()
        .from(conversationMapping)
        .where(eq(conversationMapping.bitrixChatId, bitrixChatId))
        .limit(1);

      // Se encontrou, armazena no cache
      if (mapping) {
        await cacheService.setConversationMapping(mapping.metaWhatsappId, mapping);
      }

      return mapping || null;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao buscar mapeamento por Bitrix Chat ID',
        bitrixChatId,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Cria um novo mapeamento de conversa
   * Automaticamente armazena no cache Redis
   * @param data - Dados do novo mapeamento
   * @returns Mapeamento criado ou null em caso de erro
   */
  async create(data: NewConversationMapping): Promise<ConversationMapping | null> {
    try {
      const [newMapping] = await db
        .insert(conversationMapping)
        .values({
          ...data,
          lastMessageAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Armazena no cache
      await cacheService.setConversationMapping(newMapping.metaWhatsappId, newMapping);

      logger.info({
        msg: '✅ Novo mapeamento de conversa criado',
        metaWhatsappId: newMapping.metaWhatsappId,
        bitrixContactId: newMapping.bitrixContactId,
        bitrixChatId: newMapping.bitrixChatId,
      });

      return newMapping;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao criar mapeamento de conversa',
        data,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Atualiza o timestamp da última mensagem
   * @param metaWhatsappId - ID do usuário no WhatsApp
   * @returns Sucesso ou falha da operação
   */
  async updateLastMessage(metaWhatsappId: string): Promise<boolean> {
    try {
      await db
        .update(conversationMapping)
        .set({
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(conversationMapping.metaWhatsappId, metaWhatsappId));

      return true;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao atualizar timestamp da última mensagem',
        metaWhatsappId,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Verifica se existe um mapeamento para um ID do WhatsApp
   * @param metaWhatsappId - ID do usuário no WhatsApp
   * @returns true se existe, false caso contrário
   */
  async exists(metaWhatsappId: string): Promise<boolean> {
    const mapping = await this.findByMetaId(metaWhatsappId);
    return mapping !== null;
  }

  /**
   * Remove um mapeamento existente (raramente usado)
   * Remove também do cache
   * @param metaWhatsappId - ID do usuário no WhatsApp
   * @returns Sucesso ou falha da operação
   */
  async delete(metaWhatsappId: string): Promise<boolean> {
    try {
      // Busca o mapeamento para obter o bitrixChatId
      const mapping = await this.findByMetaId(metaWhatsappId);
      
      if (mapping) {
        // Remove do cache
        await cacheService.deleteConversationMapping(metaWhatsappId, mapping.bitrixChatId);
      }

      // Remove do banco
      await db
        .delete(conversationMapping)
        .where(eq(conversationMapping.metaWhatsappId, metaWhatsappId));

      logger.info({
        msg: '🗑️ Mapeamento de conversa removido',
        metaWhatsappId,
      });

      return true;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao remover mapeamento de conversa',
        metaWhatsappId,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }
}

// Exporta instância singleton
export const conversationMapper = new ConversationMapper();

