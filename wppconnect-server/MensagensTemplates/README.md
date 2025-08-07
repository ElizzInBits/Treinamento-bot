# Bot WhatsApp - Sistema de Treinamento

## 🚀 Como usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar banco de dados
Certifique-se de que o MySQL está rodando e as configurações no arquivo `.env` estão corretas:
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=admin!?
DB_NAME=listadecontatos
```

### 3. Iniciar o bot
```bash
npm start
```
ou
```bash
node start-bot.js
```

## 📱 Conectar WhatsApp

1. Execute o bot
2. Aguarde o QR Code aparecer no terminal
3. Abra o WhatsApp no seu celular
4. Vá em **Menu > Dispositivos conectados > Conectar dispositivo**
5. Escaneie o QR Code
6. Aguarde a confirmação de conexão

## 🔧 Solução de problemas

### QR Code não aparece
- Verifique se todas as dependências estão instaladas
- Certifique-se de que não há outro processo usando a mesma sessão
- Tente deletar a pasta `tokens/NERDWHATS_AMERICA` e reiniciar

### Erro de conexão com banco
- Verifique se o MySQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão manualmente

### Bot não responde
- Verifique se o número está cadastrado na tabela `contatos`
- Confirme se o bot está conectado (status: isLogged)
- Verifique os logs no console

## 📋 Comandos disponíveis

- **oi** - Mostra menu principal
- **📷 receber imagem** - Recebe uma imagem
- **🎥 receber vídeo** - Recebe um vídeo  
- **📄 receber pdf** - Recebe um PDF

## 🔄 Auto-restart

O bot possui sistema de auto-restart em caso de falhas. Se a conexão for perdida, ele tentará reconectar automaticamente.

## 📁 Estrutura de arquivos

```
MensagensTemplates/
├── BancoDeDados/          # Configurações do banco
├── conexao/               # Templates de conexão
├── config/                # Configurações do bot
├── media/                 # Arquivos de mídia
├── tokens/                # Tokens de sessão
├── index.js               # Arquivo principal
├── start-bot.js           # Script de inicialização
└── package.json           # Dependências
```