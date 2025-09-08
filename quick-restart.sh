#!/bin/bash
echo "🔄 Reinício rápido dos serviços..."

# Parar e deletar todos os processos
pm2 stop all && pm2 delete all

# Aguardar um pouco
sleep 2

# Iniciar usando ecosystem
cd /root/Treinamento-bot
pm2 start ecosystem.config.js

# Verificar status
echo "📊 Status final:"
pm2 status

echo "✅ Reinício concluído!"