#!/bin/bash

echo "🚀 INICIANDO SISTEMA TREINAMENTO-BOT..."

# Navegar para o diretório
cd /root/Treinamento-bot

# Parar processos anteriores
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Criar logs
mkdir -p logs

# Iniciar sistema
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save
pm2 startup

echo "✅ SISTEMA INICIADO!"
echo "🔗 Frontend: http://seu-ip:3000"
echo "📱 WhatsApp: Aguarde QR nos logs"
echo "📋 Ver logs: pm2 logs"