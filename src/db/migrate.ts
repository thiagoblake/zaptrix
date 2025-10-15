import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Script de migração do banco de dados
 * Execute: npm run db:migrate
 */
async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🔄 Executando migrações...');

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('✅ Migrações concluídas com sucesso!');

  await pool.end();
}

main().catch((error) => {
  console.error('❌ Erro ao executar migrações:', error);
  process.exit(1);
});

