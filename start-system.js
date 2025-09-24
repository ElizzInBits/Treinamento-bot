#!/usr/bin/env node

// Script para iniciar o sistema completo
console.log('🚀 Iniciando Sistema Treinamento-bot...\n');

const { exec } = require('child_process');
const path = require('path');

// Função para executar comandos
function runCommand(command, description) {
    return new Promise((resolve, reject) => {
        console.log(`🔄 ${description}...`);
        
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Erro em ${description}:`, error.message);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.warn(`⚠️  Warning em ${description}:`, stderr);
            }
            
            if (stdout) {
                console.log(`✅ ${description} concluído`);
            }
            
            resolve(stdout);
        });
    });
}

async function startSystem() {
    try {
        // 1. Parar processos existentes
        await runCommand('pm2 stop all', 'Parando processos existentes');
        
        // 2. Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Iniciar sistema com PM2
        await runCommand('pm2 start ecosystem.config.js', 'Iniciando sistema com PM2');
        
        // 4. Mostrar status
        await runCommand('pm2 status', 'Verificando status dos processos');
        
        console.log('\n🎉 Sistema iniciado com sucesso!');
        console.log('\n📋 Comandos úteis:');
        console.log('   pm2 status          - Ver status dos processos');
        console.log('   pm2 logs            - Ver logs em tempo real');
        console.log('   pm2 restart all     - Reiniciar todos os processos');
        console.log('   pm2 stop all        - Parar todos os processos');
        
        console.log('\n🌐 URLs do sistema:');
        console.log('   Frontend: http://72.60.48.249:3000');
        console.log('   API: http://72.60.48.249:21465');
        
    } catch (error) {
        console.error('\n❌ Erro ao iniciar sistema:', error.message);
        process.exit(1);
    }
}

// Iniciar sistema
startSystem();