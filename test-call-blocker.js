// Teste do Sistema de Bloqueio de Ligações
// Execute este arquivo para testar as configurações

const { 
  CALL_BLOCKER_CONFIG, 
  isNumberAllowed, 
  shouldSendMessage, 
  markMessageSent,
  resetDailyCache
} = require('./call-blocker-config');

console.log('🧪 TESTE DO SISTEMA DE BLOQUEIO DE LIGAÇÕES\n');

// Teste 1: Verificar configurações
console.log('📋 CONFIGURAÇÕES ATUAIS:');
console.log('✅ Bloqueio habilitado:', CALL_BLOCKER_CONFIG.enabled);
console.log('✅ Bloqueio de grupos:', CALL_BLOCKER_CONFIG.blockGroupCalls);
console.log('✅ Uma mensagem por dia:', CALL_BLOCKER_CONFIG.oncePerDay);
console.log('✅ Delay da mensagem:', CALL_BLOCKER_CONFIG.messageDelay + 'ms');
console.log('✅ Números permitidos:', CALL_BLOCKER_CONFIG.allowedNumbers.length);
console.log('✅ Logs detalhados:', CALL_BLOCKER_CONFIG.detailedLogging);
console.log();

// Teste 2: Verificar whitelist
console.log('🔍 TESTE DE WHITELIST:');
const testNumbers = [
  '5511999999999',
  '5511888888888',
  '5511777777777'
];

testNumbers.forEach(number => {
  const isAllowed = isNumberAllowed(number);
  console.log(`📞 ${number}: ${isAllowed ? '✅ PERMITIDO' : '❌ BLOQUEADO'}`);
});
console.log();

// Teste 3: Verificar controle de mensagens diárias
console.log('📅 TESTE DE CONTROLE DIÁRIO:');
const testNumber = '5511999999999@c.us';

console.log(`📱 Primeira verificação para ${testNumber}:`);
console.log(`   Deve enviar mensagem: ${shouldSendMessage(testNumber) ? '✅ SIM' : '❌ NÃO'}`);

markMessageSent(testNumber);
console.log(`📱 Após marcar como enviada:`);
console.log(`   Deve enviar mensagem: ${shouldSendMessage(testNumber) ? '✅ SIM' : '❌ NÃO'}`);
console.log();

// Teste 4: Verificar mensagens
console.log('💬 MENSAGENS CONFIGURADAS:');
console.log('📝 Mensagem de bloqueio:');
console.log(CALL_BLOCKER_CONFIG.blockedMessage);
console.log();

if (CALL_BLOCKER_CONFIG.whitelistMessage) {
  console.log('📝 Mensagem para whitelist:');
  console.log(CALL_BLOCKER_CONFIG.whitelistMessage);
  console.log();
}

// Teste 5: Simular cenários
console.log('🎭 SIMULAÇÃO DE CENÁRIOS:');

const scenarios = [
  {
    name: 'Ligação de número comum',
    number: '5511999999999@c.us',
    isGroup: false
  },
  {
    name: 'Ligação de grupo',
    number: '120363043968473@g.us',
    isGroup: true
  },
  {
    name: 'Ligação de número da whitelist',
    number: (CALL_BLOCKER_CONFIG.allowedNumbers[0] || '5511888888888') + '@c.us',
    isGroup: false
  }
];

scenarios.forEach((scenario, index) => {
  console.log(`\n🎬 Cenário ${index + 1}: ${scenario.name}`);
  console.log(`   📞 Número: ${scenario.number}`);
  console.log(`   👥 É grupo: ${scenario.isGroup ? 'SIM' : 'NÃO'}`);
  
  const phoneNumber = scenario.number.replace(/@[cg]\.us/g, '');
  const isAllowed = isNumberAllowed(phoneNumber);
  const shouldBlock = scenario.isGroup ? CALL_BLOCKER_CONFIG.blockGroupCalls : true;
  const shouldSend = shouldSendMessage(scenario.number);
  
  console.log(`   🛡️ Deve bloquear: ${shouldBlock ? 'SIM' : 'NÃO'}`);
  console.log(`   ✅ Está na whitelist: ${isAllowed ? 'SIM' : 'NÃO'}`);
  console.log(`   📨 Deve enviar mensagem: ${shouldSend ? 'SIM' : 'NÃO'}`);
  
  if (shouldBlock && shouldSend) {
    const message = isAllowed && CALL_BLOCKER_CONFIG.whitelistMessage 
      ? 'Mensagem da whitelist' 
      : 'Mensagem de bloqueio';
    console.log(`   💬 Tipo de mensagem: ${message}`);
  }
});

console.log('\n🔄 TESTE DE RESET DO CACHE:');
console.log('Cache antes do reset:', CALL_BLOCKER_CONFIG.dailyMessagesSent.size, 'números');
resetDailyCache();
console.log('Cache após reset:', CALL_BLOCKER_CONFIG.dailyMessagesSent.size, 'números');

console.log('\n✅ TESTE CONCLUÍDO!');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Inicie o bot: node wppconnect-server.js');
console.log('2. Conecte o WhatsApp escaneando o QR Code');
console.log('3. Teste fazendo uma ligação para o número do bot');
console.log('4. Verifique os logs no console');
console.log('5. Confirme se a mensagem de bloqueio foi recebida');

console.log('\n🛠️ PERSONALIZAÇÃO:');
console.log('- Edite call-blocker-config.js para personalizar mensagens');
console.log('- Adicione números à whitelist se necessário');
console.log('- Ajuste o delay da mensagem se necessário');
console.log('- Configure logs detalhados conforme preferência');