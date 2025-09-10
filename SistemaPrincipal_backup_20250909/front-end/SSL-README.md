# Configuração SSL - Treinamento Bot

## 🔐 Visão Geral

Este sistema suporta SSL/HTTPS para comunicação segura. A configuração inclui:

- **Certificados auto-assinados** para desenvolvimento
- **Let's Encrypt** para produção
- **Redirecionamento automático** HTTP → HTTPS
- **Socket.IO seguro** via HTTPS

## 🚀 Instalação Rápida

### Windows
```bash
# Execute o instalador automático
install-ssl.bat

# OU manualmente:
npm run ssl:generate
npm run ssl:start
```

### Linux/Mac
```bash
# Gerar certificados
node generate-ssl.js

# Habilitar SSL
export SSL_ENABLED=true

# Iniciar servidor
npm start
```

## ⚙️ Configuração Manual

### 1. Variáveis de Ambiente (.env)
```env
SSL_ENABLED=true          # Habilitar SSL
PORT=3000                 # Porta HTTP (redirecionamento)
HTTPS_PORT=3443          # Porta HTTPS principal
FRONTEND_URL=https://seu-dominio.com:3443
```

### 2. Certificados

#### Desenvolvimento (Auto-assinados)
```bash
npm run ssl:generate
```

#### Produção (Let's Encrypt)
```bash
# Instalar certbot
sudo apt install certbot

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem ssl/key.pem
```

## 🔧 Scripts Disponíveis

```bash
npm run ssl:generate     # Gerar certificados SSL
npm run ssl:start        # Iniciar com SSL habilitado
npm run ssl:dev          # Desenvolvimento com SSL
npm start                # Iniciar normal (HTTP)
```

## 🌐 Acesso

### Com SSL Habilitado
- **HTTPS**: https://localhost:3443 (principal)
- **HTTP**: http://localhost:3000 (redireciona para HTTPS)

### Sem SSL
- **HTTP**: http://localhost:3000

## 🔍 Verificação

### Testar Certificados
```bash
# Verificar certificado
openssl x509 -in ssl/cert.pem -text -noout

# Testar conexão HTTPS
curl -k https://localhost:3443/test
```

### Logs do Sistema
O servidor exibe informações sobre SSL no console:
```
🔒 SSL habilitado - servidor HTTPS ativo
✅ Servidor HTTPS rodando na porta 3443
🔄 Servidor HTTP (redirecionamento) rodando na porta 3000
```

## 🛠️ Solução de Problemas

### Erro: Certificados não encontrados
```bash
# Gerar novos certificados
npm run ssl:generate
```

### Erro: OpenSSL não encontrado (Windows)
1. Baixar OpenSSL: https://slproweb.com/products/Win32OpenSSL.html
2. Instalar e adicionar ao PATH
3. Reiniciar terminal

### Aviso de Segurança no Navegador
- **Desenvolvimento**: Clique em "Avançado" → "Continuar para localhost"
- **Produção**: Use certificados válidos (Let's Encrypt)

### Porta em Uso
```bash
# Verificar portas em uso
netstat -an | findstr :3443
netstat -an | findstr :3000

# Alterar portas no .env se necessário
HTTPS_PORT=8443
PORT=8000
```

## 📁 Estrutura de Arquivos

```
front-end/
├── ssl/                 # Certificados SSL
│   ├── cert.pem        # Certificado público
│   └── key.pem         # Chave privada
├── ssl-config.js       # Configuração SSL
├── generate-ssl.js     # Gerador de certificados
├── install-ssl.bat     # Instalador Windows
└── server-front.js     # Servidor com SSL
```

## 🔒 Segurança

### Desenvolvimento
- Certificados auto-assinados são seguros para desenvolvimento local
- Navegadores mostrarão aviso de segurança (normal)

### Produção
- Use certificados válidos (Let's Encrypt gratuito)
- Configure firewall para portas 80 e 443
- Mantenha certificados atualizados

## 📞 Suporte

Para problemas com SSL:
1. Verifique logs do servidor
2. Teste certificados com OpenSSL
3. Confirme configurações no .env
4. Verifique portas disponíveis