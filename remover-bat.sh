#!/bin/bash

echo "🗑️ REMOVENDO ARQUIVOS .BAT DO SISTEMA..."

cd /root/Treinamento-bot

# Remover todos os arquivos .bat
find . -name "*.bat" -type f -delete

echo "✅ ARQUIVOS .BAT REMOVIDOS!"
echo "📋 Arquivos removidos:"
echo "  - iniciar-sistema.bat"
echo "  - otimizar-sistema.bat" 
echo "  - start-pm2.bat"
echo "  - stop-pm2.bat"
echo "  - limpar-sessoes.bat"