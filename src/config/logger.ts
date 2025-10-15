import pino from 'pino';
import { env } from './env';

/**
 * Configuração do logger Pino
 * Utilizado para rastrear erros, falhas de autenticação e mensagens processadas
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export default logger;

