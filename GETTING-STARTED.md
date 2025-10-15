# 🚀 Começando com Zaptrix

Bem-vindo ao Zaptrix! Este guia vai te ajudar a colocar o projeto rodando em **menos de 10 minutos**.

## ✅ Checklist Rápido

Antes de começar, certifique-se de ter:
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 14+ ou Docker instalado
- [ ] Credenciais da Meta Cloud API
- [ ] Credenciais do Bitrix24 (Aplicativo Local)

---

## 📦 1. Instalação

```bash
# Instalar dependências
npm install
```

Isso vai instalar:
- ✅ Fastify (framework web)
- ✅ Drizzle ORM (banco de dados)
- ✅ TypeScript e ferramentas
- ✅ Pino (logging)
- ✅ Swagger (documentação)

---

## 🗄️ 2. Configurar Banco de Dados

### Opção A: Docker (Recomendado)

```bash
# Subir PostgreSQL em container
npm run docker:up

# Verificar se está rodando
docker ps
```

### Opção B: PostgreSQL Local

Se preferir instalar PostgreSQL localmente:

```bash
# Criar banco de dados
psql -U postgres
CREATE DATABASE zaptrix;
CREATE USER zaptrix_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE zaptrix TO zaptrix_user;
\q
```

---

## ⚙️ 3. Configurar Variáveis de Ambiente

O arquivo `.env` já existe! Edite com suas credenciais:

```bash
# Windows
notepad .env

# Linux/Mac
nano .env
```

**Mínimo necessário**:
```env
DATABASE_URL=postgresql://zaptrix_user:zaptrix_password@localhost:5432/zaptrix
META_VERIFY_TOKEN=seu_token_aqui
META_ACCESS_TOKEN=seu_token_meta
META_PHONE_NUMBER_ID=seu_phone_id
BITRIX_PORTAL_URL=https://seu-portal.bitrix24.com.br
BITRIX_CLIENT_ID=seu_client_id
BITRIX_CLIENT_SECRET=seu_client_secret
```

💡 **Onde obter estas credenciais?** Veja [docs/INSTALACAO.md](docs/INSTALACAO.md)

---

## 🏗️ 4. Criar Tabelas no Banco

```bash
# Gerar arquivos de migração
npm run db:generate

# Executar migrações (criar tabelas)
npm run db:migrate
```

Isso cria as tabelas:
- ✅ `portal_config` - Credenciais do Bitrix24
- ✅ `conversation_mapping` - Mapeamento WhatsApp ↔ Bitrix24

---

## 🎯 5. Iniciar o Servidor

```bash
npm run dev
```

Você deve ver:
```
✅ Conexão com o banco de dados estabelecida
🚀 Servidor rodando em http://0.0.0.0:3000
📚 Documentação disponível em http://0.0.0.0:3000/documentation
```

---

## 🧪 6. Testar a Instalação

### Teste 1: Health Check

Abra no navegador ou use curl:
```bash
curl http://localhost:3000/health
```

**Resposta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

### Teste 2: Documentação

Abra no navegador:
```
http://localhost:3000/documentation
```

Você deve ver a interface do Swagger com todos os endpoints documentados.

### Teste 3: Webhook da Meta

```bash
curl "http://localhost:3000/webhooks/meta?hub.mode=subscribe&hub.verify_token=seu_token_aqui&hub.challenge=12345"
```

**Resposta esperada**: `12345`

---

## 🔗 7. Conectar Webhooks

Para que o sistema funcione completamente, você precisa configurar os webhooks.

### 7.1. Expor seu Servidor (para testes)

Como a Meta e o Bitrix24 precisam enviar webhooks para você, seu servidor precisa estar acessível na internet.

**Para testes locais, use ngrok**:

```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 3000
```

Você receberá uma URL como: `https://abc123.ngrok.io`

Use esta URL nos próximos passos.

### 7.2. Configurar Webhook na Meta

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Vá no seu App > WhatsApp > Configuration
3. Configure:
   - **Callback URL**: `https://abc123.ngrok.io/webhooks/meta`
   - **Verify Token**: O mesmo do seu `.env` (META_VERIFY_TOKEN)
4. Clique em "Verify and Save"
5. Inscreva-se no evento `messages`

### 7.3. Configurar Webhook no Bitrix24

1. Acesse seu portal Bitrix24
2. Vá em **Aplicativos** > **Desenvolvedores**
3. No seu aplicativo local, vá em **Webhooks**
4. Adicione webhook de saída:
   - **Evento**: `ONIMMESSAGEADD`
   - **URL**: `https://abc123.ngrok.io/webhooks/bitrix24/outbound`
5. Salvar

---

## 🎉 Pronto! Agora teste:

### Teste Completo

1. Envie uma mensagem no WhatsApp para o número configurado
2. Verifique os logs do servidor:
   ```
   [INFO] 📨 Webhook recebido da Meta
   [INFO] 👤 Novo contato detectado, criando no Bitrix24
   [INFO] ✅ Mensagem enviada ao Bitrix24
   ```
3. A mensagem deve aparecer no Canal Aberto do Bitrix24
4. Responda pelo Bitrix24
5. Verifique os logs:
   ```
   [INFO] 📨 Webhook recebido do Bitrix24
   [INFO] ✅ Mensagem enviada ao WhatsApp
   ```
6. O cliente deve receber a resposta no WhatsApp!

---

## 📚 Próximos Passos

### Aprender Mais
- 📖 [Documentação da API](docs/API.md)
- 🏗️ [Arquitetura do Sistema](docs/ARQUITETURA.md)
- 🔧 [Guia de Instalação Completo](docs/INSTALACAO.md)

### Preparar Produção
- 🚀 [Guia de Deploy](docs/DEPLOYMENT.md)
- 🐳 Usar Docker Compose em produção
- 🔐 Configurar HTTPS com Nginx

### Explorar Funcionalidades
- 🗄️ Usar Drizzle Studio: `npm run db:studio`
- 📝 Ver exemplos de payloads: [docs/WEBHOOK-EXAMPLES.md](docs/WEBHOOK-EXAMPLES.md)
- 🧪 Testar endpoints no Swagger

---

## 🆘 Problemas Comuns

### Erro: "Porta 3000 já em uso"

Altere a porta no `.env`:
```env
PORT=3001
```

### Erro: "Não foi possível conectar ao banco de dados"

Verifique se o PostgreSQL está rodando:
```bash
# Docker
npm run docker:up

# Local
sudo systemctl status postgresql
```

### Erro: "Token de verificação inválido"

Certifique-se de que `META_VERIFY_TOKEN` no `.env` é exatamente o mesmo configurado na Meta.

### Logs não aparecem

Configure o nível de log no `.env`:
```env
LOG_LEVEL=debug
```

---

## 🛠️ Comandos Úteis

```bash
# Ver estrutura do banco de dados
npm run db:studio

# Ver logs do Docker
npm run docker:logs

# Formatar código
npm run format

# Verificar erros
npm run lint

# Parar PostgreSQL
npm run docker:down
```

---

## 💡 Dicas

1. **Use logs**: Sempre verifique os logs do servidor quando algo não funcionar
2. **Teste localmente**: Use ngrok para testes antes de ir para produção
3. **Swagger é seu amigo**: Use a documentação interativa para testar endpoints
4. **Drizzle Studio**: Excelente para visualizar e editar dados do banco

---

## 🤝 Precisa de Ajuda?

- 📖 Leia a [documentação completa](README.md)
- 🐛 Verifique os logs com `LOG_LEVEL=debug`
- 💬 Consulte [docs/WEBHOOK-EXAMPLES.md](docs/WEBHOOK-EXAMPLES.md) para exemplos

---

<div align="center">

**Bom desenvolvimento! 🚀**

[← Voltar ao README](README.md)

</div>

