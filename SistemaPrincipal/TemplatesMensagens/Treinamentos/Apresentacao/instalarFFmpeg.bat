@echo off
echo ==========================================
echo    INSTALADOR AUTOMATICO DO FFMPEG
echo ==========================================
echo.

echo Baixando FFmpeg...
powershell -Command "& {Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile 'ffmpeg.zip'}"

echo Extraindo FFmpeg...
powershell -Command "& {Expand-Archive -Path 'ffmpeg.zip' -DestinationPath '.' -Force}"

echo Movendo arquivos...
for /d %%i in (ffmpeg-*) do (
    move "%%i\bin\ffmpeg.exe" .
    move "%%i\bin\ffprobe.exe" .
    rmdir /s /q "%%i"
)

echo Limpando arquivos temporarios...
del ffmpeg.zip

echo.
echo ==========================================
echo    FFMPEG INSTALADO COM SUCESSO!
echo ==========================================
echo.
echo Para testar, execute: node testeVideo.js
pause