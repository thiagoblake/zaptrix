# Guia Rápido - Zaptrix

Comece a usar o Zaptrix em menos de 10 minutos! ⚡

## 🚀 Instalação Rápida

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/seu-usuario/zaptrix.git
cd zaptrix
```

### Passo 2: Instale as Dependências

```bash
npm install
```

### Passo 3: Configure o Banco de Dados

**Usando Docker (Recomendado)**:
```bash
npm run docker:up
```

**Ou instale PostgreSQL manualmente** e crie o banco:
```sql
CREATE DATABASE zaptrix;
CREATE USER zaptrix_user WITH PASSWORD 'zaptrix_password';
GRANT ALL PRIVILEGES ON DATABASE zaptrix TO zaptrix_user;
```

### Passo 4: Configure Variáveis de Ambiente

O arquivo `.env` já está criado. Edite com suas credenciais:

```bash
# Edite o arquivo .env
nano .env
```

Mínimo necessário para testar:
```env
DATABASE_URL=postgresql://zaptrix_user:zaptrix_password@localhost:5432/zaptrix
META_VERIFY_TOKEN=meu_token_teste
META_ACCESS_TOKEN=seu_token_meta
META_PHONE_NUMBER_ID=seu_phone_id
BITRIX_PORTAL_URL=https://seu-portal.bitrix24.com.br
BITRIX_CLIENT_ID=seu_client_id
BITRIX_CLIENT_SECRET=seu_client_secret
```

### Passo 5: Execute as Migrações

```bash
npm run db:generate
npm run db:migrate
```

### Passo 6: Inicie o Servidor

```bash
npm run dev
```

🎉 **Pronto!** Servidor rodando em: http://localhost:3000

## 🧪 Teste a Instalação

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

### 2. Documentação Interativa

Abra no navegador: http://localhost:3000/documentation

### 3. Teste o Webhook da Meta

```bash
curl "http://localhost:3000/webhooks/meta?hub.mode=subscribe&hub.verify_token=meu_token_teste&hub.challenge=12345"
```

Deve retornar: `12345`

## 📱 Configuração Básica

### Meta Cloud API

1. Acesse: https://developers.facebook.com/
2. Crie um App Business
3. Adicione produto "WhatsApp"
4. Obtenha credenciais:
   - Phone Number ID
   - Access Token
   - Crie um Verify Token

### Bitrix24

1. Acesse seu portal Bitrix24
2. Vá em **Aplicativos** → **Desenvolvedores** → **Adicionar Aplicativo**
3. Escolha **Servidor Web**
4. Anote Client ID e Client Secret
5. Configure permissões: `crm`, `im`, `imconnector`

### Configure o Portal

```bash
npm run db:setup
```

## 🔗 Conecte os Webhooks

### Webhook da Meta

**URL**: `https://seu-dominio.com/webhooks/meta`
**Verify Token**: O que você definiu no `.env`
**Eventos**: `messages`

💡 **Dica**: Use [ngrok](https://ngrok.com/) para testes locais:
```bash
ngrok http 3000
# Use a URL do ngrok como webhook
```

### Webhook do Bitrix24

No seu aplicativo local:
**URL**: `https://seu-dominio.com/webhooks/bitrix24/outbound`
**Evento**: `ONIMMESSAGEADD`

## ✅ Pronto para Usar!

Agora você pode:
- ✅ Receber mensagens do WhatsApp no Bitrix24
- ✅ Responder do Bitrix24 e enviar ao WhatsApp
- ✅ Criar contatos automaticamente
- ✅ Gerenciar conversas no Canal Aberto

## 📚 Próximos Passos

- Leia a [Documentação da API](./API.md)
- Entenda a [Arquitetura](./ARQUITETURA.md)
- Veja o [Guia de Instalação Completo](./INSTALACAO.md)
- Prepare o [Deploy para Produção](./DEPLOYMENT.md)

## 🆘 Problemas?

### Erro de conexão com banco

```bash
# Verifique se PostgreSQL está rodando
npm run docker:up

# Ou verifique manualmente
psql -U zaptrix_user -d zaptrix -h localhost
```

### Porta 3000 já em uso

Altere no `.env`:
```env
PORT=3001
```

### Logs não aparecem

Configure log level no `.env`:
```env
LOG_LEVEL=debug
```

## 💡 Dicas

- Use **Drizzle Studio** para visualizar o banco: `npm run db:studio`
- Use **Docker** para desenvolvimento: `npm run docker:up`
- Veja **logs em tempo real**: `npm run docker:logs`

---

**Dúvidas?** Consulte a [documentação completa](../README.md) ou abra uma issue!

