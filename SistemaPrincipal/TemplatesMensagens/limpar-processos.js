#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Iniciando limpeza completa de processos e locks...');

// Função para executar comando e capturar saída
function executarComando(comando, ignorarErro = true) {
    try {
        const resultado = execSync(comando, { encoding: 'utf8', stdio: 'pipe' });
        return resultado.trim();
    } catch (error) {
        if (!ignorarErro) {
            console.error(`❌ Erro ao executar: ${comando}`);
            console.error(error.message);
        }
        return '';
    }
}

// 1. Listar processos Chrome relacionados ao bot
console.log('\n🔍 Verificando processos Chrome...');
const processosChrome = executarComando('ps aux | grep -i chrome | grep -v grep');
if (processosChrome) {
    console.log('📋 Processos Chrome encontrados:');
    processosChrome.split('\n').forEach(linha => {
        if (linha.includes('WHATSAPP_BOT_DIRECT') || linha.includes('wppconnect')) {
            console.log(`   🎯 ${linha}`);
        }
    });
} else {
    console.log('✅ Nenhum processo Chrome encontrado');
}

// 2. Matar processos Chrome específicos
console.log('\n💀 Finalizando processos Chrome...');
const comandosKill = [
    'pkill -9 -f "chrome.*WHATSAPP_BOT_DIRECT"',
    'pkill -9 -f "chromium.*WHATSAPP_BOT_DIRECT"',
    'pkill -9 -f wppconnect',
    'pkill -9 -f puppeteer'
];

comandosKill.forEach(comando => {
    const resultado = executarComando(comando);
    console.log(`   ${comando}: ${resultado || 'OK'}`);
});

// 3. Aguardar processos terminarem
console.log('\n⏳ Aguardando processos terminarem...');
// await new Promise(resolve => setTimeout(resolve, 3000)); // Removido para evitar erro de sintaxe

// 4. Limpar arquivos de lock
console.log('\n🗂️ Limpando arquivos de lock...');
const tokensPath = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT');

if (fs.existsSync(tokensPath)) {
    try {
        // Listar arquivos de lock
        const arquivos = fs.readdirSync(tokensPath, { recursive: true });
        const arquivosLock = arquivos.filter(arquivo => 
            arquivo.includes('lock') || 
            arquivo.includes('Lock') || 
            arquivo.includes('LOCK')
        );
        
        if (arquivosLock.length > 0) {
            console.log('📋 Arquivos de lock encontrados:');
            arquivosLock.forEach(arquivo => {
                const caminhoCompleto = path.join(tokensPath, arquivo);
                try {
                    if (fs.existsSync(caminhoCompleto)) {
                        fs.unlinkSync(caminhoCompleto);
                        console.log(`   ✅ Removido: ${arquivo}`);
                    }
                } catch (error) {
                    console.log(`   ❌ Erro ao remover ${arquivo}: ${error.message}`);
                }
            });
        } else {
            console.log('✅ Nenhum arquivo de lock encontrado');
        }
        
        // Verificar SingletonLock especificamente
        const singletonPath = path.join(tokensPath, 'SingletonLock');
        if (fs.existsSync(singletonPath)) {
            fs.unlinkSync(singletonPath);
            console.log('   ✅ SingletonLock removido');
        }
        
    } catch (error) {
        console.error('❌ Erro ao limpar locks:', error.message);
    }
} else {
    console.log('📁 Diretório de tokens não encontrado');
}

// 5. Limpar cache do sistema
console.log('\n🧹 Limpando cache do sistema...');
const cacheCommands = [
    'rm -rf /tmp/.org.chromium.*',
    'rm -rf /tmp/chrome_*',
    'rm -rf ~/.cache/chromium/SingletonLock*',
    'rm -rf ~/.config/chromium/SingletonLock*'
];

cacheCommands.forEach(comando => {
    executarComando(comando);
    console.log(`   ✅ ${comando}`);
});

// 6. Verificar portas em uso
console.log('\n🔌 Verificando portas em uso...');
const portasUsadas = executarComando('netstat -tulpn | grep :9222');
if (portasUsadas) {
    console.log('📋 Portas Chrome em uso:');
    console.log(portasUsadas);
} else {
    console.log('✅ Nenhuma porta Chrome em uso');
}

// 7. Relatório final
console.log('\n📊 RELATÓRIO FINAL:');
console.log('==================');

const processosRestantes = executarComando('ps aux | grep -i chrome | grep -v grep');
if (processosRestantes) {
    const linhas = processosRestantes.split('\n').filter(linha => 
        linha.includes('WHATSAPP_BOT_DIRECT') || linha.includes('wppconnect')
    );
    if (linhas.length > 0) {
        console.log('⚠️ Processos ainda ativos:');
        linhas.forEach(linha => console.log(`   ${linha}`));
    } else {
        console.log('✅ Todos os processos relacionados foram finalizados');
    }
} else {
    console.log('✅ Nenhum processo Chrome ativo');
}

// Verificar se SingletonLock ainda existe
const singletonCheck = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT', 'SingletonLock');
if (fs.existsSync(singletonCheck)) {
    console.log('❌ SingletonLock ainda existe!');
} else {
    console.log('✅ SingletonLock removido com sucesso');
}

console.log('\n🎉 Limpeza concluída!');
console.log('💡 Agora você pode reiniciar o bot com segurança.');

console.log('\n🎉 Limpeza concluída!');
console.log('💡 Agora você pode reiniciar o bot com segurança.');