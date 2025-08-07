@echo off
echo 🚀 Iniciando sistema com PM2...

echo 📦 Instalando PM2 globalmente...
npm install -g pm2

echo 🔄 Parando processos existentes...
pm2 delete all

echo 🚀 Iniciando serviços...
pm2 start ecosystem.config.js

echo 📊 Status dos serviços:
pm2 status

echo ✅ Sistema iniciado com PM2!
echo 💡 Comandos úteis:
echo    pm2 status     - Ver status
echo    pm2 logs       - Ver logs
echo    pm2 restart all - Reiniciar tudo
echo    pm2 stop all   - Parar tudo

pause