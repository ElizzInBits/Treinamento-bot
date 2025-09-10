@echo off
echo ========================================
echo    CONFIGURACAO SSL - TREINAMENTO BOT
echo ========================================
echo.

echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado! Instale o Node.js primeiro.
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

echo.
echo [2/4] Verificando OpenSSL...
openssl version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  OpenSSL nao encontrado!
    echo 💡 Opcoes:
    echo    1. Instalar OpenSSL: https://slproweb.com/products/Win32OpenSSL.html
    echo    2. Usar certificados existentes
    echo    3. Configurar proxy reverso
    echo.
    set /p choice="Continuar mesmo assim? (s/n): "
    if /i "%choice%" neq "s" exit /b 1
) else (
    echo ✅ OpenSSL encontrado
)

echo.
echo [3/4] Gerando certificados SSL...
node generate-ssl.js
if %errorlevel% neq 0 (
    echo ❌ Erro ao gerar certificados
    pause
    exit /b 1
)

echo.
echo [4/4] Configurando SSL no .env...
powershell -Command "(Get-Content .env) -replace 'SSL_ENABLED=false', 'SSL_ENABLED=true' | Set-Content .env"
echo ✅ SSL habilitado no .env

echo.
echo ========================================
echo           CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo 🚀 Para iniciar com SSL:
echo    npm run ssl:start
echo.
echo 🌐 Acesse:
echo    HTTP:  http://localhost:3000 (redireciona para HTTPS)
echo    HTTPS: https://localhost:3443
echo.
echo ⚠️  Aceite o aviso de seguranca do navegador
echo    (certificado auto-assinado para desenvolvimento)
echo.
pause