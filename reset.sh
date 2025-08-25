#!/bin/bash

echo "🗑️ RESETANDO SISTEMA COMPLETO..."

cd /root/Treinamento-bot

# Parar e deletar todos os processos PM2
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Limpar configurações PM2
rm -rf ~/.pm2

# Remover node_modules e locks
rm -rf node_modules package-lock.json
rm -rf SistemaPrincipal/front-end/node_modules
rm -rf SistemaPrincipal/front-end/package-lock.json
rm -rf wppconnect-server/node_modules
rm -rf wppconnect-server/package-lock.json

# Limpar sessões WhatsApp
rm -rf tokens/*

# Limpar logs
rm -rf logs/*

# Limpar cache
npm cache clean --force

echo "✅ RESET COMPLETO!"
echo "🔄 Para reinstalar: ./start.sh"