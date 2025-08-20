#!/bin/bash
echo "🚀 Atualizando servidor para usar IP correto..."

# Fazer commit das alterações
git add .
git commit -m "Configuração do servidor para usar IP 72.60.48.249"
git push origin main

echo "✅ Alterações enviadas para o GitHub!"
echo "📋 No servidor, execute: git pull origin main && pm2 restart all"