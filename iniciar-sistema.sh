#!/bin/bash

echo "🚀 INICIANDO SISTEMA TREINAMENTO-BOT OTIMIZADO..."

echo ""
echo "📁 Navegando para diretório do projeto..."
cd /root/Treinamento-bot

echo ""
echo "🔧 Criando pasta de logs..."
mkdir -p logs

echo ""
echo "📦 Instalando PM2 globalmente (se necessário)..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo ""
echo "⚙️ Configurando variáveis de ambiente..."
export NODE_OPTIONS="--max-old-space-size=2048"
export UV_THREADPOOL_SIZE=16

echo ""
echo "🛑 Parando processos anteriores..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo ""
echo "🚀 Iniciando sistema unificado..."
pm2 start ecosystem.config.js

echo ""
echo "💾 Salvando configuração PM2..."
pm2 save
pm2 startup

echo ""
echo "📊 Status do sistema:"
pm2 status

echo ""
echo "✅ SISTEMA INICIADO COM SUCESSO!"
echo "🔗 Acesse: http://localhost:3000"
echo "📱 WhatsApp: Aguarde QR Code nos logs"
echo "📋 Logs: pm2 logs treinamento-bot-unificado"
echo "🛑 Parar: pm2 stop treinamento-bot-unificado"