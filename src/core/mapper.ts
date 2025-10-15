import { eq } from 'drizzle-orm';
import { db } from '../db';
import { conversationMapping } from '../db/schema';
import { logger } from '../config/logger';
import type { ConversationMapping, NewConversationMapping } from '../db/schema';

/**
 * Serviço de mapeamento de conversas entre Meta WhatsApp e Bitrix24
 * Gerencia a relação entre IDs de contatos nas duas plataformas
 */
export class ConversationMapper {
  /**
   * Busca um mapeamento existente pelo ID do WhatsApp (Meta)
   * @param metaWhatsappId - ID do usuário no WhatsApp
   * @returns Mapeamento encontrado ou null
   */
  async findByMetaId(metaWhatsappId: string): Promise<ConversationMapping | null> {
    try {
      const [mapping] = await db
        .select()
        .from(conversationMapping)
        .where(eq(conversationMapping.metaWhatsappId, metaWhatsappId))
        .limit(1);

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
   * @param bitrixChatId - ID do chat no Bitrix24
   * @returns Mapeamento encontrado ou null
   */
  async findByBitrixChatId(bitrixChatId: number): Promise<ConversationMapping | null> {
    try {
      const [mapping] = await db
        .select()
        .from(conversationMapping)
        .where(eq(conversationMapping.bitrixChatId, bitrixChatId))
        .limit(1);

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
   * @param metaWhatsappId - ID do usuário no WhatsApp
   * @returns Sucesso ou falha da operação
   */
  async delete(metaWhatsappId: string): Promise<boolean> {
    try {
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

