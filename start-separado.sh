#!/bin/bash

echo "🚀 INICIANDO SISTEMA TREINAMENTO-BOT (3 PROCESSOS)..."

# Navegar para o diretório
cd /root/Treinamento-bot

# Parar processos anteriores
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Criar logs
mkdir -p logs

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências principais..."
    npm install
fi

if [ ! -d "SistemaPrincipal/front-end/node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    cd SistemaPrincipal/front-end && npm install && cd ../..
fi

if [ ! -d "wppconnect-server/node_modules" ]; then
    echo "📦 Instalando dependências do wppconnect..."
    cd wppconnect-server && npm install && npm run build && cd ..
fi

# Iniciar os 3 processos
echo "🚀 Iniciando processos..."
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save
pm2 startup

echo ""
echo "✅ SISTEMA INICIADO COM 3 PROCESSOS!"
echo "📋 Status: pm2 status"
echo "🔗 Frontend: http://seu-ip:3000"
echo "📱 WhatsApp Bot: pm2 logs whatsapp-bot"
echo "🌐 WppConnect: http://seu-ip:21465"
echo "📋 Logs individuais:"
echo "  - Frontend: pm2 logs frontend"
echo "  - Bot: pm2 logs whatsapp-bot"
echo "  - WppConnect: pm2 logs wppconnect-server"