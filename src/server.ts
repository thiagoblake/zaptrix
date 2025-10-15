import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { env } from './config/env';
import { logger } from './config/logger';
import { testConnection } from './db';
import { testRedisConnection } from './config/redis';
import { cacheService } from './services/cache/cache.service';
import { getQueuesStats } from './queues/queues';
import { prometheusService } from './services/metrics/prometheus.service';

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
            redis: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const dbConnected = await testConnection();
    const redisConnected = await testRedisConnection();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
    };
  });

  // Cache stats endpoint
  server.get('/cache/stats', {
    schema: {
      description: 'Estatísticas do cache Redis',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            usedMemory: { type: 'string' },
            connectedClients: { type: 'number' },
            totalKeys: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const stats = await cacheService.getStats();
    return stats;
  });

  // Queues stats endpoint
  server.get('/queues/stats', {
    schema: {
      description: 'Estatísticas das filas de processamento',
      tags: ['Health'],
    },
  }, async (request, reply) => {
    const stats = await getQueuesStats();
    return stats || { error: 'Failed to get queue stats' };
  });

  // Prometheus metrics endpoint
  server.get('/metrics', {
    schema: {
      description: 'Métricas Prometheus',
      tags: ['Monitoring'],
    },
  }, async (request, reply) => {
    reply.header('Content-Type', prometheusService.register.contentType);
    return prometheusService.getMetrics();
  });

  // Metrics JSON endpoint (para debugging)
  server.get('/metrics/json', {
    schema: {
      description: 'Métricas em formato JSON',
      tags: ['Monitoring'],
    },
  }, async (request, reply) => {
    return prometheusService.getMetricsJSON();
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

    // Testa conexões antes de iniciar
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }
    logger.info('✅ Conexão com o banco de dados estabelecida');

    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      logger.warn('⚠️ Redis não está disponível, cache desabilitado');
    } else {
      logger.info('✅ Conexão com Redis estabelecida');
    }

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

