# Exemplos de Webhooks - Zaptrix

Este documento contém exemplos reais de payloads de webhooks para facilitar testes e desenvolvimento.

---

## 📱 Meta Cloud API (WhatsApp) - Webhooks

### Verificação de Webhook (GET)

**Requisição da Meta**:
```
GET /webhooks/meta?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=1158201444
```

**Resposta Esperada**:
```
1158201444
```

---

### Mensagem de Texto Recebida (POST)

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "106540205695738"
            },
            "contacts": [
              {
                "profile": {
                  "name": "João Silva"
                },
                "wa_id": "5511988888888"
              }
            ],
            "messages": [
              {
                "from": "5511988888888",
                "id": "wamid.HBgNNTUxMTk4ODg4ODg4OBUCABIYIDNBMjVBMjE4OTVFMjA1NUI3Rjk0",
                "timestamp": "1642245600",
                "type": "text",
                "text": {
                  "body": "Olá! Preciso de ajuda com meu pedido."
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

---

### Status de Mensagem (Entregue/Lida)

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "106540205695738"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNTUxMTk4ODg4ODg4OBUCABIYIDNBMjVBMjE4OTVFMjA1NUI3Rjk0",
                "status": "delivered",
                "timestamp": "1642245650",
                "recipient_id": "5511988888888",
                "conversation": {
                  "id": "83b2c8dbf90c7e23fbbbf3c1f61c2b93",
                  "expiration_timestamp": "1642331650",
                  "origin": {
                    "type": "user_initiated"
                  }
                },
                "pricing": {
                  "billable": true,
                  "pricing_model": "CBP",
                  "category": "user_initiated"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

---

### Mensagem com Imagem

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "106540205695738"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Maria Santos"
                },
                "wa_id": "5511977777777"
              }
            ],
            "messages": [
              {
                "from": "5511977777777",
                "id": "wamid.HBgNNTUxMTk3Nzc3Nzc3NxUCABIYIEU0QTY4M0Y3QjQwNzEwQjU5",
                "timestamp": "1642245700",
                "type": "image",
                "image": {
                  "caption": "Foto do produto com defeito",
                  "mime_type": "image/jpeg",
                  "sha256": "29ed500fa64eb55fc19dc4124acb300e5dcca0f822a301ae99944db",
                  "id": "1234567890"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

---

## 🏢 Bitrix24 - Webhooks

### Mensagem Adicionada no Chat (ONIMMESSAGEADD)

```json
{
  "event": "ONIMMESSAGEADD",
  "data": {
    "PARAMS": {
      "DIALOG_ID": "chat456",
      "MESSAGE_ID": "789",
      "FROM_USER_ID": "1",
      "TO_USER_ID": "0",
      "MESSAGE": "Olá João! Obrigado por entrar em contato. Como posso ajudá-lo com seu pedido?",
      "DATE_CREATE": "2024-01-15 10:35:00",
      "CHAT_TYPE": "open",
      "CHAT_ENTITY_TYPE": "LINES",
      "CHAT_ENTITY_ID": "zaptrix|5511988888888"
    }
  },
  "ts": "1642245900",
  "auth": {
    "access_token": "a1b2c3d4e5f6g7h8i9j0",
    "expires_in": 3600,
    "scope": "crm,im,imconnector",
    "domain": "seu-portal.bitrix24.com.br",
    "server_endpoint": "https://oauth.bitrix.info/oauth/token/",
    "status": "L",
    "member_id": "da45a03b265edd8787f8a258d793cc5d",
    "application_token": "k9l8m7n6o5p4q3r2s1t0"
  }
}
```

---

### Mensagem Atualizada (ONIMMESSAGEUPDATE)

```json
{
  "event": "ONIMMESSAGEUPDATE",
  "data": {
    "PARAMS": {
      "MESSAGE_ID": "789",
      "DIALOG_ID": "chat456",
      "MESSAGE": "Olá João! [Mensagem editada]",
      "FROM_USER_ID": "1"
    }
  },
  "ts": "1642245950",
  "auth": {
    "access_token": "a1b2c3d4e5f6g7h8i9j0",
    "expires_in": 3600,
    "domain": "seu-portal.bitrix24.com.br"
  }
}
```

---

### Chat Criado (ONIMCHATCREATE)

```json
{
  "event": "ONIMCHATCREATE",
  "data": {
    "FIELDS": {
      "ID": "456",
      "TITLE": "WhatsApp: João Silva",
      "TYPE": "open",
      "ENTITY_TYPE": "LINES",
      "ENTITY_ID": "zaptrix|5511988888888",
      "OWNER": "1",
      "DATE_CREATE": "2024-01-15 10:30:00"
    }
  },
  "ts": "1642245600",
  "auth": {
    "domain": "seu-portal.bitrix24.com.br"
  }
}
```

---

## 🧪 Como Usar Estes Exemplos

### Com cURL

**Testar Webhook da Meta**:
```bash
curl -X POST http://localhost:3000/webhooks/meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "102290129340398",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "5511999999999",
                "phone_number_id": "106540205695738"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "João Silva"
                  },
                  "wa_id": "5511988888888"
                }
              ],
              "messages": [
                {
                  "from": "5511988888888",
                  "id": "wamid.test123",
                  "timestamp": "1642245600",
                  "type": "text",
                  "text": {
                    "body": "Teste de mensagem"
                  }
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  }'
```

**Testar Webhook do Bitrix24**:
```bash
curl -X POST http://localhost:3000/webhooks/bitrix24/outbound \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ONIMMESSAGEADD",
    "data": {
      "PARAMS": {
        "DIALOG_ID": "chat456",
        "MESSAGE_ID": "789",
        "FROM_USER_ID": "1",
        "MESSAGE": "Teste de resposta",
        "DATE_CREATE": "2024-01-15 10:35:00"
      }
    },
    "ts": "1642245900"
  }'
```

---

### Com Postman

1. Importe a coleção (se disponível) ou crie manualmente
2. Configure a base URL: `http://localhost:3000`
3. Copie os payloads acima nos corpos das requisições
4. Envie as requisições

---

### Com Arquivo JSON

Salve o payload em um arquivo e use:

```bash
curl -X POST http://localhost:3000/webhooks/meta \
  -H "Content-Type: application/json" \
  -d @payload-meta.json
```

---

## 🔍 Respostas Esperadas

### Sucesso (200 OK)

```json
{
  "status": "ok"
}
```

### Webhook Ignorado (200 OK)

```json
{
  "status": "ignored"
}
```

### Erro de Verificação (403 Forbidden)

```json
{
  "error": "Token de verificação inválido"
}
```

---

## 📝 Logs Esperados

### Processamento de Mensagem da Meta

```
[INFO] 📨 Webhook recebido da Meta
[INFO] 📩 Processando mensagem do WhatsApp
[INFO] 👤 Novo contato detectado, criando no Bitrix24
[INFO] ✅ Contato criado no Bitrix24
[INFO] ✅ Chat de Canal Aberto criado
[INFO] ✅ Novo mapeamento de conversa criado
[INFO] ✅ Mensagem enviada ao Bitrix24
```

### Processamento de Mensagem do Bitrix24

```
[INFO] 📨 Webhook recebido do Bitrix24
[INFO] 📤 Processando mensagem de saída do Bitrix24
[INFO] ✅ Mensagem enviada ao WhatsApp
```

---

## 🛠️ Ferramentas Úteis

### webhook.site

Use para inspecionar webhooks:
1. Acesse https://webhook.site/
2. Copie a URL única
3. Configure temporariamente nos webhooks
4. Visualize payloads recebidos

### ngrok

Para testes locais:
```bash
ngrok http 3000
```

Use a URL HTTPS do ngrok nos webhooks da Meta/Bitrix24.

### Postman Echo

Teste seus webhooks:
```
https://postman-echo.com/post
```

---

## 📚 Referências

- [Meta Cloud API - Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Bitrix24 REST API - Events](https://dev.bitrix24.com/rest_help/im/events/index.php)
- [Bitrix24 Open Channel](https://dev.bitrix24.com/rest_help/im/imconnector/index.php)

---

**Nota**: Substitua os IDs e tokens de exemplo pelos seus valores reais em produção.

