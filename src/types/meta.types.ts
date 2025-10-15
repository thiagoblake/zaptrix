/**
 * Tipos relacionados à Meta Cloud API (WhatsApp Business API)
 */

/**
 * Webhook de verificação da Meta
 */
export interface MetaWebhookVerification {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

/**
 * Estrutura de mensagem recebida da Meta
 */
export interface MetaWebhookMessage {
  object: string;
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  value: MetaWebhookValue;
  field: string;
}

export interface MetaWebhookValue {
  messaging_product: string;
  metadata: MetaWebhookMetadata;
  contacts?: MetaContact[];
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
}

export interface MetaWebhookMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface MetaContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface MetaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts' | 'interactive';
  text?: {
    body: string;
  };
  image?: MetaMediaMessage;
  video?: MetaMediaMessage;
  audio?: MetaMediaMessage;
  document?: MetaMediaMessage;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface MetaMediaMessage {
  id: string;
  mime_type: string;
  sha256: string;
  caption?: string;
}

export interface MetaStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

/**
 * Estrutura para enviar mensagem via Meta Cloud API
 */
export interface MetaSendMessageRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url?: boolean;
    body: string;
  };
}

export interface MetaSendMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

/**
 * Resposta de erro da Meta API
 */
export interface MetaErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

