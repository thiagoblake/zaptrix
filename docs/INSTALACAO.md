# Guia de Instalação - Zaptrix

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **npm ou yarn** - Vem com Node.js

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

### 1.2. Configurar variáveis de ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://zaptrix_user:sua_senha_segura@localhost:5432/zaptrix
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

1. Acesse a documentação: http://localhost:3000/documentation
2. Teste o health check: http://localhost:3000/health
3. Envie uma mensagem de teste no WhatsApp
4. Verifique os logs do servidor

## 🔍 Solução de Problemas

### Erro de conexão com banco de dados

```bash
# Verifique se o PostgreSQL está rodando
sudo systemctl status postgresql

# Teste a conexão
psql -U zaptrix_user -d zaptrix -h localhost
```

### Erro na verificação do webhook da Meta

- Certifique-se de que o `META_VERIFY_TOKEN` no `.env` corresponde ao configurado na Meta
- Verifique se o servidor está acessível publicamente (use ngrok para testes)

### Erro de autenticação no Bitrix24

- Execute o fluxo OAuth completo para obter os tokens iniciais
- Verifique se o `BITRIX_CLIENT_ID` e `BITRIX_CLIENT_SECRET` estão corretos
- Os tokens serão renovados automaticamente pelo sistema

## 📚 Próximos Passos

- Configure um proxy reverso (Nginx) para produção
- Configure SSL/TLS (Let's Encrypt)
- Configure um gerenciador de processos (PM2)
- Configure monitoramento e alertas

## 🆘 Suporte

Para problemas e dúvidas, consulte a [documentação completa](../README.md).

