# Documentação da API - Zaptrix

## 📚 Visão Geral

A API do Zaptrix oferece endpoints para integração entre Meta Cloud API (WhatsApp) e Bitrix24.

**Base URL**: `http://localhost:3000` (desenvolvimento)

**Documentação Interativa**: `http://localhost:3000/documentation`

## 🔍 Health Check

### GET /health

Verifica o status do serviço e conexão com o banco de dados.

**Response 200 OK**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

---

## 📱 Meta Webhooks

### GET /webhooks/meta

Endpoint de verificação do webhook da Meta Cloud API.

**Query Parameters**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| hub.mode | string | Modo de verificação (sempre "subscribe") |
| hub.verify_token | string | Token de verificação configurado |
| hub.challenge | string | Challenge enviado pela Meta |

**Response 200 OK**

Retorna o challenge como string pura.

**Response 403 Forbidden**
```json
{
  "error": "Token de verificação inválido"
}
```

**Exemplo de Uso**

```bash
curl "http://localhost:3000/webhooks/meta?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=12345"
```

---

### POST /webhooks/meta

Recebe notificações de mensagens do WhatsApp via Meta Cloud API.

**Request Body**

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "PHONE_NUMBER_ID"
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
                "id": "wamid.xxx",
                "timestamp": "1642245600",
                "type": "text",
                "text": {
                  "body": "Olá, preciso de ajuda!"
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

**Response 200 OK**
```json
{
  "status": "ok"
}
```

**Fluxo de Processamento**

1. Webhook recebido e validado
2. Extrai dados da mensagem e contato
3. Verifica se existe mapeamento no banco
4. Se novo: cria contato e chat no Bitrix24
5. Envia mensagem para o Bitrix24
6. Retorna confirmação

---

## 🏢 Bitrix24 Webhooks

### POST /webhooks/bitrix24/outbound

Recebe notificações de mensagens enviadas pelos agentes no Bitrix24.

**Request Body**

```json
{
  "event": "ONIMMESSAGEADD",
  "data": {
    "PARAMS": {
      "DIALOG_ID": "chat123",
      "MESSAGE_ID": "456",
      "FROM_USER_ID": "1",
      "MESSAGE": "Olá! Como posso ajudar?",
      "DATE_CREATE": "2024-01-15 10:30:00",
      "CHAT_TYPE": "open",
      "CHAT_ENTITY_TYPE": "LINES",
      "CHAT_ENTITY_ID": "zaptrix"
    }
  },
  "ts": "1642245600",
  "auth": {
    "access_token": "xxx",
    "expires_in": 3600,
    "domain": "seu-portal.bitrix24.com.br"
  }
}
```

**Response 200 OK**
```json
{
  "status": "ok"
}
```

**Fluxo de Processamento**

1. Webhook recebido e validado
2. Extrai ID do chat e mensagem
3. Busca mapeamento no banco pelo bitrixChatId
4. Obtém metaWhatsappId
5. Envia mensagem via Meta Cloud API
6. Cliente recebe no WhatsApp
7. Retorna confirmação

---

## 🔐 Autenticação

### Meta Cloud API

Utiliza Bearer Token permanente configurado nas variáveis de ambiente.

```
Authorization: Bearer YOUR_META_ACCESS_TOKEN
```

### Bitrix24

Utiliza OAuth 2.0 com refresh token automático:

1. Tokens armazenados no banco de dados
2. Sistema verifica validade antes de cada requisição
3. Renova automaticamente se expirado
4. Transparente para o usuário

---

## 📊 Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 403 | Token de verificação inválido |
| 500 | Erro interno do servidor |

---

## 🔄 Webhooks - Boas Práticas

### Retry Policy

A Meta e o Bitrix24 implementam políticas de retry:

- **Meta**: Retry exponencial (até 24h)
- **Bitrix24**: Configurável no aplicativo

### Timeouts

- Requisições devem responder em < 20 segundos
- Use processamento assíncrono para operações longas

### Segurança

1. **Validação de Origem**: Sempre valide tokens
2. **HTTPS**: Use sempre em produção
3. **Rate Limiting**: Implemente limitação de taxa

### Idempotência

- Webhooks podem ser enviados múltiplas vezes
- Use IDs de mensagem para deduplicação
- Operações devem ser idempotentes

---

## 🧪 Testando a API

### Usando cURL

**Health Check**
```bash
curl http://localhost:3000/health
```

**Simulando Webhook da Meta**
```bash
curl -X POST http://localhost:3000/webhooks/meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [...]
  }'
```

### Usando Postman/Insomnia

Importe a coleção disponível em `/docs/postman-collection.json`

### Ferramentas de Teste

- **ngrok**: Túnel HTTPS para testes locais
- **webhook.site**: Inspeção de webhooks
- **Postman**: Cliente API

---

## 📝 Exemplos Completos

### Exemplo 1: Nova Conversa

```
1. Cliente "João" envia: "Olá" no WhatsApp
   ↓
2. Meta envia webhook para /webhooks/meta
   ↓
3. Sistema:
   - Não encontra mapeamento para "5511988888888"
   - Cria contato "João" no Bitrix24 (ID: 100)
   - Cria chat no Canal Aberto (ID: 200)
   - Salva mapeamento no banco
   - Envia "Olá" para o chat 200
   ↓
4. Agente "Maria" responde: "Olá João!" no Bitrix24
   ↓
5. Bitrix24 envia webhook para /webhooks/bitrix24/outbound
   ↓
6. Sistema:
   - Encontra mapeamento chat 200 → "5511988888888"
   - Envia "Olá João!" via Meta API
   ↓
7. João recebe mensagem no WhatsApp
```

### Exemplo 2: Conversa Existente

```
1. Cliente "João" (já mapeado) envia: "Obrigado!"
   ↓
2. Sistema:
   - Encontra mapeamento existente
   - Envia direto para chat 200 no Bitrix24
   - Atualiza timestamp last_message_at
```

---

## 🚨 Tratamento de Erros

### Erros Comuns

**Erro: Token de verificação inválido**
```json
{
  "error": "Token de verificação inválido"
}
```
**Solução**: Verifique `META_VERIFY_TOKEN` no .env

**Erro: Falha ao criar contato no Bitrix24**

Verifique logs:
```bash
npm run docker:logs
```

**Erro: Banco de dados desconectado**

Verifique status:
```bash
curl http://localhost:3000/health
```

### Monitoramento

- Todos os erros são logados com contexto
- Use `LOG_LEVEL=debug` para mais detalhes
- Consulte logs em tempo real durante desenvolvimento

---

## 📞 Suporte

Para questões sobre a API:
- Consulte a [documentação completa](../README.md)
- Verifique os [logs do servidor](../README.md#logs)
- Abra uma issue no repositório

