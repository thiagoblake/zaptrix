import { db } from '../src/db';
import { portalConfig } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as readline from 'readline';

/**
 * Script de configuração inicial do portal Bitrix24
 * Execute: tsx scripts/setup-portal.ts
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('🔧 Configuração inicial do Portal Bitrix24\n');

  const portalUrl = await question('URL do Portal (ex: https://seu-portal.bitrix24.com.br): ');
  const clientId = await question('Client ID do Aplicativo Local: ');
  const clientSecret = await question('Client Secret do Aplicativo Local: ');

  console.log('\n📝 Verificando se já existe configuração...');

  const [existing] = await db
    .select()
    .from(portalConfig)
    .where(eq(portalConfig.portalUrl, portalUrl))
    .limit(1);

  if (existing) {
    console.log('⚠️  Portal já existe. Atualizando credenciais...');
    
    await db
      .update(portalConfig)
      .set({
        clientId,
        clientSecret,
        updatedAt: new Date(),
      })
      .where(eq(portalConfig.portalUrl, portalUrl));

    console.log('✅ Credenciais atualizadas com sucesso!');
  } else {
    console.log('➕ Criando nova configuração de portal...');

    await db.insert(portalConfig).values({
      portalUrl,
      clientId,
      clientSecret,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Portal configurado com sucesso!');
  }

  console.log('\n⚠️  IMPORTANTE:');
  console.log('1. Você precisa executar o fluxo OAuth para obter os tokens de acesso.');
  console.log('2. Os tokens serão automaticamente atualizados pelo sistema quando necessário.');
  console.log('3. Configure os webhooks no Bitrix24 para apontar para este serviço.');

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erro durante configuração:', error);
  rl.close();
  process.exit(1);
});

