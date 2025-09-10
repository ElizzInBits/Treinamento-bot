// EXEMPLO DE CONFIGURAÇÃO DO BLOQUEADOR DE LIGAÇÕES
// Copie este arquivo para call-blocker-config.js e personalize conforme necessário

const CALL_BLOCKER_CONFIG = {
  // ========================================
  // CONFIGURAÇÕES BÁSICAS
  // ========================================
  
  // Ativar/desativar o bloqueio de ligações
  enabled: true,
  
  // Delay em milissegundos antes de enviar a mensagem
  // Recomendado: 2000-5000ms para evitar conflitos
  messageDelay: 2000,
  
  // Log detalhado das ligações bloqueadas
  detailedLogging: true,
  
  // ========================================
  // CONTROLE DE MENSAGENS
  // ========================================
  
  // Enviar mensagem de bloqueio apenas uma vez por dia por número
  oncePerDay: true,
  
  // Mensagem enviada quando uma ligação é bloqueada
  blockedMessage: `🚫 *LIGAÇÕES BLOQUEADAS*

Olá! Este é um bot automatizado e não aceita ligações.

📱 Por favor, envie uma mensagem de texto para ser atendido.

🕐 Horário de funcionamento: 24 horas
⚡ Resposta automática ativa

Obrigado pela compreensão! 😊`,

  // ========================================
  // WHITELIST (NÚMEROS PERMITIDOS)
  // ========================================
  
  // Lista de números que podem ligar (sem bloqueio)
  // Formato: apenas números, sem símbolos
  // Exemplo: '5511999999999' para (11) 99999-9999
  allowedNumbers: [
    // '5511999999999',  // Administrador
    // '5511888888888',  // Suporte técnico
    // '5511777777777'   // Gerente
  ],
  
  // Mensagem personalizada para números da whitelist
  // Se vazio, usará a mensagem padrão de bloqueio
  whitelistMessage: `📞 Olá! Embora este seja um bot automatizado, seu número está autorizado.

No entanto, prefiro comunicação por mensagens de texto para melhor atendimento.

📱 Por favor, envie uma mensagem e serei mais eficiente! 😊

✨ Seu atendimento tem prioridade!`,
  
  // ========================================
  // CONFIGURAÇÕES DE GRUPO
  // ========================================
  
  // Bloquear ligações em grupo também
  blockGroupCalls: true,
  
  // ========================================
  // ARMAZENAMENTO INTERNO (NÃO MODIFICAR)
  // ========================================
  
  // Armazenar números que já receberam mensagem hoje
  dailyMessagesSent: new Set()
};

// ========================================
// EXEMPLOS DE CONFIGURAÇÕES PERSONALIZADAS
// ========================================

// EXEMPLO 1: Bot de Atendimento Comercial
/*
const CALL_BLOCKER_CONFIG = {
  enabled: true,
  messageDelay: 3000,
  detailedLogging: true,
  oncePerDay: true,
  
  blockedMessage: `🏢 *ATENDIMENTO COMERCIAL*

Olá! Somos uma empresa e utilizamos este bot para atendimento.

📱 Para ser atendido rapidamente, envie uma mensagem com:
• Seu nome
• Assunto do contato
• Telefone para retorno

🕐 Horário comercial: 8h às 18h
📞 Emergências: (11) 9999-9999

Obrigado! 😊`,

  allowedNumbers: [
    '5511999999999'  // Diretor
  ],
  
  whitelistMessage: `👋 Olá! Seu número tem autorização para ligações.

Porém, para registrar melhor seu atendimento, prefiro mensagens.

📱 Envie sua solicitação que darei prioridade total!`,
  
  blockGroupCalls: true
};
*/

// EXEMPLO 2: Bot Pessoal/Informal
/*
const CALL_BLOCKER_CONFIG = {
  enabled: true,
  messageDelay: 2000,
  detailedLogging: false,
  oncePerDay: true,
  
  blockedMessage: `🤖 Oi! Sou um bot!

Não consigo atender ligações, mas adoro conversar por mensagem! 😄

📱 Manda uma mensagem aí que te respondo rapidinho!

✨ Sou mais esperto por texto! 🧠`,

  allowedNumbers: [
    '5511999999999',  // Família
    '5511888888888'   // Amigos próximos
  ],
  
  whitelistMessage: `😊 Oi! Você pode me ligar sim!

Mas sabe que sou melhor por mensagem né? 😅

📱 Manda uma msg que conversamos melhor!`,
  
  blockGroupCalls: false  // Permite ligações de grupo
};
*/

// EXEMPLO 3: Bot de Suporte Técnico
/*
const CALL_BLOCKER_CONFIG = {
  enabled: true,
  messageDelay: 1000,
  detailedLogging: true,
  oncePerDay: false,  // Sempre envia mensagem
  
  blockedMessage: `🔧 *SUPORTE TÉCNICO AUTOMATIZADO*

Para um atendimento mais eficiente, utilize nosso sistema de tickets por mensagem.

📋 Envie uma mensagem com:
1️⃣ Tipo do problema
2️⃣ Descrição detalhada
3️⃣ Prints/fotos (se necessário)

⚡ Resposta em até 30 minutos
🎫 Cada conversa gera um ticket automático

Obrigado! 🛠️`,

  allowedNumbers: [
    '5511999999999'  // Supervisor técnico
  ],
  
  whitelistMessage: `🔧 Olá! Você tem acesso direto.

Para documentar melhor o atendimento, prefiro mensagens.

📱 Descreva o problema que resolvo rapidamente!`,
  
  blockGroupCalls: true
};
*/

// ========================================
// FUNÇÕES AUXILIARES (NÃO MODIFICAR)
// ========================================

function isNumberAllowed(phoneNumber) {
  if (CALL_BLOCKER_CONFIG.allowedNumbers.length === 0) {
    return false;
  }
  
  const cleanNumber = phoneNumber.replace(/[@c.us]/g, '');
  return CALL_BLOCKER_CONFIG.allowedNumbers.includes(cleanNumber);
}

function shouldSendMessage(phoneNumber) {
  if (!CALL_BLOCKER_CONFIG.oncePerDay) {
    return true;
  }
  
  const cleanNumber = phoneNumber.replace(/[@c.us]/g, '');
  return !CALL_BLOCKER_CONFIG.dailyMessagesSent.has(cleanNumber);
}

function markMessageSent(phoneNumber) {
  if (CALL_BLOCKER_CONFIG.oncePerDay) {
    const cleanNumber = phoneNumber.replace(/[@c.us]/g, '');
    CALL_BLOCKER_CONFIG.dailyMessagesSent.add(cleanNumber);
  }
}

function resetDailyCache() {
  CALL_BLOCKER_CONFIG.dailyMessagesSent.clear();
  console.log('🔄 Cache de mensagens diárias resetado');
}

// Reset automático à meia-noite
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);
const msUntilMidnight = tomorrow.getTime() - now.getTime();

setTimeout(() => {
  resetDailyCache();
  setInterval(resetDailyCache, 24 * 60 * 60 * 1000);
}, msUntilMidnight);

module.exports = {
  CALL_BLOCKER_CONFIG,
  isNumberAllowed,
  shouldSendMessage,
  markMessageSent,
  resetDailyCache
};