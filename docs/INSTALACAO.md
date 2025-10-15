# Guia de Instalação - Zaptrix

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **⭐ Redis 7+** - [Download](https://redis.io/download/) ou use Docker
- **npm ou yarn** - Vem com Node.js
- **Docker & Docker Compose** (opcional, recomendado) - [Download](https://www.docker.com/)

## 🔧 Passo 1: Configuração do Banco de Dados

### 1.1. Criar banco de dados PostgreSQL

```bash
# Conecte ao PostgreSQL
psql -U postgres

# Crie o banco de dados
CREATE DATABASE zaptrix;

# Crie um usuário (opcional, mas recomendado)
CREATE USER zaptrix_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE zaptrix TO zaptrix_user;

# Saia do PostgreSQL
\q
```

### 1.2. Opção Alternativa: Usar Docker Compose

**Recomendado para desenvolvimento:**

```bash
# Sobe PostgreSQL + Redis automaticamente
npm run docker:up

# Verificar se os serviços estão rodando
docker ps
```

### 1.3. Configurar variáveis de ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL=postgresql://zaptrix_user:sua_senha_segura@localhost:5432/zaptrix

# ⭐ Redis (NOVO)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # deixe vazio se não tiver senha
REDIS_DB=0
```

## 📦 Passo 2: Instalação das Dependências

```bash
# Instalar todas as dependências
npm install
```

## 🗄️ Passo 3: Configurar Drizzle ORM

### 3.1. Gerar migrações

```bash
npm run db:generate
```

### 3.2. Executar migrações

```bash
npm run db:migrate
```

### 3.3. (Opcional) Abrir Drizzle Studio

Para visualizar e gerenciar dados do banco:

```bash
npm run db:studio
```

Acesse: http://localhost:4983

## 🔐 Passo 4: Configurar Meta Cloud API (WhatsApp)

### 4.1. Obter credenciais

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie um App Business ou use existente
3. Adicione o produto "WhatsApp"
4. Configure um número de teste ou produção
5. Obtenha:
   - **Phone Number ID** (ID do número do WhatsApp)
   - **Access Token** (Token permanente de acesso)
   - Crie um **Verify Token** (qualquer string segura)

### 4.2. Configurar no .env

```env
META_VERIFY_TOKEN=seu_token_de_verificacao
META_ACCESS_TOKEN=seu_token_permanente_da_meta
META_PHONE_NUMBER_ID=seu_phone_number_id
META_API_VERSION=v18.0
```

### 4.3. Configurar Webhook na Meta

1. No painel do Meta for Developers, vá em WhatsApp > Configuration
2. Configure o Webhook:
   - **Callback URL**: `https://seu-dominio.com/webhooks/meta`
   - **Verify Token**: O mesmo que você definiu no `.env`
3. Inscreva-se no evento: `messages`

## 🏢 Passo 5: Configurar Bitrix24

### 5.1. Criar Aplicativo Local

1. Acesse seu portal Bitrix24
2. Vá em **Aplicativos** > **Desenvolvedores** > **Adicionar Aplicativo**
3. Escolha **Servidor Web**
4. Preencha:
   - **Nome**: Zaptrix
   - **URL do aplicativo**: `https://seu-dominio.com`
   - **URL do handler**: `https://seu-dominio.com/webhooks/bitrix24/outbound`
5. Anote o **Client ID** e **Client Secret**

### 5.2. Configurar permissões

Marque as seguintes permissões:
- `crm` - Para criar leads e contatos
- `im` - Para enviar mensagens
- `imconnector` - Para Canal Aberto
- `user` - Informações de usuários

### 5.3. Configurar no .env

```env
BITRIX_PORTAL_URL=https://seu-portal.bitrix24.com.br
BITRIX_CLIENT_ID=seu_client_id
BITRIX_CLIENT_SECRET=seu_client_secret
```

### 5.4. Executar script de setup

```bash
npm run db:migrate
tsx scripts/setup-portal.ts
```

Siga as instruções do script para configurar o portal.

### 5.5. Configurar Webhook de Saída

1. No aplicativo local criado, vá em **Webhooks**
2. Adicione um webhook de saída para o evento:
   - **ONIMMESSAGEADD** - Quando uma mensagem é adicionada no chat
3. URL do webhook: `https://seu-dominio.com/webhooks/bitrix24/outbound`

## 🚀 Passo 6: Executar o Projeto

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start
```

## ✅ Passo 7: Testar a Instalação

### 7.1. Verificar Health Check

```bash
curl http://localhost:3000/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

### 7.2. Acessar Documentação

- **Swagger UI**: http://localhost:3000/documentation
- **Métricas**: http://localhost:3000/metrics
- **Stats do Cache**: http://localhost:3000/cache/stats
- **Stats das Filas**: http://localhost:3000/queues/stats

### 7.3. Teste Completo

1. Envie uma mensagem de teste no WhatsApp
2. Verifique os logs do servidor
3. Verifique as filas: http://localhost:3000/queues/stats
4. Responda no Bitrix24 e verifique se a mensagem chega no WhatsApp

## 📊 Passo 8: Configurar Monitoramento (Opcional)

### 8.1. Subir Prometheus + Grafana

```bash
# Subir stack de monitoramento
docker-compose -f docker-compose.monitoring.yml up -d

# Verificar se estão rodando
docker ps | grep -E "prometheus|grafana"
```

### 8.2. Acessar Grafana

1. Abra: http://localhost:3001
2. Login: `admin` / `admin`
3. Navegue para **Dashboards** > **Zaptrix Dashboard**
4. Visualize métricas em tempo real:
   - Taxa de mensagens
   - Latência
   - Tamanho das filas
   - Taxa de sucesso/erro

## 🔍 Solução de Problemas

### Erro de conexão com banco de dados

```bash
# Verifique se o PostgreSQL está rodando
sudo systemctl status postgresql

# Teste a conexão
psql -U zaptrix_user -d zaptrix -h localhost

# Se estiver usando Docker
docker ps | grep postgres
docker logs zaptrix-postgres
```

### ⭐ Erro de conexão com Redis

```bash
# Verifique se o Redis está rodando
redis-cli ping
# Deve retornar: PONG

# Se estiver usando Docker
docker ps | grep redis
docker logs zaptrix-redis

# Teste a conexão
redis-cli -h localhost -p 6379
> PING
# Deve retornar: PONG
```

### Erro na verificação do webhook da Meta

- Certifique-se de que o `META_VERIFY_TOKEN` no `.env` corresponde ao configurado na Meta
- Verifique se o servidor está acessível publicamente (use ngrok para testes)

### Erro de autenticação no Bitrix24

- Execute o fluxo OAuth completo para obter os tokens iniciais
- Verifique se o `BITRIX_CLIENT_ID` e `BITRIX_CLIENT_SECRET` estão corretos
- Os tokens serão renovados automaticamente pelo sistema

### ⭐ Filas não estão processando

```bash
# Verifique os logs
npm run dev

# Verifique o status das filas
curl http://localhost:3000/queues/stats

# Verifique se o Redis está acessível
curl http://localhost:3000/health
```

### ⭐ Métricas não aparecem no Grafana

```bash
# Verifique se o Prometheus está coletando métricas
curl http://localhost:9090/targets

# Verifique se a API está expondo métricas
curl http://localhost:3000/metrics

# Reinicie os serviços
docker-compose -f docker-compose.monitoring.yml restart
```

## 📚 Próximos Passos

### Para Desenvolvimento
- ✅ Explore a documentação Swagger
- ✅ Teste envio de mensagens rich media (imagens, vídeos)
- ✅ Configure múltiplos portais (multi-tenant)
- ✅ Monitore métricas no Grafana

### Para Produção
- Configure um proxy reverso (Nginx) para produção
- Configure SSL/TLS (Let's Encrypt)
- Configure um gerenciador de processos (PM2 ou Docker Swarm)
- ⭐ Configure Redis com persistência (AOF ou RDB)
- ⭐ Configure PostgreSQL com replicação
- Configure backup automático
- Configure alertas no Grafana
- Implemente logging centralizado (ELK stack)

## 🔐 Checklist de Segurança

Antes de ir para produção:

- [ ] Altere todas as senhas padrão
- [ ] Configure SSL/TLS (HTTPS)
- [ ] Configure CORS adequadamente
- [ ] Configure rate limiting por cliente
- [ ] Ative logs de auditoria
- [ ] Configure backup automático
- [ ] Teste o sistema de retry
- [ ] Configure alertas de erro
- [ ] Documente credenciais em cofre seguro
- [ ] Configure firewall (apenas portas necessárias)

## 🆘 Suporte

Para problemas e dúvidas:
- 📖 [Documentação Completa](../README.md)
- 🏗️ [Arquitetura do Sistema](./ARQUITETURA.md)
- 📡 [Documentação da API](./API.md)
- 🚀 [Guia de Deploy](./DEPLOYMENT.md)

