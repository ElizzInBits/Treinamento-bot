#!/bin/bash

echo "🚀 OTIMIZANDO SISTEMA TREINAMENTO-BOT..."

echo ""
echo "📁 PASTA PRINCIPAL..."
cd /root/Treinamento-bot
rm -rf node_modules package-lock.json
cp package-otimizado.json package.json
npm install

echo ""
echo "📁 FRONTEND..."
cd /root/Treinamento-bot/SistemaPrincipal/front-end
rm -rf node_modules package-lock.json
npm install

echo ""
echo "📁 WPPCONNECT SERVER..."
cd /root/Treinamento-bot/wppconnect-server
rm -rf node_modules package-lock.json
npm install

echo ""
echo "🔧 Configurando permissões..."
cd /root/Treinamento-bot
chmod +x *.sh

echo ""
echo "✅ OTIMIZAÇÃO CONCLUÍDA!"
echo "🎯 Execute: ./iniciar-sistema.sh"