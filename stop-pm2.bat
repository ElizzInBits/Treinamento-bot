@echo off
echo 🛑 Parando sistema PM2...

pm2 stop all
pm2 delete all

echo ✅ Sistema parado!
pause