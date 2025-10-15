import { startServer } from './server';
import { logger } from './config/logger';
import './queues/workers'; // Importa workers para inicialização

/**
 * Ponto de entrada da aplicação
 * Inicia o servidor Fastify, workers e gerencia o lifecycle
 */
async function main() {
  try {
    logger.info('🚀 Iniciando Zaptrix - Integração Bitrix24 & Meta Cloud API');
    
    await startServer();
  } catch (error) {
    logger.error('❌ Falha fatal ao iniciar aplicação:', error);
    process.exit(1);
  }
}

// Inicia a aplicação
main();

