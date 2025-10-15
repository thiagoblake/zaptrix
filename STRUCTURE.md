# Estrutura de Arquivos - Zaptrix

Visão completa da organização do projeto.

```
zaptrix/
│
├── 📁 src/                              # Código-fonte TypeScript
│   ├── 📁 config/                       # Configurações
│   │   ├── env.ts                      # Validação de variáveis de ambiente (Zod)
│   │   └── logger.ts                   # Configuração do Pino logger
│   │
│   ├── 📁 db/                           # Banco de dados
│   │   ├── schema.ts                   # Schemas Drizzle (portalConfig, conversationMapping)
│   │   ├── index.ts                    # Cliente Drizzle e conexão PostgreSQL
│   │   └── migrate.ts                  # Script de migração
│   │
│   ├── 📁 services/                     # Serviços de negócio
│   │   ├── 📁 bitrix24/
│   │   │   └── bitrix24.service.ts    # Serviço Bitrix24 (OAuth, CRM, Chat)
│   │   └── 📁 meta/
│   │       └── meta.service.ts        # Serviço Meta Cloud API (WhatsApp)
│   │
│   ├── 📁 routes/                       # Rotas Fastify
│   │   └── 📁 webhooks/
│   │       ├── meta.routes.ts         # Webhooks da Meta (GET/POST)
│   │       └── bitrix24.routes.ts     # Webhooks do Bitrix24 (POST)
│   │
│   ├── 📁 core/                         # Lógica central
│   │   └── mapper.ts                   # Mapeamento de conversas (Meta ↔ Bitrix24)
│   │
│   ├── 📁 types/                        # Tipos TypeScript
│   │   ├── meta.types.ts              # Tipos da Meta Cloud API
│   │   └── bitrix24.types.ts          # Tipos da API Bitrix24
│   │
│   ├── server.ts                        # Configuração do servidor Fastify + Swagger
│   └── index.ts                         # Ponto de entrada da aplicação
│
├── 📁 docs/                             # Documentação completa
│   ├── QUICKSTART.md                   # Guia rápido (10 minutos)
│   ├── INSTALACAO.md                   # Instalação detalhada passo a passo
│   ├── ARQUITETURA.md                  # Arquitetura e design do sistema
│   ├── API.md                          # Documentação completa da API
│   ├── DEPLOYMENT.md                   # Guia de deploy (VPS, Docker, Cloud)
│   └── WEBHOOK-EXAMPLES.md             # Exemplos de payloads de webhooks
│
├── 📁 scripts/                          # Scripts utilitários
│   └── setup-portal.ts                 # Script de configuração do portal Bitrix24
│
├── 📁 drizzle/                          # Migrações geradas (criado automaticamente)
│
├── 🐳 docker-compose.yml                # Configuração Docker Compose (PostgreSQL)
├── 🐳 Dockerfile                        # Dockerfile para build da aplicação
├── 🐳 .dockerignore                     # Arquivos ignorados no build Docker
│
├── 🔧 drizzle.config.ts                 # Configuração do Drizzle ORM
├── 🔧 tsconfig.json                     # Configuração do TypeScript
├── 🔧 package.json                      # Dependências e scripts NPM
│
├── 🔧 .eslintrc.json                    # Configuração do ESLint
├── 🔧 .prettierrc                       # Configuração do Prettier
├── 🔧 nginx.conf                        # Configuração Nginx (produção)
│
├── 📄 .env                              # Variáveis de ambiente (NÃO COMMITAR)
├── 📄 .env.example                      # Template de variáveis de ambiente
├── 📄 .gitignore                        # Arquivos ignorados pelo Git
│
├── 📖 README.md                         # Documentação principal
├── 📖 STRUCTURE.md                      # Este arquivo
├── 📖 LICENSE                           # Licença ISC
└── 📦 node_modules/                     # Dependências instaladas

```

## 📊 Estatísticas do Projeto

### Arquivos por Categoria

| Categoria | Quantidade | Descrição |
|-----------|------------|-----------|
| 📝 TypeScript | 13 | Código-fonte principal |
| 📚 Documentação | 7 | Guias e documentação |
| 🔧 Configuração | 8 | Arquivos de configuração |
| 🐳 Docker | 3 | Containerização |
| 📦 NPM | 1 | Gerenciamento de dependências |

### Linhas de Código (Aproximado)

| Tipo | LOC |
|------|-----|
| TypeScript | ~2000 |
| Markdown | ~1500 |
| JSON/Config | ~200 |
| **Total** | **~3700** |

## 🗂️ Organização por Funcionalidade

### 1️⃣ Configuração e Setup
```
.env, .env.example
src/config/env.ts
src/config/logger.ts
drizzle.config.ts
tsconfig.json
```

### 2️⃣ Banco de Dados
```
src/db/schema.ts          # Definição das tabelas
src/db/index.ts           # Cliente Drizzle
src/db/migrate.ts         # Migrações
scripts/setup-portal.ts   # Setup inicial
```

### 3️⃣ Integrações Externas
```
src/services/meta/meta.service.ts           # Meta Cloud API
src/services/bitrix24/bitrix24.service.ts   # Bitrix24 API
```

### 4️⃣ Webhooks
```
src/routes/webhooks/meta.routes.ts       # Recebe da Meta
src/routes/webhooks/bitrix24.routes.ts   # Recebe do Bitrix24
```

### 5️⃣ Lógica de Negócio
```
src/core/mapper.ts      # Mapeamento de conversas
src/server.ts           # Servidor Fastify
src/index.ts            # Entry point
```

### 6️⃣ Tipos
```
src/types/meta.types.ts      # Tipos Meta
src/types/bitrix24.types.ts  # Tipos Bitrix24
```

### 7️⃣ Documentação
```
README.md                          # Principal
docs/QUICKSTART.md                # Início rápido
docs/INSTALACAO.md                # Instalação
docs/ARQUITETURA.md               # Arquitetura
docs/API.md                       # API
docs/DEPLOYMENT.md                # Deploy
docs/WEBHOOK-EXAMPLES.md          # Exemplos
```

### 8️⃣ Infraestrutura
```
docker-compose.yml    # PostgreSQL local
Dockerfile           # Build da aplicação
nginx.conf          # Proxy reverso
```

## 🎯 Principais Pontos de Entrada

### Desenvolvimento
```bash
npm run dev              # Inicia: src/index.ts → server.ts → routes
```

### Migrações
```bash
npm run db:migrate       # Executa: src/db/migrate.ts
```

### Build
```bash
npm run build            # Compila: src/ → dist/
```

### Setup
```bash
npm run db:setup         # Executa: scripts/setup-portal.ts
```

## 📈 Fluxo de Dados através dos Arquivos

### Mensagem Recebida (Meta → Bitrix24)
```
1. Meta Cloud API
   ↓
2. src/routes/webhooks/meta.routes.ts (POST /webhooks/meta)
   ↓
3. src/core/mapper.ts (busca/cria mapeamento)
   ↓
4. src/services/bitrix24/bitrix24.service.ts (cria contato/chat, envia msg)
   ↓
5. src/db/index.ts (salva no PostgreSQL)
```

### Mensagem Enviada (Bitrix24 → Meta)
```
1. Bitrix24
   ↓
2. src/routes/webhooks/bitrix24.routes.ts (POST /webhooks/bitrix24/outbound)
   ↓
3. src/core/mapper.ts (busca mapeamento)
   ↓
4. src/services/meta/meta.service.ts (envia msg via WhatsApp)
   ↓
5. Meta Cloud API → Cliente
```

## 🔍 Dependências entre Módulos

```
index.ts
  └─ server.ts
      ├─ config/env.ts
      ├─ config/logger.ts
      ├─ db/index.ts
      │   └─ db/schema.ts
      └─ routes/
          ├─ webhooks/meta.routes.ts
          │   ├─ services/meta/meta.service.ts
          │   ├─ services/bitrix24/bitrix24.service.ts
          │   ├─ core/mapper.ts
          │   └─ types/meta.types.ts
          └─ webhooks/bitrix24.routes.ts
              ├─ services/meta/meta.service.ts
              ├─ core/mapper.ts
              └─ types/bitrix24.types.ts
```

## 🚀 Como Navegar no Projeto

### Para Entender a Arquitetura
1. Leia `README.md` primeiro
2. Depois `docs/ARQUITETURA.md`
3. Veja `docs/API.md` para endpoints

### Para Começar a Desenvolver
1. Leia `docs/QUICKSTART.md`
2. Configure com `docs/INSTALACAO.md`
3. Estude `src/server.ts` e `src/routes/`

### Para Deploy
1. Siga `docs/DEPLOYMENT.md`
2. Use `Dockerfile` ou `docker-compose.yml`
3. Configure `nginx.conf`

### Para Debug
1. Veja logs via `src/config/logger.ts`
2. Use `npm run db:studio` para ver dados
3. Teste com `docs/WEBHOOK-EXAMPLES.md`

## 📝 Convenções

### Nomenclatura de Arquivos
- **Serviços**: `*.service.ts`
- **Rotas**: `*.routes.ts`
- **Tipos**: `*.types.ts`
- **Config**: `*.config.ts`

### Nomenclatura de Funções
- **Async**: Todas funções assíncronas usam `async/await`
- **Privadas**: Prefixo `_` ou método `private`
- **Públicas**: CamelCase descritivo

### Estrutura de Imports
```typescript
// 1. Node modules
import { FastifyPluginAsync } from 'fastify';

// 2. Serviços locais
import { metaService } from '../../services/meta/meta.service';

// 3. Tipos
import type { MetaWebhookMessage } from '../../types/meta.types';
```

---

**Última atualização**: 2024-01-15

