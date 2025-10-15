# Zaptrix 🚀

<div align="center">

**Serviço de Gateway para Integração Bitrix24 & Meta Cloud API (WhatsApp Business)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.26-black.svg)](https://www.fastify.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

</div>

---

## 📖 Sobre o Projeto

Zaptrix é um serviço robusto, escalável e de baixa latência que atua como **ponte de comunicação bidirecional** entre o WhatsApp (via Meta Cloud API) e o Bitrix24 (Canal Aberto). 

Garante que:
- ✅ **Mensagens do WhatsApp** cheguem ao Canal Aberto do Bitrix24
- ✅ **Respostas do Bitrix24** sejam entregues ao cliente via WhatsApp
- ✅ **Contatos sejam criados automaticamente** no CRM
- ✅ **Conversas sejam mapeadas e persistidas** no banco de dados

## ✨ Características

- 🔥 **Alta Performance**: Fastify + Node.js para I/O Bound
- 🔒 **Tipagem Rigorosa**: TypeScript em todo o código
- 📊 **ORM Moderno**: Drizzle ORM com migrações SQL
- 📚 **Documentação Automática**: Swagger/OpenAPI integrado
- 🔄 **Refresh Token Automático**: Gerenciamento inteligente de tokens OAuth
- 📝 **Logging Completo**: Pino logger com níveis configuráveis
- 🐳 **Docker Ready**: Configuração completa para containerização
- 🔐 **Seguro**: Validação de entrada com Zod, HTTPS, rate limiting

## 🚀 Stack Tecnológica

| Componente | Ferramenta | Descrição |
|------------|------------|-----------|
| **Linguagem** | TypeScript (Node.js) | Tipagem estrita e código robusto |
| **Framework Web** | Fastify | Alta performance para webhooks |
| **Banco de Dados** | PostgreSQL | Armazenamento persistente e confiável |
| **ORM** | Drizzle ORM | Tipagem e migrações SQL modernas |
| **Documentação** | Fastify Swagger | OpenAPI/Swagger UI automático |
| **Logging** | Pino | Logs estruturados e performáticos |

## ⚡ Início Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/zaptrix.git
cd zaptrix

# 2. Instale as dependências
npm install

# 3. Suba o banco de dados (Docker)
npm run docker:up

# 4. Configure as variáveis de ambiente
# O arquivo .env já existe, apenas edite com suas credenciais
nano .env

# 5. Execute as migrações
npm run db:generate
npm run db:migrate

# 6. Inicie o servidor
npm run dev
```

🎉 **Pronto!** Servidor rodando em: http://localhost:3000

📚 **Documentação**: http://localhost:3000/documentation

👉 Veja o [**Guia Rápido Completo**](docs/QUICKSTART.md) para mais detalhes.

## 📋 Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/) (ou use Docker)
- Conta [Bitrix24](https://www.bitrix24.com.br/) com Aplicativo Local
- [Meta Cloud API](https://developers.facebook.com/) (WhatsApp Business API)

## 🗂️ Estrutura do Projeto

```
zaptrix/
├── src/
│   ├── config/              # Configurações e variáveis de ambiente
│   │   ├── env.ts          # Validação de env com Zod
│   │   └── logger.ts       # Configuração do Pino logger
│   ├── db/                  # Drizzle ORM e banco de dados
│   │   ├── schema.ts       # Schemas das tabelas
│   │   ├── index.ts        # Cliente Drizzle
│   │   └── migrate.ts      # Script de migração
│   ├── services/            # Lógica de negócio
│   │   ├── bitrix24/       # Serviços Bitrix24
│   │   └── meta/           # Serviços Meta Cloud API
│   ├── routes/              # Controladores Fastify
│   │   └── webhooks/       # Endpoints de webhook
│   ├── core/                # Lógica central
│   │   └── mapper.ts       # Mapeamento de conversas
│   ├── types/               # Definições TypeScript
│   ├── server.ts            # Configuração do Fastify
│   └── index.ts             # Ponto de entrada
├── docs/                    # Documentação completa
│   ├── QUICKSTART.md       # Guia rápido
│   ├── INSTALACAO.md       # Instalação detalhada
│   ├── ARQUITETURA.md      # Arquitetura do sistema
│   ├── API.md              # Documentação da API
│   └── DEPLOYMENT.md       # Guia de deploy
├── scripts/                 # Scripts utilitários
└── drizzle.config.ts       # Configuração do Drizzle
```

## 🔄 Como Funciona

### Fluxo de Mensagens Recebidas (WhatsApp → Bitrix24)

```
Cliente envia mensagem no WhatsApp
          ↓
Meta Cloud API → POST /webhooks/meta
          ↓
Zaptrix verifica mapeamento no banco
          ↓
    ┌─────┴─────┐
    │           │
  Existe?     NÃO → Cria Contato + Chat no Bitrix24
    │               Salva mapeamento
   SIM
    │
    └───────────┐
                ↓
    Envia mensagem para Canal Aberto do Bitrix24
```

### Fluxo de Mensagens Enviadas (Bitrix24 → WhatsApp)

```
Agente responde no Canal Aberto
          ↓
Bitrix24 → POST /webhooks/bitrix24/outbound
          ↓
Zaptrix busca mapeamento no banco
          ↓
Obtém WhatsApp ID do cliente
          ↓
Envia via Meta Cloud API
          ↓
Cliente recebe no WhatsApp
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot-reload
npm run build            # Compila TypeScript
npm start                # Inicia servidor em produção

# Banco de Dados
npm run db:generate      # Gera migrações
npm run db:migrate       # Executa migrações
npm run db:studio        # Abre Drizzle Studio (GUI)
npm run db:setup         # Configurar portal Bitrix24

# Docker
npm run docker:up        # Sobe PostgreSQL
npm run docker:down      # Para PostgreSQL
npm run docker:logs      # Visualiza logs

# Qualidade de Código
npm run lint             # Executa ESLint
npm run format           # Formata com Prettier
```

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [**Guia Rápido**](docs/QUICKSTART.md) | Comece em 10 minutos |
| [**Instalação**](docs/INSTALACAO.md) | Guia completo de instalação |
| [**Arquitetura**](docs/ARQUITETURA.md) | Entenda a arquitetura do sistema |
| [**API**](docs/API.md) | Documentação detalhada da API |
| [**Deploy**](docs/DEPLOYMENT.md) | Guia de deploy em produção |

## 🔐 Configuração

### Variáveis de Ambiente

Edite o arquivo `.env`:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zaptrix

# Meta Cloud API
META_VERIFY_TOKEN=seu_verify_token
META_ACCESS_TOKEN=seu_access_token
META_PHONE_NUMBER_ID=seu_phone_number_id
META_API_VERSION=v18.0

# Bitrix24
BITRIX_PORTAL_URL=https://seu-portal.bitrix24.com.br
BITRIX_CLIENT_ID=seu_client_id
BITRIX_CLIENT_SECRET=seu_client_secret

# Logging
LOG_LEVEL=info
```

## 🐳 Docker

### Desenvolvimento com Docker Compose

```bash
# Subir PostgreSQL
npm run docker:up

# Parar
npm run docker:down

# Logs
npm run docker:logs
```

### Deploy com Docker

```bash
# Build
docker build -t zaptrix:latest .

# Run
docker run -d \
  --name zaptrix \
  -p 3000:3000 \
  --env-file .env \
  zaptrix:latest
```

## 🧪 Testes

### Health Check
```bash
curl http://localhost:3000/health
```

### Teste Webhook Meta
```bash
curl "http://localhost:3000/webhooks/meta?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=12345"
```

## 📊 Monitoramento

### Logs
```bash
# Ver logs em desenvolvimento
npm run dev

# Ver logs com Docker
npm run docker:logs
```

### Health Endpoint
```
GET http://localhost:3000/health
```

Retorna:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

## 🚀 Deploy em Produção

Veja o [**Guia Completo de Deploy**](docs/DEPLOYMENT.md) para instruções detalhadas de deploy em:

- 🐳 Docker / Docker Compose
- ☁️ VPS (Ubuntu/Debian)
- 🌐 Railway / Heroku / DigitalOcean
- 🔧 AWS (EC2 + RDS)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 💡 Suporte

- 📖 [Documentação Completa](docs/)
- 🐛 [Reportar Bug](https://github.com/seu-usuario/zaptrix/issues)
- 💬 [Discussões](https://github.com/seu-usuario/zaptrix/discussions)

## 🙏 Agradecimentos

Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento moderno.

---

<div align="center">

**[Site](https://seu-site.com)** • **[Documentação](docs/)** • **[API](http://localhost:3000/documentation)**

</div>

