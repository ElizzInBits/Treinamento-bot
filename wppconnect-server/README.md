# WppConnect Server

Servidor oficial do WppConnect configurado para o projeto Treinamento-bot.

## Configuração

- Host: http://72.60.48.249
- Porta: 21465
- Token: THISISMYSECURETOKEN

## APIs Disponíveis

- POST `/api/NERDWHATS_AMERICA/THISISMYSECURETOKEN/generate-token`
- GET `/api/NERDWHATS_AMERICA/THISISMYSECURETOKEN/status`
- POST `/api/NERDWHATS_AMERICA/THISISMYSECURETOKEN/send-message`

## Instalação no Servidor

1. Clone o repositório completo do wppconnect-server oficial
2. Execute `npm install`
3. Configure o arquivo `src/config.ts`
4. Execute `npm run build`
5. Inicie com PM2 usando `ecosystem.config.js`