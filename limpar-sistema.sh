#!/bin/bash

echo "🧹 REMOVENDO ARQUIVOS NÃO UTILIZADOS..."

cd /root/Treinamento-bot

# Backup do arquivo atual
cp SistemaPrincipal/TemplatesMensagens/Template2.js SistemaPrincipal/TemplatesMensagens/Template2-backup.js

# Substituir pelo arquivo limpo
cp SistemaPrincipal/TemplatesMensagens/Template2-limpo.js SistemaPrincipal/TemplatesMensagens/Template2.js

# Remover arquivos desnecessários
rm -f iniciar-sistema.bat
rm -f otimizar-sistema.bat
rm -f package-backup.json

# Remover pastas não utilizadas se existirem
rm -rf tokens/NERDWHATS_AMERICA/AmountExtractionHeuristicRegexes
rm -rf tokens/NERDWHATS_AMERICA/AutofillStates
rm -rf tokens/NERDWHATS_AMERICA/CertificateRevocation
rm -rf tokens/NERDWHATS_AMERICA/component_crx_cache
rm -rf tokens/NERDWHATS_AMERICA/CookieReadinessList
rm -rf tokens/NERDWHATS_AMERICA/Crashpad
rm -rf tokens/NERDWHATS_AMERICA/extensions_crx_cache

# Limpar logs antigos
mkdir -p logs
rm -f logs/*.log

echo "✅ SISTEMA LIMPO!"
echo "📁 Arquivo principal otimizado: Template2.js"
echo "💾 Backup salvo em: Template2-backup.js"