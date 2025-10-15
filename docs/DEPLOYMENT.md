# Guia de Deploy - Zaptrix

## 🚀 Opções de Deploy

Este guia cobre diferentes estratégias de deploy para o Zaptrix em produção.

---

## 🐳 Deploy com Docker

### 1. Build da Imagem

```bash
# Build da imagem
docker build -t zaptrix:latest .

# Verificar imagem criada
docker images | grep zaptrix
```

### 2. Executar Container

```bash
docker run -d \
  --name zaptrix \
  -p 3000:3000 \
  --env-file .env \
  zaptrix:latest
```

### 3. Docker Compose (Recomendado)

Crie `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: zaptrix-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://zaptrix_user:${DB_PASSWORD}@postgres:5432/zaptrix
      META_VERIFY_TOKEN: ${META_VERIFY_TOKEN}
      META_ACCESS_TOKEN: ${META_ACCESS_TOKEN}
      META_PHONE_NUMBER_ID: ${META_PHONE_NUMBER_ID}
      BITRIX_PORTAL_URL: ${BITRIX_PORTAL_URL}
      BITRIX_CLIENT_ID: ${BITRIX_CLIENT_ID}
      BITRIX_CLIENT_SECRET: ${BITRIX_CLIENT_SECRET}
    depends_on:
      - postgres
    networks:
      - zaptrix-network

  postgres:
    image: postgres:15-alpine
    container_name: zaptrix-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: zaptrix_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: zaptrix
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - zaptrix-network

  nginx:
    image: nginx:alpine
    container_name: zaptrix-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - zaptrix-network

volumes:
  postgres_data:

networks:
  zaptrix-network:
    driver: bridge
```

**Executar**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## ☁️ Deploy em VPS (Ubuntu/Debian)

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y
```

### 2. Configurar PostgreSQL

```bash
# Criar usuário e banco
sudo -u postgres psql

CREATE DATABASE zaptrix;
CREATE USER zaptrix_user WITH PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE zaptrix TO zaptrix_user;
\q
```

### 3. Deploy da Aplicação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/zaptrix.git
cd zaptrix

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
nano .env  # Edite as variáveis

# Executar migrações
npm run db:generate
npm run db:migrate

# Build da aplicação
npm run build

# Iniciar com PM2
pm2 start dist/index.js --name zaptrix

# Configurar PM2 para iniciar no boot
pm2 startup
pm2 save
```

### 4. Configurar Nginx

Crie `/etc/nginx/sites-available/zaptrix`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Ativar site**:
```bash
sudo ln -s /etc/nginx/sites-available/zaptrix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática já está configurada
```

---

## 🌐 Deploy em Plataformas Cloud

### Railway

1. Crie conta em [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Adicione PostgreSQL como serviço
4. Configure variáveis de ambiente
5. Deploy automático!

**Configuração Railway**:
- Build Command: `npm run build`
- Start Command: `npm start`
- Port: `3000`

### Heroku

```bash
# Instalar Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Criar app
heroku create zaptrix-app

# Adicionar PostgreSQL
heroku addons:create heroku-postgresql:mini

# Configurar variáveis de ambiente
heroku config:set META_VERIFY_TOKEN=seu_token
heroku config:set META_ACCESS_TOKEN=seu_token
# ... outras variáveis

# Deploy
git push heroku main

# Executar migrações
heroku run npm run db:migrate
```

### DigitalOcean App Platform

1. Conecte repositório GitHub
2. Configure:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **Environment Variables**: Configure todas do .env
3. Adicione banco PostgreSQL gerenciado
4. Deploy!

### AWS (EC2 + RDS)

**Setup EC2**:
1. Crie instância EC2 (t3.small mínimo)
2. Configure Security Groups (portas 80, 443, 22)
3. Siga passos do "Deploy em VPS"

**Setup RDS**:
1. Crie instância PostgreSQL no RDS
2. Configure Security Group para aceitar EC2
3. Use endpoint RDS no `DATABASE_URL`

---

## 🔐 Segurança em Produção

### 1. Variáveis de Ambiente

**Nunca commite `.env`!**

Use secrets managers:
- AWS Secrets Manager
- HashiCorp Vault
- Doppler
- Railway/Heroku Config Vars

### 2. Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. Rate Limiting

Adicione ao Nginx:

```nginx
limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=10r/s;

location /webhooks {
    limit_req zone=webhook_limit burst=20;
    # ... resto da config
}
```

### 4. Monitoramento

**PM2 Monitoring**:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Logs**:
```bash
# Ver logs
pm2 logs zaptrix

# Monitoramento
pm2 monit
```

---

## 📊 Otimizações de Produção

### 1. Compressão

Nginx já comprime respostas automaticamente.

### 2. Cluster Mode

Para múltiplos cores:

```bash
pm2 start dist/index.js -i max --name zaptrix
```

### 3. Caching

Considere Redis para cache:

```bash
# Instalar Redis
sudo apt install redis-server

# Configurar
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

---

## 🔄 CI/CD

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/zaptrix
            git pull origin main
            npm install
            npm run build
            npm run db:migrate
            pm2 restart zaptrix
```

---

## 🧪 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrações executadas
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Nginx configurado como proxy reverso
- [ ] PM2 configurado para auto-restart
- [ ] Logs configurados com rotação
- [ ] Backups do banco configurados
- [ ] Monitoramento configurado
- [ ] Webhooks testados em produção
- [ ] Documentação atualizada

---

## 🆘 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs zaptrix --lines 100

# Verificar status
pm2 status
```

### Erro de conexão com banco

```bash
# Testar conexão
psql -U zaptrix_user -d zaptrix -h localhost

# Verificar PostgreSQL
sudo systemctl status postgresql
```

### Webhooks não chegam

1. Verifique se servidor está acessível publicamente
2. Teste com cURL externo
3. Verifique logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
4. Verifique configuração de firewall

---

## 📈 Escalabilidade

### Múltiplas Instâncias

Use load balancer (Nginx) com múltiplas instâncias PM2:

```bash
pm2 start dist/index.js -i 4 --name zaptrix
```

### Banco de Dados

- Use connection pooling (já configurado)
- Considere réplicas read-only
- Configure backups automáticos

### Cache

- Redis para mapeamentos frequentes
- CDN para assets estáticos (se houver)

---

## 🔚 Conclusão

Após seguir este guia, você terá:
- ✅ Aplicação rodando em produção
- ✅ HTTPS configurado
- ✅ Auto-restart em falhas
- ✅ Logs configurados
- ✅ Pronto para escalar

Para suporte, consulte a [documentação completa](../README.md).

