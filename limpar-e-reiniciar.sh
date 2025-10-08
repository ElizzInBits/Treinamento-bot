#!/bin/bash

echo "🧹 Script de Limpeza e Reinicialização do WhatsApp Bot"
echo "======================================================"

# Parar todos os processos PM2
echo "🛑 Parando processos PM2..."
pm2 stop all
pm2 delete all

# Aguardar processos pararem
sleep 3

# Matar processos Chrome órfãos
echo "💀 Finalizando processos Chrome..."
pkill -9 -f "chrome.*WHATSAPP_BOT_DIRECT" 2>/dev/null || true
pkill -9 -f chromium 2>/dev/null || true
pkill -9 -f wppconnect 2>/dev/null || true
pkill -9 -f puppeteer 2>/dev/null || true

# Aguardar processos terminarem
sleep 5

# Limpar arquivos de lock
echo "🗂️ Limpando arquivos de lock..."
TOKENS_DIR="./SistemaPrincipal/TemplatesMensagens/tokens/WHATSAPP_BOT_DIRECT"

if [ -d "$TOKENS_DIR" ]; then
    find "$TOKENS_DIR" -name "*lock*" -type f -delete 2>/dev/null || true
    find "$TOKENS_DIR" -name "*Lock*" -type f -delete 2>/dev/null || true
    find "$TOKENS_DIR" -name "SingletonLock" -delete 2>/dev/null || true
    echo "✅ Arquivos de lock removidos"
else
    echo "📁 Diretório de tokens não encontrado"
fi

# Limpar cache do sistema
echo "🧹 Limpando cache do sistema..."
rm -rf /tmp/.org.chromium.* 2>/dev/null || true
rm -rf /tmp/chrome_* 2>/dev/null || true
rm -rf ~/.cache/chromium/SingletonLock* 2>/dev/null || true

# Verificar se ainda há processos ativos
echo "🔍 Verificando processos restantes..."
PROCESSOS=$(ps aux | grep -i chrome | grep -v grep | grep -E "(WHATSAPP_BOT_DIRECT|wppconnect)" || true)

if [ -n "$PROCESSOS" ]; then
    echo "⚠️ Ainda há processos ativos:"
    echo "$PROCESSOS"
else
    echo "✅ Todos os processos foram finalizados"
fi

# Aguardar um pouco
sleep 2

# Reiniciar o sistema
echo "🚀 Reiniciando sistema..."
pm2 start ecosystem.config.js

echo ""
echo "✅ Limpeza e reinicialização concluída!"
echo "📱 Verifique os logs com: pm2 logs"
echo "🔍 Status dos processos: pm2 status"