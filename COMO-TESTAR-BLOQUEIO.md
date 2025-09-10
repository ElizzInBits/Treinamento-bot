# 🧪 Como Testar o Sistema de Bloqueio de Ligações

## 🚀 Passos para Testar

### 1. Verificar Configurações
```bash
node test-call-blocker.js
```
Este comando mostra todas as configurações atuais e simula cenários de teste.

### 2. Iniciar o Bot
```bash
node wppconnect-server.js
```

### 3. Conectar WhatsApp
- Escaneie o QR Code que aparece no console
- Aguarde a mensagem: "✅ WppConnect Server conectado!"
- Verifique se aparece: "🛡️ Sistema de bloqueio de ligações ativado!"

### 4. Fazer Teste de Ligação
- Use outro telefone para ligar para o número do bot
- A ligação deve ser rejeitada automaticamente
- Você deve receber uma mensagem de bloqueio

## 📋 Checklist de Verificação

### ✅ Antes do Teste
- [ ] Arquivo `call-blocker-config.js` existe
- [ ] Configuração `enabled: true`
- [ ] Bot conectado ao WhatsApp
- [ ] Console mostra sistema ativado

### ✅ Durante o Teste
- [ ] Ligação é rejeitada automaticamente
- [ ] Mensagem de bloqueio é recebida
- [ ] Logs aparecem no console
- [ ] Delay da mensagem funciona

### ✅ Após o Teste
- [ ] Segunda ligação também é bloqueada
- [ ] Se `oncePerDay: true`, segunda mensagem não é enviada
- [ ] Números da whitelist funcionam diferente

## 🔍 Logs Esperados

### Console do Bot:
```
📞 Ligação recebida de: 5511999999999
❌ Ligação rejeitada automaticamente: 5511999999999
✅ Mensagem de bloqueio enviada para: 5511999999999
```

### WhatsApp do Usuário:
```
🚫 LIGAÇÕES BLOQUEADAS

Olá! Este é um bot automatizado e não aceita ligações.

📱 Por favor, envie uma mensagem de texto para ser atendido.

Obrigado pela compreensão!
```

## 🛠️ Solução de Problemas

### ❌ Ligação não foi bloqueada
**Possíveis causas:**
- `enabled: false` na configuração
- Bot não conectado
- Erro no código

**Solução:**
1. Verifique `call-blocker-config.js`
2. Reinicie o bot
3. Verifique logs de erro

### ❌ Mensagem não foi enviada
**Possíveis causas:**
- `oncePerDay: true` e já enviou hoje
- Número na whitelist
- Erro de conexão

**Solução:**
1. Teste com número diferente
2. Verifique whitelist
3. Reinicie o bot

### ❌ Muitos logs no console
**Solução:**
```javascript
detailedLogging: false
```

## 🎯 Testes Específicos

### Teste 1: Bloqueio Básico
1. Configure `enabled: true`
2. Faça uma ligação
3. Verifique se foi rejeitada
4. Confirme recebimento da mensagem

### Teste 2: Whitelist
1. Adicione seu número à `allowedNumbers`
2. Faça uma ligação
3. Deve ser rejeitada, mas com mensagem diferente

### Teste 3: Controle Diário
1. Configure `oncePerDay: true`
2. Faça primeira ligação → recebe mensagem
3. Faça segunda ligação → não recebe mensagem

### Teste 4: Ligações de Grupo
1. Configure `blockGroupCalls: true`
2. Faça ligação de grupo
3. Deve ser bloqueada

### Teste 5: Delay da Mensagem
1. Configure `messageDelay: 5000`
2. Faça ligação
3. Mensagem deve chegar após 5 segundos

## 📱 Teste Completo Passo a Passo

### Preparação:
```bash
# 1. Testar configurações
node test-call-blocker.js

# 2. Iniciar bot
node wppconnect-server.js

# 3. Aguardar conexão
# Escanear QR Code
```

### Execução:
```
1. 📞 Fazer ligação → Deve ser rejeitada
2. 📨 Aguardar mensagem → Deve chegar em 2-5 segundos
3. 📞 Fazer segunda ligação → Deve ser rejeitada
4. 📨 Verificar segunda mensagem → Não deve chegar (se oncePerDay: true)
5. 📋 Verificar logs → Devem mostrar detalhes
```

### Validação:
- ✅ Ligação rejeitada automaticamente
- ✅ Mensagem recebida
- ✅ Logs corretos no console
- ✅ Configurações funcionando

## 🔧 Personalização Rápida

### Mensagem Simples:
```javascript
blockedMessage: "🤖 Bot não atende ligações. Envie mensagem! 📱"
```

### Mensagem Profissional:
```javascript
blockedMessage: `🏢 ATENDIMENTO AUTOMATIZADO

Para melhor atendimento, envie mensagem com:
• Nome completo
• Assunto
• Telefone para contato

Responderemos em breve! 📞`
```

### Mensagem Informal:
```javascript
blockedMessage: "😄 Oi! Sou um bot! Não atendo ligação, mas adoro conversar por mensagem! 💬"
```

## 📊 Monitoramento

### Verificar Status:
- Console deve mostrar sistema ativado
- Logs devem aparecer a cada ligação
- Mensagens devem ser enviadas

### Métricas:
- Quantas ligações foram bloqueadas
- Quantas mensagens foram enviadas
- Números que mais ligam

### Ajustes:
- Modificar mensagens conforme feedback
- Ajustar delay se necessário
- Adicionar/remover números da whitelist

---

## 🎉 Pronto!

Seu sistema de bloqueio de ligações está funcionando! 

**Próximos passos:**
1. Monitore os logs por alguns dias
2. Ajuste mensagens conforme necessário
3. Configure whitelist para números importantes
4. Personalize para sua necessidade específica

**Lembre-se:** O sistema funciona 24/7 automaticamente! 🤖✨