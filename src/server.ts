import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { env } from './config/env';
import { logger } from './config/logger';
import { testConnection } from './db';

/**
 * Cria e configura o servidor Fastify
 */
export async function buildServer() {
  const server = Fastify({
    logger: logger,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  });

  // Registra Swagger para documentação
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Zaptrix API',
        description: 'Serviço de Gateway para Integração Bitrix24 e Meta Cloud API (WhatsApp Business API)',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: env.NODE_ENV === 'development' ? 'Servidor de Desenvolvimento' : 'Servidor de Produção',
        },
      ],
      tags: [
        { name: 'Meta Webhooks', description: 'Endpoints para receber webhooks da Meta Cloud API' },
        { name: 'Bitrix24 Webhooks', description: 'Endpoints para receber webhooks do Bitrix24' },
        { name: 'Health', description: 'Endpoints de status do serviço' },
      ],
    },
  });

  // Registra Swagger UI
  await server.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });

  // Health check endpoint
  server.get('/health', {
    schema: {
      description: 'Health check do serviço',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            database: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const dbConnected = await testConnection();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
    };
  });

  // Registrar rotas de webhooks
  await server.register(import('./routes/webhooks/meta.routes'), { prefix: '/webhooks' });
  await server.register(import('./routes/webhooks/bitrix24.routes'), { prefix: '/webhooks' });

  return server;
}

/**
 * Inicia o servidor
 */
export async function startServer() {
  try {
    const server = await buildServer();

    // Testa conexão com o banco de dados antes de iniciar
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    logger.info('✅ Conexão com o banco de dados estabelecida');

    await server.listen({ port: env.PORT, host: env.HOST });

    logger.info(`🚀 Servidor rodando em http://${env.HOST}:${env.PORT}`);
    logger.info(`📚 Documentação disponível em http://${env.HOST}:${env.PORT}/documentation`);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Recebido sinal ${signal}, encerrando servidor...`);
        await server.close();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

