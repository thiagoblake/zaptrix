import { pgTable, varchar, text, timestamp, bigint, uuid } from 'drizzle-orm/pg-core';

/**
 * Tabela PortalConfig
 * Armazena as credenciais e tokens do Bitrix24
 */
export const portalConfig = pgTable('portal_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  portalUrl: varchar('portal_url', { length: 255 }).notNull().unique(),
  clientId: varchar('client_id', { length: 255 }).notNull(),
  clientSecret: varchar('client_secret', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpirationTime: timestamp('token_expiration_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tabela ConversationMapping
 * Liga o ID do WhatsApp (Meta) ao ID do Bitrix24 (Contato/Lead e Chat)
 */
export const conversationMapping = pgTable('conversation_mapping', {
  id: uuid('id').primaryKey().defaultRandom(),
  metaWhatsappId: varchar('meta_whatsapp_id', { length: 50 }).notNull().unique(),
  bitrixContactId: bigint('bitrix_contact_id', { mode: 'number' }).notNull(),
  bitrixChatId: bigint('bitrix_chat_id', { mode: 'number' }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tipos inferidos dos schemas para uso no código
export type PortalConfig = typeof portalConfig.$inferSelect;
export type NewPortalConfig = typeof portalConfig.$inferInsert;

export type ConversationMapping = typeof conversationMapping.$inferSelect;
export type NewConversationMapping = typeof conversationMapping.$inferInsert;

