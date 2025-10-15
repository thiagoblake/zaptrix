/**
 * Tipos de jobs das filas
 */

/**
 * Job para processar mensagem recebida do WhatsApp
 */
export interface ProcessIncomingMessageJob {
  messageId: string;
  from: string;
  contactName: string;
  messageText: string;
  messageType: string;
  timestamp: string;
  metadata?: {
    phoneNumberId: string;
    displayPhoneNumber: string;
  };
}

/**
 * Job para processar mensagem de saída do Bitrix24
 */
export interface ProcessOutboundMessageJob {
  bitrixChatId: number;
  message: string;
  fromUserId: string;
  messageId: string;
  timestamp: string;
}

/**
 * Job para enviar mensagem via Meta Cloud API
 */
export interface SendMetaMessageJob {
  to: string;
  message: string;
  retryCount?: number;
}

/**
 * Job para enviar mensagem via Bitrix24
 */
export interface SendBitrix24MessageJob {
  chatId: string;
  message: string;
  retryCount?: number;
}

/**
 * Resultado do processamento de um job
 */
export interface JobResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

