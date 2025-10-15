import { FastifyPluginAsync } from 'fastify';
import { portalService } from '../../services/portal/portal.service';
import { logger } from '../../config/logger';

/**
 * Rotas de gerenciamento de portais (Multi-tenant)
 */
const portalRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /portals
   * Lista todos os portais
   */
  fastify.get('/portals', {
    schema: {
      description: 'Lista todos os portais configurados',
      tags: ['Portals'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              portalUrl: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const portals = await portalService.listAll();

    // Remove dados sensíveis
    const sanitized = portals.map(p => ({
      id: p.id,
      portalUrl: p.portalUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return sanitized;
  });

  /**
   * POST /portals
   * Cria novo portal
   */
  fastify.post<{
    Body: {
      portalUrl: string;
      clientId: string;
      clientSecret: string;
    };
  }>('/portals', {
    schema: {
      description: 'Cria novo portal',
      tags: ['Portals'],
      body: {
        type: 'object',
        required: ['portalUrl', 'clientId', 'clientSecret'],
        properties: {
          portalUrl: { type: 'string' },
          clientId: { type: 'string' },
          clientSecret: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            portalUrl: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { portalUrl, clientId, clientSecret } = request.body;

    const portal = await portalService.create({
      portalUrl,
      clientId,
      clientSecret,
    });

    if (!portal) {
      return reply.code(500).send({
        error: 'Failed to create portal',
      });
    }

    return reply.code(201).send({
      id: portal.id,
      portalUrl: portal.portalUrl,
      message: 'Portal created successfully',
    });
  });

  /**
   * DELETE /portals/:id
   * Deleta portal
   */
  fastify.delete<{
    Params: {
      id: string;
    };
  }>('/portals/:id', {
    schema: {
      description: 'Deleta portal',
      tags: ['Portals'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const success = await portalService.delete(id);

    if (!success) {
      return reply.code(500).send({
        error: 'Failed to delete portal',
      });
    }

    return {
      message: 'Portal deleted successfully',
    };
  });
};

export default portalRoutes;

