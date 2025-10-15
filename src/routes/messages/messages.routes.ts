import { FastifyPluginAsync } from 'fastify';
import { mediaService } from '../../services/meta/media.service';
import { templateService } from '../../services/meta/template.service';
import { logger } from '../../config/logger';

/**
 * Rotas para envio de mensagens rich e templates
 */
const messagesRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /messages/image
   * Envia imagem via WhatsApp
   */
  fastify.post<{
    Body: {
      to: string;
      imageUrl: string;
      caption?: string;
    };
  }>('/messages/image', {
    schema: {
      description: 'Envia imagem via WhatsApp',
      tags: ['Messages'],
      body: {
        type: 'object',
        required: ['to', 'imageUrl'],
        properties: {
          to: { type: 'string' },
          imageUrl: { type: 'string' },
          caption: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { to, imageUrl, caption } = request.body;

    try {
      const result = await mediaService.sendImage(to, imageUrl, caption);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /messages/video
   * Envia vídeo via WhatsApp
   */
  fastify.post<{
    Body: {
      to: string;
      videoUrl: string;
      caption?: string;
    };
  }>('/messages/video', {
    schema: {
      description: 'Envia vídeo via WhatsApp',
      tags: ['Messages'],
      body: {
        type: 'object',
        required: ['to', 'videoUrl'],
        properties: {
          to: { type: 'string' },
          videoUrl: { type: 'string' },
          caption: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { to, videoUrl, caption } = request.body;

    try {
      const result = await mediaService.sendVideo(to, videoUrl, caption);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /messages/document
   * Envia documento via WhatsApp
   */
  fastify.post<{
    Body: {
      to: string;
      documentUrl: string;
      filename?: string;
      caption?: string;
    };
  }>('/messages/document', {
    schema: {
      description: 'Envia documento via WhatsApp',
      tags: ['Messages'],
      body: {
        type: 'object',
        required: ['to', 'documentUrl'],
        properties: {
          to: { type: 'string' },
          documentUrl: { type: 'string' },
          filename: { type: 'string' },
          caption: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { to, documentUrl, filename, caption } = request.body;

    try {
      const result = await mediaService.sendDocument(to, documentUrl, filename, caption);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /messages/template
   * Envia template do WhatsApp
   */
  fastify.post<{
    Body: {
      to: string;
      templateName: string;
      parameters?: string[];
      languageCode?: string;
    };
  }>('/messages/template', {
    schema: {
      description: 'Envia template do WhatsApp',
      tags: ['Messages'],
      body: {
        type: 'object',
        required: ['to', 'templateName'],
        properties: {
          to: { type: 'string' },
          templateName: { type: 'string' },
          parameters: { type: 'array', items: { type: 'string' } },
          languageCode: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { to, templateName, parameters, languageCode } = request.body;

    try {
      let result;
      if (parameters && parameters.length > 0) {
        result = await templateService.sendTemplateWithParams(to, templateName, parameters, languageCode);
      } else {
        result = await templateService.sendTemplate(to, templateName, languageCode);
      }

      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /messages/templates
   * Lista templates aprovados
   */
  fastify.get('/messages/templates', {
    schema: {
      description: 'Lista templates do WhatsApp aprovados',
      tags: ['Messages'],
    },
  }, async (request, reply) => {
    try {
      const result = await templateService.listTemplates();
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export default messagesRoutes;

