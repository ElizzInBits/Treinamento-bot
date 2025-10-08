#!/usr/bin/env node

const mantenedorSessao = require('./manterSessao');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando estado da sessão...');

// Verificar sessão existente
const sessaoExistente = mantenedorSessao.verificarSessaoExistente();
const temTokens = mantenedorSessao.verificarTokensWhatsApp();

console.log('\n📊 RELATÓRIO DA SESSÃO:');
console.log('========================');

if (sessaoExistente) {
    console.log('✅ Sessão encontrada:');
    console.log(`   - ID: ${sessaoExistente.sessionId}`);
    console.log(`   - Status: ${sessaoExistente.status}`);
    console.log(`   - Criada em: ${new Date(sessaoExistente.criadoEm).toLocaleString()}`);
    console.log(`   - Último heartbeat: ${new Date(sessaoExistente.ultimoHeartbeat).toLocaleString()}`);
    
    const agora = Date.now();
    const tempoSemHeartbeat = agora - sessaoExistente.ultimoHeartbeat;
    const minutosInativo = Math.floor(tempoSemHeartbeat / 60000);
    
    if (minutosInativo > 5) {
        console.log(`⚠️  Sessão inativa há ${minutosInativo} minutos`);
    } else {
        console.log(`✅ Sessão ativa (último heartbeat há ${minutosInativo} minutos)`);
    }
} else {
    console.log('❌ Nenhuma sessão encontrada');
}

if (temTokens) {
    console.log('✅ Tokens do WhatsApp presentes');
} else {
    console.log('❌ Tokens do WhatsApp ausentes');
}

// Verificar backups disponíveis
const backupPath = path.join(__dirname, 'tokens', 'backup_tokens');
if (fs.existsSync(backupPath)) {
    const backups = fs.readdirSync(backupPath)
        .filter(dir => dir.startsWith('backup_'))
        .sort()
        .reverse();
    
    if (backups.length > 0) {
        console.log(`✅ ${backups.length} backup(s) disponível(is)`);
        console.log(`   - Mais recente: ${backups[0]}`);
    } else {
        console.log('❌ Nenhum backup disponível');
    }
} else {
    console.log('❌ Diretório de backup não encontrado');
}

console.log('\n🚀 RECOMENDAÇÕES:');
console.log('==================');

if (!sessaoExistente && !temTokens) {
    console.log('📱 Primeira execução - QR Code será necessário');
} else if (sessaoExistente && temTokens) {
    console.log('✅ Sessão deve ser restaurada automaticamente');
} else if (!sessaoExistente && temTokens) {
    console.log('🔄 Tokens presentes mas sessão perdida - Tentativa de restauração');
} else {
    console.log('⚠️  Estado inconsistente - Pode ser necessário limpar e reiniciar');
}

console.log('\n💡 COMANDOS ÚTEIS:');
console.log('===================');
console.log('• "limpar sessao" - Limpa sessão e força novo QR');
console.log('• "status sessao" - Mostra status atual da sessão');
console.log('• "restart" - Reinicia o bot mantendo a sessão');

console.log('\n✅ Verificação concluída!\n');