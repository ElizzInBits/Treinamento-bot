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

# Reiniciar serviços na ordem correta
echo "🚀 Iniciando wppconnect-server..."
cd /root/Treinamento-bot/wppconnect-server
pm2 start npm --name "wppconnect-server" -- start

sleep 5

echo "🚀 Iniciando whatsapp-bot..."
cd /root/Treinamento-bot/SistemaPrincipal
pm2 start npm --name "whatsapp-bot" -- start

sleep 5

echo "🚀 Iniciando frontend..."
cd /root/Treinamento-bot/SistemaPrincipal/front-end
pm2 start npm --name "frontend" -- start

sleep 3

# Verificar status
echo "📊 Status dos serviços:"
pm2 status

echo "✅ Reinicialização concluída!"
echo "🌐 Acesse: http://seu-ip:3000"