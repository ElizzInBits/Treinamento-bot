// Configurações do Bloqueador de Ligações
// Este arquivo permite personalizar o comportamento do bloqueio de ligações

const CALL_BLOCKER_CONFIG = {
  // Ativar/desativar o bloqueio de ligações
  enabled: true,

  // Mensagem enviada quando uma ligação é bloqueada
  blockedMessage: `🚫 *Chamadas não são aceitas*

Envie mensagem de texto! 😊`,

  // Delay em milissegundos antes de enviar a mensagem (para evitar conflitos)
  messageDelay: 500,

  // Log detalhado das ligações bloqueadas
  detailedLogging: true,

  // Lista de números que podem ligar (whitelist) - deixe vazio para bloquear todos
  allowedNumbers: [
    // Exemplo: '5511999999999'
  ],

  // Mensagem personalizada para números da whitelist (opcional)
  whitelistMessage: `📞 Olá! Embora este seja um bot automatizado, seu número está autorizado.

No entanto, prefiro comunicação por mensagens de texto para melhor atendimento.

Por favor, envie uma mensagem! 😊`,

  // Bloquear ligações em grupo também
  blockGroupCalls: true,

  // Enviar mensagem de bloqueio apenas uma vez por dia por número
  oncePerDay: true,

  // Armazenar números que já receberam mensagem hoje
  dailyMessagesSent: new Set()
};

// Função para verificar se um número está na whitelist
function isNumberAllowed(phoneNumber) {
  if (CALL_BLOCKER_CONFIG.allowedNumbers.length === 0) {
    return false; // Se não há whitelist, bloquear todos
  }

  const cleanNumber = phoneNumber.replace(/[@c.us]/g, '');
  return CALL_BLOCKER_CONFIG.allowedNumbers.includes(cleanNumber);
}

// Função para verificar se já enviou mensagem hoje
function shouldSendMessage(phoneNumber) {
  if (!CALL_BLOCKER_CONFIG.oncePerDay) {
    return true; // Sempre enviar se não há limitação diária
  }

  const cleanNumber = phoneNumber.replace(/[@c.us]/g, '');
  return !CALL_BLOCKER_CONFIG.dailyMessagesSent.has(cleanNumber);
}

// Função para marcar que mensagem foi enviada
function markMessageSent(phoneNumber) {
  if (CALL_BLOCKER_CONFIG.oncePerDay) {
    const cleanNumber = phoneNumber.replace(/[@c.us]/g, '');
    CALL_BLOCKER_CONFIG.dailyMessagesSent.add(cleanNumber);
  }
}

// Limpar cache diário à meia-noite
function resetDailyCache() {
  CALL_BLOCKER_CONFIG.dailyMessagesSent.clear();
  console.log('🔄 Cache de mensagens diárias resetado');
}

// Configurar reset automático à meia-noite
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);
const msUntilMidnight = tomorrow.getTime() - now.getTime();

setTimeout(() => {
  resetDailyCache();
  // Configurar reset diário
  setInterval(resetDailyCache, 24 * 60 * 60 * 1000);
}, msUntilMidnight);

module.exports = {
  CALL_BLOCKER_CONFIG,
  isNumberAllowed,
  shouldSendMessage,
  markMessageSent,
  resetDailyCache
};