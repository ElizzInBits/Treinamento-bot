#!/bin/bash

# Script de Deploy para Servidor Web

echo "🚀 Iniciando deploy do sistema..."

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install --production
cd SistemaPrincipal/front-end && npm install --production
cd ../TemplatesMensagens && npm install --production
cd ../../..

# 2. Configurar PM2 para produção
echo "⚙️ Configurando PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production

# 3. Configurar nginx (se necessário)
echo "🌐 Configurando proxy reverso..."
sudo cp nginx.conf /etc/nginx/sites-available/treinamento-bot
sudo ln -sf /etc/nginx/sites-available/treinamento-bot /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. Configurar SSL (Let's Encrypt)
echo "🔒 Configurando SSL..."
sudo certbot --nginx -d seudominio.com

echo "✅ Deploy concluído!"
echo "🌐 Sistema disponível em: https://seudominio.com"