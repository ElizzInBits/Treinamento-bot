#!/bin/bash

echo "🔄 Reiniciando serviços do sistema..."

# Parar todos os processos PM2
echo "⏹️ Parando processos PM2..."
pm2 stop all
pm2 delete all

# Limpar logs antigos
echo "🧹 Limpando logs..."
pm2 flush

# Verificar portas em uso
echo "🔍 Verificando portas em uso..."
netstat -tulpn | grep -E ':(3000|3443|21465)' || echo "✅ Portas livres"

# Aguardar um pouco
sleep 3

# Reiniciar serviços usando ecosystem.config.js
echo "🚀 Iniciando todos os serviços..."
cd /root/Treinamento-bot
pm2 start ecosystem.config.js

sleep 3

# Verificar status
echo "📊 Status dos serviços:"
pm2 status

echo "✅ Reinicialização concluída!"
echo "🌐 Acesse: http://seu-ip:3000"