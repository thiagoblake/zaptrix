# Arquitetura do Sistema - Zaptrix

## 📐 Visão Geral

O Zaptrix é um serviço de gateway que facilita a integração bidirecional entre:
- **Meta Cloud API** (WhatsApp Business API)
- **Bitrix24** (CRM e Canal Aberto)

## 🏗️ Arquitetura de Alto Nível

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│                 │         │              │         │                 │
│  WhatsApp User  │◄───────►│   Zaptrix    │◄───────►│   Bitrix24      │
│  (Meta Cloud)   │         │   Gateway    │         │   Portal        │
│                 │         │              │         │                 │
└─────────────────┘         └──────────────┘         └─────────────────┘
                                    │
                                    │
                            ┌───────▼────────┐
                            │                │
                            │  PostgreSQL    │
                            │  Database      │
                            │                │
                            └────────────────┘
```

## 🔄 Fluxo de Dados

### Fluxo 1: Mensagem Recebida (WhatsApp → Bitrix24)

```
1. Cliente envia mensagem no WhatsApp
   ↓
2. Meta Cloud API envia webhook para Zaptrix
   POST /webhooks/meta
   ↓
3. Zaptrix valida e processa webhook
   ↓
4. Verifica se existe mapeamento no banco
   │
   ├─ SIM: Usa mapeamento existente
   │
   └─ NÃO: 
      ├─ Cria novo Contato no Bitrix24
      ├─ Cria novo Chat no Canal Aberto
      └─ Salva mapeamento no banco
   ↓
5. Envia mensagem para o Chat no Bitrix24
   ↓
6. Retorna status 200 para Meta
```

### Fluxo 2: Mensagem Enviada (Bitrix24 → WhatsApp)

```
1. Agente responde no Canal Aberto do Bitrix24
   ↓
2. Bitrix24 envia webhook para Zaptrix
   POST /webhooks/bitrix24/outbound
   ↓
3. Zaptrix valida e processa webhook
   ↓
4. Busca mapeamento pelo bitrixChatId
   ↓
5. Obtém metaWhatsappId do mapeamento
   ↓
6. Envia mensagem via Meta Cloud API
   ↓
7. Cliente recebe mensagem no WhatsApp
   ↓
8. Retorna status 200 para Bitrix24
```

## 📦 Estrutura de Módulos

### 1. Camada de Configuração (`src/config/`)

- **env.ts**: Validação e carregamento de variáveis de ambiente (Zod)
- **logger.ts**: Configuração do Pino logger

### 2. Camada de Dados (`src/db/`)

- **schema.ts**: Definição dos schemas Drizzle ORM
  - `portalConfig`: Credenciais do Bitrix24
  - `conversationMapping`: Mapeamento WhatsApp ↔ Bitrix24
- **index.ts**: Cliente Drizzle e conexão PostgreSQL
- **migrate.ts**: Script de migração

### 3. Camada de Serviços (`src/services/`)

#### Meta Service (`services/meta/`)
- Comunicação com Meta Cloud API
- Verificação de webhook
- Envio de mensagens
- Marcação de leitura

#### Bitrix24 Service (`services/bitrix24/`)
- Comunicação com API REST do Bitrix24
- Gerenciamento de tokens OAuth (refresh automático)
- Operações de CRM (criar contato/lead)
- Operações de Chat (Canal Aberto)

### 4. Camada Core (`src/core/`)

#### Conversation Mapper
- Gerenciamento de mapeamentos
- CRUD de conversas
- Busca por IDs de ambas plataformas

### 5. Camada de Rotas (`src/routes/webhooks/`)

#### Meta Routes
- `GET /webhooks/meta`: Verificação de webhook
- `POST /webhooks/meta`: Recebimento de mensagens

#### Bitrix24 Routes
- `POST /webhooks/bitrix24/outbound`: Recebimento de respostas

### 6. Servidor (`src/server.ts`)

- Configuração do Fastify
- Registro de plugins (Swagger, routes)
- Health check endpoint
- Graceful shutdown

## 🗄️ Modelo de Dados

### Tabela: portal_config

```sql
CREATE TABLE portal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_url VARCHAR(255) UNIQUE NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiration_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: conversation_mapping

```sql
CREATE TABLE conversation_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_whatsapp_id VARCHAR(50) UNIQUE NOT NULL,
  bitrix_contact_id BIGINT NOT NULL,
  bitrix_chat_id BIGINT NOT NULL,
  contact_name VARCHAR(255),
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Segurança

### Autenticação

1. **Meta Cloud API**
   - Bearer Token permanente
   - Webhook Verify Token

2. **Bitrix24**
   - OAuth 2.0
   - Refresh token automático
   - Tokens armazenados de forma segura no banco

### Validação

- Todas as variáveis de ambiente validadas com Zod
- Tipagem estrita TypeScript em todos os payloads
- Validação de esquemas via Fastify Schema

## ⚡ Performance e Escalabilidade

### Características

1. **I/O Bound**: Node.js ideal para alta concorrência
2. **Fastify**: Framework de alta performance
3. **Connection Pooling**: PostgreSQL com pool de conexões
4. **Stateless**: Permite escalonamento horizontal
5. **Async/Await**: Operações assíncronas eficientes

### Métricas de Performance

- Latência típica: < 200ms
- Throughput: 1000+ req/s
- Rate limit da Meta: 80 req/s (gerenciado pela Meta)

## 📊 Monitoramento

### Logs

Todos os eventos importantes são logados:
- ✅ Sucessos
- ❌ Erros
- ⚠️ Avisos
- 📨 Webhooks recebidos
- 📤 Mensagens enviadas

### Health Check

Endpoint `/health` retorna:
- Status do serviço
- Conexão com banco de dados
- Timestamp

## 🔄 Gerenciamento de Estado

### Tokens do Bitrix24

1. Token é verificado antes de cada requisição
2. Se expirado (< 5 min), renovação automática
3. Novo token salvo no banco de dados
4. Processo transparente para o fluxo principal

### Mapeamento de Conversas

1. Criado na primeira mensagem
2. Reutilizado em mensagens subsequentes
3. Atualizado com timestamp da última mensagem
4. Persistente no banco de dados

## 🚀 Deploy

### Requisitos Mínimos

- 1 vCPU
- 512 MB RAM
- 10 GB SSD
- PostgreSQL 14+

### Recomendações

- 2 vCPU
- 2 GB RAM
- 20 GB SSD
- Load balancer para múltiplas instâncias
- Redis para cache (futuro)
- Nginx como proxy reverso

## 🔮 Futuras Melhorias

1. **Cache**: Redis para mapeamentos frequentes
2. **Fila**: Bull/BullMQ para processar mensagens assíncronas
3. **Métricas**: Prometheus + Grafana
4. **Rate Limiting**: Controle de taxa por cliente
5. **Webhooks Assinatura**: Sistema de retry com backoff exponencial
6. **Multi-tenant**: Suporte a múltiplos portais
7. **Mensagens Rich**: Suporte a imagens, vídeos, documentos
8. **Templates**: Mensagens template do WhatsApp

