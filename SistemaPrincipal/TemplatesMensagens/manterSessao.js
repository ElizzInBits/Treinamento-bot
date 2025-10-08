const fs = require('fs');
const path = require('path');

// ==================== SISTEMA DE MANUTENÇÃO DE SESSÃO ====================

class MantenedorSessao {
    constructor() {
        this.tokensPath = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT');
        this.sessionFile = path.join(this.tokensPath, 'session.json');
        this.heartbeatInterval = null;
    }

    // Verificar se existe sessão salva
    verificarSessaoExistente() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const sessionData = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
                const agora = Date.now();
                const ultimoHeartbeat = sessionData.ultimoHeartbeat || 0;
                
                // Se o último heartbeat foi há menos de 5 minutos, considerar sessão ativa
                if ((agora - ultimoHeartbeat) < 300000) {
                    console.log('✅ Sessão existente encontrada e ativa');
                    return sessionData;
                } else {
                    console.log('⚠️ Sessão existente mas expirada');
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            return null;
        }
    }

    // Salvar dados da sessão
    salvarSessao(dadosSessao) {
        try {
            // Criar diretório se não existir
            if (!fs.existsSync(this.tokensPath)) {
                fs.mkdirSync(this.tokensPath, { recursive: true });
            }

            const sessionData = {
                ...dadosSessao,
                ultimoHeartbeat: Date.now(),
                criadoEm: dadosSessao.criadoEm || Date.now()
            };

            fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
            console.log('✅ Sessão salva com sucesso');
        } catch (error) {
            console.error('❌ Erro ao salvar sessão:', error);
        }
    }

    // Iniciar heartbeat para manter sessão ativa
    iniciarHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            try {
                if (fs.existsSync(this.sessionFile)) {
                    const sessionData = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
                    sessionData.ultimoHeartbeat = Date.now();
                    fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
                    console.log('💓 Heartbeat da sessão atualizado');
                }
            } catch (error) {
                console.error('❌ Erro no heartbeat:', error);
            }
        }, 60000); // A cada 1 minuto

        console.log('💓 Sistema de heartbeat iniciado');
    }

    // Parar heartbeat
    pararHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            console.log('💓 Sistema de heartbeat parado');
        }
    }

    // Limpar sessão
    limparSessao() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                fs.unlinkSync(this.sessionFile);
                console.log('🧹 Sessão limpa');
            }
            this.pararHeartbeat();
        } catch (error) {
            console.error('❌ Erro ao limpar sessão:', error);
        }
    }

    // Verificar se tokens do WhatsApp existem
    verificarTokensWhatsApp() {
        try {
            const arquivosToken = [
                'Default/Local Storage/leveldb',
                'Default/Session Storage',
                'Default/IndexedDB'
            ];

            for (const arquivo of arquivosToken) {
                const caminhoCompleto = path.join(this.tokensPath, arquivo);
                if (fs.existsSync(caminhoCompleto)) {
                    console.log(`✅ Token encontrado: ${arquivo}`);
                    return true;
                }
            }

            console.log('❌ Nenhum token do WhatsApp encontrado');
            return false;
        } catch (error) {
            console.error('❌ Erro ao verificar tokens:', error);
            return false;
        }
    }

    // Backup dos tokens
    backupTokens() {
        try {
            const backupPath = path.join(this.tokensPath, '..', 'backup_tokens');
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(backupPath, `backup_${timestamp}`);

            if (fs.existsSync(this.tokensPath)) {
                fs.cpSync(this.tokensPath, backupDir, { recursive: true });
                console.log(`✅ Backup criado: ${backupDir}`);
                return backupDir;
            }
        } catch (error) {
            console.error('❌ Erro ao criar backup:', error);
        }
        return null;
    }

    // Restaurar tokens do backup mais recente
    restaurarTokens() {
        try {
            const backupPath = path.join(this.tokensPath, '..', 'backup_tokens');
            if (!fs.existsSync(backupPath)) {
                console.log('❌ Nenhum backup encontrado');
                return false;
            }

            const backups = fs.readdirSync(backupPath)
                .filter(dir => dir.startsWith('backup_'))
                .sort()
                .reverse();

            if (backups.length === 0) {
                console.log('❌ Nenhum backup válido encontrado');
                return false;
            }

            const ultimoBackup = path.join(backupPath, backups[0]);
            
            // Limpar tokens atuais
            if (fs.existsSync(this.tokensPath)) {
                fs.rmSync(this.tokensPath, { recursive: true, force: true });
            }

            // Restaurar do backup
            fs.cpSync(ultimoBackup, this.tokensPath, { recursive: true });
            console.log(`✅ Tokens restaurados do backup: ${backups[0]}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao restaurar tokens:', error);
            return false;
        }
    }
}

module.exports = new MantenedorSessao();