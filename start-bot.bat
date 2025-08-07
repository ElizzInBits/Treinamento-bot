@echo off
title Bot WhatsApp - Treinamento
color 0A

echo.
echo  ██████╗  ██████╗ ████████╗    ██╗    ██╗██╗  ██╗ █████╗ ████████╗███████╗ █████╗ ██████╗ ██████╗ 
echo  ██╔══██╗██╔═══██╗╚══██╔══╝    ██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗
echo  ██████╔╝██║   ██║   ██║       ██║ █╗ ██║███████║███████║   ██║   ███████╗███████║██████╔╝██████╔╝
echo  ██╔══██╗██║   ██║   ██║       ██║███╗██║██╔══██║██╔══██║   ██║   ╚════██║██╔══██║██╔═══╝ ██╔═══╝ 
echo  ██████╔╝╚██████╔╝   ██║       ╚███╔███╔╝██║  ██║██║  ██║   ██║   ███████║██║  ██║██║     ██║     
echo  ╚═════╝  ╚═════╝    ╚═╝        ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝     
echo.
echo                                    🤖 Sistema de Treinamento
echo.

echo 🔍 Verificando dependências...
cd wppconnect-server\MensagensTemplates

if not exist node_modules (
    echo ⚠️  Dependências não encontradas. Instalando...
    call npm install
    echo.
)

echo 🚀 Iniciando bot WhatsApp...
echo.
echo 📱 Aguarde o QR Code aparecer e escaneie com seu WhatsApp
echo 💡 Para parar o bot, pressione Ctrl+C
echo.

node start-bot.js

pause