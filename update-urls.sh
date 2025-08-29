#!/bin/bash

# Script para atualizar URLs no código
# Execute este script no seu servidor após configurar o Nginx

echo "🔄 Atualizando URLs no código..."

# Diretório do projeto
PROJECT_DIR="/root/Treinamento-bot/SistemaPrincipal/front-end/public"

# Função para atualizar URLs em arquivos JavaScript
update_js_files() {
    find "$PROJECT_DIR" -name "*.js" -type f -exec sed -i 's|https://salubrita-bot\.ddns\.net:3443|https://salubrita-bot.ddns.net|g' {} \;
    echo "✅ URLs atualizadas em arquivos JavaScript"
}

# Verificar se o diretório existe
if [ -d "$PROJECT_DIR" ]; then
    update_js_files
    echo "🎯 Todas as URLs foram atualizadas!"
    echo "🌐 Agora o site funcionará em: https://salubrita-bot.ddns.net"
else
    echo "❌ Diretório do projeto não encontrado: $PROJECT_DIR"
    echo "💡 Ajuste o caminho PROJECT_DIR no script"
fi