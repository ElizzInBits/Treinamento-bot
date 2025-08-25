@echo off
echo 🚀 INICIANDO SISTEMA TREINAMENTO-BOT OTIMIZADO...

echo.
echo 📁 Verificando pasta principal...
cd /d "c:\Treinamento-bot"

echo.
echo 🔧 Criando pasta de logs...
if not exist logs mkdir logs

echo.
echo 📦 Instalando PM2 globalmente (se necessário)...
npm list -g pm2 >nul 2>&1 || npm install -g pm2

echo.
echo ⚙️ Configurando variáveis de ambiente...
setx NODE_OPTIONS "--max-old-space-size=2048" >nul
setx UV_THREADPOOL_SIZE "16" >nul

echo.
echo 🛑 Parando processos anteriores...
pm2 stop all >nul 2>&1
pm2 delete all >nul 2>&1

echo.
echo 🚀 Iniciando sistema unificado...
pm2 start ecosystem.config.js

echo.
echo 📊 Status do sistema:
pm2 status

echo.
echo ✅ SISTEMA INICIADO COM SUCESSO!
echo 🔗 Acesse: http://localhost:3000
echo 📱 WhatsApp: Aguarde QR Code nos logs
echo 📋 Logs: pm2 logs treinamento-bot-unificado
echo 🛑 Parar: pm2 stop treinamento-bot-unificado

pause