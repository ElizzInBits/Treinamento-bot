#!/bin/bash

echo "🔧 Corrigindo problema do Chrome SingletonLock..."

# Parar PM2
pm2 stop all
pm2 delete all

# Matar todos os processos Chrome/Chromium
pkill -9 -f chrome
pkill -9 -f chromium

# Aguardar processos finalizarem
sleep 3

# Remover todos os diretórios de tokens problemáticos
rm -rf ~/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/tokens/WHATSAPP_BOT_DIRECT
rm -rf ~/Treinamento-bot/wppconnect-server/userDataDir/WHATSAPP_BOT_DIRECT

# Limpar cache do snap chromium
rm -rf ~/snap/chromium/common/chromium/SingletonLock*
rm -rf ~/snap/chromium/common/chromium/*/SingletonLock*

# Aguardar limpeza
sleep 5

echo "✅ Limpeza concluída. Reiniciando sistema..."

# Reiniciar
cd ~/Treinamento-bot
pm2 start ecosystem.config.js

echo "🚀 Sistema reiniciado!"