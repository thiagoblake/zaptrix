import dotenv from 'dotenv';
import { z } from 'zod';

// Carrega variáveis de ambiente
dotenv.config();

// Schema de validação para variáveis de ambiente
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),

  // Meta Cloud API
  META_VERIFY_TOKEN: z.string().min(1),
  META_ACCESS_TOKEN: z.string().min(1),
  META_PHONE_NUMBER_ID: z.string().min(1),
  META_API_VERSION: z.string().default('v18.0'),

  // Bitrix24
  BITRIX_PORTAL_URL: z.string().url(),
  BITRIX_CLIENT_ID: z.string().min(1),
  BITRIX_CLIENT_SECRET: z.string().min(1),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

// Valida e exporta as variáveis de ambiente
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Erro na validação das variáveis de ambiente:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

export const env = parseEnv();

// Tipos exportados
export type Env = z.infer<typeof envSchema>;

