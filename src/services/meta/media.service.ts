import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Serviço para lidar com mídia (imagens, vídeos, documentos) na Meta Cloud API
 */
export class MediaService {
  private readonly baseURL: string;
  private readonly accessToken: string;

  constructor() {
    this.baseURL = `https://graph.facebook.com/${env.META_API_VERSION}`;
    this.accessToken = env.META_ACCESS_TOKEN;
  }

  /**
   * Envia imagem via WhatsApp
   */
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<any> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption || '',
        },
      };

      const response = await axios.post(
        `${this.baseURL}/${env.META_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info({
        msg: '✅ Imagem enviada',
        to,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error('❌ Erro ao enviar imagem:', error);
      throw error;
    }
  }

  /**
   * Envia vídeo via WhatsApp
   */
  async sendVideo(to: string, videoUrl: string, caption?: string): Promise<any> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'video',
        video: {
          link: videoUrl,
          caption: caption || '',
        },
      };

      const response = await axios.post(
        `${this.baseURL}/${env.META_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info({
        msg: '✅ Vídeo enviado',
        to,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error('❌ Erro ao enviar vídeo:', error);
      throw error;
    }
  }

  /**
   * Envia documento via WhatsApp
   */
  async sendDocument(to: string, documentUrl: string, filename?: string, caption?: string): Promise<any> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename || 'document',
          caption: caption || '',
        },
      };

      const response = await axios.post(
        `${this.baseURL}/${env.META_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info({
        msg: '✅ Documento enviado',
        to,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error('❌ Erro ao enviar documento:', error);
      throw error;
    }
  }

  /**
   * Envia áudio via WhatsApp
   */
  async sendAudio(to: string, audioUrl: string): Promise<any> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'audio',
        audio: {
          link: audioUrl,
        },
      };

      const response = await axios.post(
        `${this.baseURL}/${env.META_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      logger.info({
        msg: '✅ Áudio enviado',
        to,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error('❌ Erro ao enviar áudio:', error);
      throw error;
    }
  }

  /**
   * Baixa mídia recebida
   */
  async downloadMedia(mediaId: string): Promise<Buffer | null> {
    try {
      // Primeiro, obtém a URL da mídia
      const mediaInfoResponse = await axios.get(
        `${this.baseURL}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      const mediaUrl = mediaInfoResponse.data.url;

      // Baixa a mídia
      const mediaResponse = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        responseType: 'arraybuffer',
      });

      logger.info({
        msg: '✅ Mídia baixada',
        mediaId,
        size: mediaResponse.data.length,
      });

      return Buffer.from(mediaResponse.data);
    } catch (error) {
      logger.error({
        msg: '❌ Erro ao baixar mídia',
        mediaId,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }
}

// Exporta instância singleton
export const mediaService = new MediaService();

