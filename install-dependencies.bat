@echo off
echo 🚀 Instalando dependências do projeto...

echo.
echo 📦 Instalando dependências do wppconnect-server...
cd wppconnect-server
call npm install

echo.
echo 📦 Instalando dependências do MensagensTemplates...
cd MensagensTemplates
call npm install

echo.
echo 📦 Instalando dependências do SistemaPrincipal...
cd ..\..\SistemaPrincipal\front-end
call npm install

echo.
echo ✅ Todas as dependências foram instaladas!
echo.
echo 🔧 Para iniciar o bot, execute:
echo    cd wppconnect-server\MensagensTemplates
echo    npm start
echo.
pause