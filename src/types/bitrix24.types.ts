/**
 * Tipos relacionados à API REST do Bitrix24
 */

/**
 * Resposta de autenticação OAuth do Bitrix24
 */
export interface Bitrix24AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  domain: string;
  server_endpoint: string;
  status: string;
  client_endpoint: string;
  member_id: string;
  user_id: number;
  expires: number;
}

/**
 * Resposta padrão da API do Bitrix24
 */
export interface Bitrix24ApiResponse<T = any> {
  result?: T;
  time?: {
    start: number;
    finish: number;
    duration: number;
    processing: number;
    date_start: string;
    date_finish: string;
  };
  error?: string;
  error_description?: string;
}

/**
 * Estrutura de contato do Bitrix24
 */
export interface Bitrix24Contact {
  ID: string;
  NAME?: string;
  LAST_NAME?: string;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  ASSIGNED_BY_ID?: string;
}

/**
 * Estrutura de lead do Bitrix24
 */
export interface Bitrix24Lead {
  ID: string;
  TITLE?: string;
  NAME?: string;
  LAST_NAME?: string;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  ASSIGNED_BY_ID?: string;
}

/**
 * Estrutura de chat do Canal Aberto do Bitrix24
 */
export interface Bitrix24Chat {
  ID: string;
  TYPE: string;
  ENTITY_TYPE?: string;
  ENTITY_ID?: string;
  OWNER?: string;
  TITLE?: string;
  MESSAGE_COUNT?: number;
}

/**
 * Estrutura de mensagem do Bitrix24
 */
export interface Bitrix24Message {
  ID: string;
  CHAT_ID: string;
  AUTHOR_ID: string;
  MESSAGE: string;
  DATE_CREATE?: string;
  PARAMS?: Record<string, any>;
}

/**
 * Webhook de saída do Bitrix24 (evento onImMessageAdd)
 */
export interface Bitrix24OutboundWebhook {
  event: string;
  data: {
    PARAMS: {
      DIALOG_ID: string;
      MESSAGE_ID: string;
      FROM_USER_ID: string;
      TO_USER_ID?: string;
      MESSAGE: string;
      DATE_CREATE?: string;
      CHAT_TYPE?: string;
      CHAT_ENTITY_TYPE?: string;
      CHAT_ENTITY_ID?: string;
    };
  };
  ts: string;
  auth: {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    domain?: string;
    server_endpoint?: string;
    status?: string;
    member_id?: string;
    application_token?: string;
  };
}

/**
 * Parâmetros para criar um novo contato
 */
export interface CreateContactParams {
  NAME?: string;
  LAST_NAME?: string;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  ASSIGNED_BY_ID?: string;
}

/**
 * Parâmetros para criar um novo lead
 */
export interface CreateLeadParams {
  TITLE: string;
  NAME?: string;
  LAST_NAME?: string;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  ASSIGNED_BY_ID?: string;
}

/**
 * Parâmetros para criar um novo chat do Canal Aberto
 */
export interface CreateOpenChannelParams {
  TYPE: 'OPEN';
  ENTITY_TYPE?: string;
  ENTITY_ID?: string;
  OWNER_ID?: string;
  TITLE?: string;
  USERS?: number[];
}

/**
 * Parâmetros para enviar mensagem no chat
 */
export interface SendMessageParams {
  DIALOG_ID: string;
  MESSAGE: string;
  SYSTEM?: 'Y' | 'N';
  PARAMS?: Record<string, any>;
}

