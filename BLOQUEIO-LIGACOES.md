# 🚫 Sistema de Bloqueio de Ligações

Este sistema bloqueia automaticamente todas as ligações recebidas pelo bot do WhatsApp e envia uma mensagem explicativa para o usuário.

## ✨ Funcionalidades

- ✅ **Bloqueio automático** de todas as ligações recebidas
- ✅ **Mensagem automática** informando sobre o bloqueio
- ✅ **Whitelist** para números autorizados
- ✅ **Controle de spam** (uma mensagem por dia por número)
- ✅ **Bloqueio de ligações em grupo** (configurável)
- ✅ **Logs detalhados** das ligações bloqueadas
- ✅ **Mensagens personalizáveis**

## 🔧 Configuração

### Arquivo de Configuração: `call-blocker-config.js`

```javascript
const CALL_BLOCKER_CONFIG = {
  // Ativar/desativar o bloqueio
  enabled: true,
  
  // Mensagem enviada quando uma ligação é bloqueada
  blockedMessage: "🚫 *LIGAÇÕES BLOQUEADAS*...",
  
  // Delay antes de enviar mensagem (ms)
  messageDelay: 2000,
  
  // Números permitidos (whitelist)
  allowedNumbers: [
    // '5511999999999'  // Adicione números aqui
  ],
  
  // Outras configurações...
};
```

### Principais Configurações

| Configuração | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `enabled` | Boolean | `true` | Ativa/desativa o bloqueio |
| `blockedMessage` | String | Mensagem padrão | Mensagem enviada após bloqueio |
| `messageDelay` | Number | `2000` | Delay em ms antes de enviar mensagem |
| `allowedNumbers` | Array | `[]` | Lista de números permitidos |
| `blockGroupCalls` | Boolean | `true` | Bloquear ligações de grupo |
| `oncePerDay` | Boolean | `true` | Enviar mensagem apenas 1x por dia |
| `detailedLogging` | Boolean | `true` | Logs detalhados |

## 🚀 Como Usar

### 1. Ativação Automática
O sistema é ativado automaticamente quando o bot inicia. Você verá esta mensagem no console:

```
🛡️ Sistema de bloqueio de ligações ativado com configurações avançadas!
```

### 2. Personalizar Mensagens
Edite o arquivo `call-blocker-config.js`:

```javascript
blockedMessage: `🚫 *LIGAÇÕES BLOQUEADAS*

Olá! Este é um bot automatizado.

📱 Por favor, envie uma mensagem de texto.

Obrigado!`
```

### 3. Adicionar Números à Whitelist
Para permitir ligações de números específicos:

```javascript
allowedNumbers: [
  '5511999999999',  // Número do administrador
  '5511888888888'   // Número do suporte
]
```

### 4. Configurar Mensagem para Whitelist
```javascript
whitelistMessage: `📞 Olá! Seu número está autorizado.

No entanto, prefiro mensagens de texto para melhor atendimento.

Por favor, envie uma mensagem! 😊`
```

## 📊 Logs e Monitoramento

### Logs Básicos
```
📞 Ligação recebida de: 5511999999999
❌ Ligação rejeitada automaticamente: 5511999999999
✅ Mensagem de bloqueio enviada para: 5511999999999
```

### Logs Detalhados (quando `detailedLogging: true`)
```
📞 Ligação recebida de: 5511999999999 (Individual)
📋 Detalhes da ligação: {
  id: "call_id_123",
  from: "5511999999999@c.us",
  isVideo: false,
  timestamp: "2024-01-15T10:30:00.000Z"
}
❌ Ligação rejeitada: 5511999999999 (Bloqueada)
✅ Mensagem de bloqueio enviada para: 5511999999999
```

## ⚙️ Configurações Avançadas

### Desabilitar Bloqueio Temporariamente
```javascript
enabled: false  // Desativa completamente o bloqueio
```

### Permitir Ligações de Grupo
```javascript
blockGroupCalls: false  // Não bloqueia ligações de grupo
```

### Enviar Mensagem Sempre
```javascript
oncePerDay: false  // Envia mensagem a cada ligação bloqueada
```

### Ajustar Delay da Mensagem
```javascript
messageDelay: 5000  // Aguarda 5 segundos antes de enviar mensagem
```

## 🔄 Reinicialização e Cache

### Cache Diário
O sistema mantém um cache dos números que já receberam mensagem no dia. Este cache é automaticamente limpo à meia-noite.

### Reinicialização Manual
Para limpar o cache manualmente, reinicie o bot ou modifique o arquivo de configuração.

## 🐛 Solução de Problemas

### Problema: Ligações não estão sendo bloqueadas
**Solução:**
1. Verifique se `enabled: true` no arquivo de configuração
2. Verifique os logs do console para erros
3. Certifique-se de que o bot está conectado

### Problema: Mensagens não estão sendo enviadas
**Solução:**
1. Verifique se o número não está na whitelist
2. Verifique se `oncePerDay: true` e já foi enviada mensagem hoje
3. Verifique o `messageDelay` (pode estar muito alto)

### Problema: Muitos logs no console
**Solução:**
```javascript
detailedLogging: false  // Reduz a quantidade de logs
```

## 📝 Exemplo de Configuração Completa

```javascript
const CALL_BLOCKER_CONFIG = {
  enabled: true,
  
  blockedMessage: `🤖 *BOT AUTOMATIZADO*
  
Olá! Sou um assistente virtual e não posso atender ligações.

📱 Para ser atendido, envie uma mensagem de texto.

🕐 Horário de funcionamento: 24h
⚡ Resposta automática ativa

Obrigado pela compreensão! 😊`,

  messageDelay: 3000,
  detailedLogging: true,
  
  allowedNumbers: [
    '5511999999999'  // Administrador
  ],
  
  whitelistMessage: `👋 Olá! Seu número está autorizado para ligações.

Porém, para um atendimento mais eficiente, prefiro mensagens de texto.

📱 Envie sua mensagem que responderei rapidamente!`,
  
  blockGroupCalls: true,
  oncePerDay: true
};
```

## 🔒 Segurança

- O sistema não armazena dados pessoais
- Apenas números de telefone são temporariamente cached
- Cache é limpo automaticamente a cada 24h
- Logs podem ser desabilitados para maior privacidade

## 📞 Suporte

Se você encontrar problemas ou tiver dúvidas:

1. Verifique os logs do console
2. Revise as configurações no arquivo `call-blocker-config.js`
3. Teste com um número da whitelist
4. Reinicie o bot se necessário

---

**Desenvolvido para o Bot de Treinamento** 🤖✨