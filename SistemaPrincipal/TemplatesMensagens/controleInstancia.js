const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ControleInstancia {
    constructor() {
        this.pidFile = path.join(__dirname, 'bot.pid');
        this.lockFile = path.join(__dirname, 'bot.lock');
    }

    // Verificar se já existe uma instância rodando
    verificarInstanciaExistente() {
        try {
            // Verificar arquivo PID
            if (fs.existsSync(this.pidFile)) {
                const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
                
                // Verificar se o processo ainda está ativo
                try {
                    process.kill(pid, 0); // Não mata, apenas verifica se existe
                    console.log(`⚠️ Instância já rodando com PID: ${pid}`);
                    return true;
                } catch (e) {
                    // Processo não existe mais, limpar arquivo PID
                    fs.unlinkSync(this.pidFile);
                    console.log('🧹 Arquivo PID órfão removido');
                }
            }

            // Verificar arquivo de lock
            if (fs.existsSync(this.lockFile)) {
                const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
                const agora = Date.now();
                
                // Se o lock tem menos de 30 segundos, considerar ativo
                if ((agora - lockData.timestamp) < 30000) {
                    console.log('⚠️ Lock ativo detectado');
                    return true;
                } else {
                    // Lock expirado, remover
                    fs.unlinkSync(this.lockFile);
                    console.log('🧹 Lock expirado removido');
                }
            }

            return false;
        } catch (error) {
            console.error('❌ Erro ao verificar instância:', error.message);
            return false;
        }
    }

    // Criar lock para esta instância
    criarLock() {
        try {
            const lockData = {
                pid: process.pid,
                timestamp: Date.now(),
                startTime: new Date().toISOString()
            };

            fs.writeFileSync(this.pidFile, process.pid.toString());
            fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
            
            console.log(`✅ Lock criado para PID: ${process.pid}`);
            
            // Renovar lock a cada 10 segundos
            this.intervalRenovacao = setInterval(() => {
                this.renovarLock();
            }, 10000);

            // Limpar lock ao sair
            process.on('exit', () => this.limparLock());
            process.on('SIGINT', () => {
                this.limparLock();
                process.exit(0);
            });
            process.on('SIGTERM', () => {
                this.limparLock();
                process.exit(0);
            });

        } catch (error) {
            console.error('❌ Erro ao criar lock:', error.message);
        }
    }

    // Renovar lock
    renovarLock() {
        try {
            if (fs.existsSync(this.lockFile)) {
                const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
                lockData.timestamp = Date.now();
                lockData.lastRenewal = new Date().toISOString();
                fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
            }
        } catch (error) {
            console.error('❌ Erro ao renovar lock:', error.message);
        }
    }

    // Limpar lock
    limparLock() {
        try {
            if (this.intervalRenovacao) {
                clearInterval(this.intervalRenovacao);
            }

            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }

            if (fs.existsSync(this.lockFile)) {
                fs.unlinkSync(this.lockFile);
            }

            console.log('🧹 Lock limpo');
        } catch (error) {
            console.error('❌ Erro ao limpar lock:', error.message);
        }
    }

    // Forçar limpeza de todas as instâncias
    forcarLimpeza() {
        try {
            console.log('🧹 Forçando limpeza de todas as instâncias...');

            // Matar processos relacionados
            try {
                execSync('pkill -9 -f "node.*Template2"', { stdio: 'ignore' });
                execSync('pkill -9 -f "node.*start-direct"', { stdio: 'ignore' });
                console.log('✅ Processos Node finalizados');
            } catch (e) {}

            // Remover arquivos de controle
            [this.pidFile, this.lockFile].forEach(arquivo => {
                if (fs.existsSync(arquivo)) {
                    fs.unlinkSync(arquivo);
                    console.log(`✅ Removido: ${path.basename(arquivo)}`);
                }
            });

            console.log('✅ Limpeza forçada concluída');
        } catch (error) {
            console.error('❌ Erro na limpeza forçada:', error.message);
        }
    }

    // Aguardar instância anterior finalizar
    async aguardarLiberacao(timeout = 30000) {
        const inicio = Date.now();
        
        while (this.verificarInstanciaExistente()) {
            if ((Date.now() - inicio) > timeout) {
                console.log('⏰ Timeout aguardando liberação - Forçando limpeza');
                this.forcarLimpeza();
                break;
            }
            
            console.log('⏳ Aguardando instância anterior finalizar...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

module.exports = new ControleInstancia();