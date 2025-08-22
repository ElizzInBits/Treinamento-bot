@echo off
echo Parando todos os processos Node.js...
taskkill /f /im node.exe 2>nul

echo Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo Removendo sessoes do WhatsApp...
if exist "sessions" (
    rmdir /s /q sessions
    echo Pasta sessions removida
) else (
    echo Pasta sessions nao encontrada
)

if exist ".wwebjs_auth" (
    rmdir /s /q .wwebjs_auth
    echo Pasta .wwebjs_auth removida
) else (
    echo Pasta .wwebjs_auth nao encontrada
)

if exist ".wwebjs_cache" (
    rmdir /s /q .wwebjs_cache
    echo Pasta .wwebjs_cache removida
) else (
    echo Pasta .wwebjs_cache nao encontrada
)

echo.
echo Sessoes limpas com sucesso!
echo Agora voce pode reiniciar o bot com uma sessao limpa.
pause