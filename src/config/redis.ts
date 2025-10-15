import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

/**
 * Configuração do cliente Redis
 * Utilizado para cache de mapeamentos de conversas e outras operações frequentes
 */
export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

// Event handlers
redis.on('connect', () => {
  logger.info('✅ Redis conectado com sucesso');
});

redis.on('error', (error) => {
  logger.error('❌ Erro no Redis:', error);
});

redis.on('close', () => {
  logger.warn('⚠️ Conexão Redis fechada');
});

/**
 * Testa a conexão com o Redis
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Erro ao testar conexão Redis:', error);
    return false;
  }
}

/**
 * Fecha a conexão com o Redis
 */
export async function closeRedisConnection(): Promise<void> {
  await redis.quit();
}

export default redis;

