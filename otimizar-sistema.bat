@echo off
echo 🚀 OTIMIZANDO SISTEMA TREINAMENTO-BOT...

echo.
echo 📁 PASTA PRINCIPAL...
cd /d "c:\Treinamento-bot"
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
copy package-otimizado.json package.json
npm install

echo.
echo 📁 FRONTEND...
cd /d "c:\Treinamento-bot\SistemaPrincipal\front-end"
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install

echo.
echo 📁 WPPCONNECT SERVER...
cd /d "c:\Treinamento-bot\wppconnect-server"
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install

echo.
echo ✅ OTIMIZAÇÃO CONCLUÍDA!
echo 🎯 Execute: npm run pm2:start
pause