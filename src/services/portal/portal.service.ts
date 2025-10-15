import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { portalConfig } from '../../db/schema';
import { logger } from '../../config/logger';
import type { PortalConfig } from '../../db/schema';

/**
 * Serviço de gerenciamento de portais (Multi-tenant)
 * Permite múltiplas instâncias Bitrix24 no mesmo sistema
 */
export class PortalService {
  /**
   * Busca portal pela URL
   */
  async findByUrl(portalUrl: string): Promise<PortalConfig | null> {
    try {
      const [portal] = await db
        .select()
        .from(portalConfig)
        .where(eq(portalConfig.portalUrl, portalUrl))
        .limit(1);

      return portal || null;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao buscar portal por URL',
        portalUrl,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Busca portal por ID
   */
  async findById(id: string): Promise<PortalConfig | null> {
    try {
      const [portal] = await db
        .select()
        .from(portalConfig)
        .where(eq(portalConfig.id, id))
        .limit(1);

      return portal || null;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao buscar portal por ID',
        id,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Lista todos os portais ativos
   */
  async listAll(): Promise<PortalConfig[]> {
    try {
      const portals = await db.select().from(portalConfig);
      return portals;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao listar portais',
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  }

  /**
   * Cria novo portal
   */
  async create(data: {
    portalUrl: string;
    clientId: string;
    clientSecret: string;
  }): Promise<PortalConfig | null> {
    try {
      const [newPortal] = await db
        .insert(portalConfig)
        .values({
          portalUrl: data.portalUrl,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.info({
        msg: '✅ Novo portal criado',
        portalUrl: newPortal.portalUrl,
        id: newPortal.id,
      });

      return newPortal;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao criar portal',
        data,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Atualiza tokens do portal
   */
  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<boolean> {
    try {
      const expirationTime = new Date(Date.now() + expiresIn * 1000);

      await db
        .update(portalConfig)
        .set({
          accessToken,
          refreshToken,
          tokenExpirationTime: expirationTime,
          updatedAt: new Date(),
        })
        .where(eq(portalConfig.id, id));

      logger.debug({
        msg: '🔄 Tokens atualizados',
        portalId: id,
      });

      return true;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao atualizar tokens',
        portalId: id,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Deleta portal
   */
  async delete(id: string): Promise<boolean> {
    try {
      await db.delete(portalConfig).where(eq(portalConfig.id, id));

      logger.info({
        msg: '🗑️ Portal deletado',
        portalId: id,
      });

      return true;
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao deletar portal',
        portalId: id,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Identifica portal pela requisição (header ou domínio)
   */
  async identifyPortal(request: any): Promise<PortalConfig | null> {
    // Tenta identificar por header customizado
    const portalId = request.headers['x-portal-id'];
    if (portalId) {
      return this.findById(portalId);
    }

    // Tenta identificar por URL do portal no header
    const portalUrl = request.headers['x-portal-url'];
    if (portalUrl) {
      return this.findByUrl(portalUrl);
    }

    // Se não encontrou, retorna o primeiro portal (fallback)
    const portals = await this.listAll();
    if (portals.length > 0) {
      logger.debug('Usando portal padrão (primeiro da lista)');
      return portals[0];
    }

    logger.warn('⚠️ Nenhum portal configurado no sistema');
    return null;
  }
}

// Exporta instância singleton
export const portalService = new PortalService();

