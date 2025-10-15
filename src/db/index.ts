import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

/**
 * Configuração da conexão com PostgreSQL
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

/**
 * Instância do Drizzle ORM
 * Exportada para ser utilizada em todos os serviços
 */
export const db = drizzle(pool, { schema });

/**
 * Função para testar a conexão com o banco de dados
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

/**
 * Função para fechar a conexão com o banco de dados
 */
export async function closeConnection(): Promise<void> {
  await pool.end();
}

export { schema };

