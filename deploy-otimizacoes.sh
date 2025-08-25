#!/bin/bash

echo "🚀 Iniciando deploy das otimizações..."

# 1. Parar o sistema
echo "⏹️  Parando sistema PM2..."
pm2 stop all

# 2. Fazer backup do Template2.js atual
echo "💾 Fazendo backup..."
cp SistemaPrincipal/TemplatesMensagens/Template2.js SistemaPrincipal/TemplatesMensagens/Template2.js.backup.$(date +%Y%m%d_%H%M%S)

# 3. Verificar se os novos arquivos existem
if [ ! -f "SistemaPrincipal/BancoDeDados/cache-contatos.js" ]; then
    echo "❌ Arquivo cache-contatos.js não encontrado!"
    exit 1
fi

# 4. Executar otimização de índices (se tiver permissão)
echo "🔧 Tentando otimizar índices do banco..."
cd SistemaPrincipal/BancoDeDados
node verificar-indices.js
cd ../..

# 5. Reiniciar sistema
echo "🔄 Reiniciando sistema..."
pm2 start ecosystem.config.js

# 6. Verificar status
echo "📊 Status do sistema:"
pm2 status

# 7. Mostrar logs em tempo real por 10 segundos
echo "📝 Logs em tempo real (10 segundos):"
timeout 10 pm2 logs --lines 20

echo "✅ Deploy concluído!"
echo ""
echo "🔍 Para monitorar:"
echo "  pm2 logs whatsapp-bot"
echo "  pm2 monit"
echo ""
echo "📈 Para ver estatísticas do cache:"
echo "  node -e \"const cache = require('./SistemaPrincipal/BancoDeDados/cache-contatos'); console.log(cache.getEstatisticas());\""