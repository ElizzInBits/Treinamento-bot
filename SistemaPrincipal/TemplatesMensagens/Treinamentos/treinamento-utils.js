// Utilitários padrão para todos os treinamentos

class TreinamentoUtils {
    /**
     * Obter ID do treinamento de qualquer script
     * @param {string} nomeArquivo - Nome do arquivo do treinamento (ex: 'epc_epi.js')
     * @returns {number|null} - ID do treinamento ou null se não encontrado
     */
    static obterIdTreinamento(nomeArquivo) {
        try {
            const path = require('path');
            const fs = require('fs');
            
            // Determinar caminho baseado no nome do arquivo
            let caminhoArquivo;
            
            if (nomeArquivo.includes('epc_epi')) {
                caminhoArquivo = path.join(__dirname, 'EPC_EPI', 'epc_epi.js');
            } else if (nomeArquivo.includes('apresentacao') || nomeArquivo.includes('Apresentacao')) {
                caminhoArquivo = path.join(__dirname, 'Apresentacao', 'treinamentoApresentacao.js');
            } else {
                // Tentar encontrar o arquivo automaticamente
                caminhoArquivo = path.join(__dirname, nomeArquivo);
            }
            
            if (!fs.existsSync(caminhoArquivo)) {
                console.log(`⚠️ Arquivo de treinamento não encontrado: ${caminhoArquivo}`);
                return null;
            }
            
            // Ler o arquivo e procurar por TREINAMENTO_ID
            const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
            const match = conteudo.match(/const\s+TREINAMENTO_ID\s*=\s*(\d+)/);
            
            if (match) {
                return parseInt(match[1]);
            }
            
            console.log(`⚠️ TREINAMENTO_ID não encontrado em: ${caminhoArquivo}`);
            return null;
            
        } catch (error) {
            console.error('❌ Erro ao obter ID do treinamento:', error);
            return null;
        }
    }
    
    /**
     * Obter informações completas do treinamento
     * @param {string} nomeArquivo - Nome do arquivo do treinamento
     * @returns {object} - Objeto com id, nome e outras informações
     */
    static obterInfoTreinamento(nomeArquivo) {
        try {
            const path = require('path');
            const fs = require('fs');
            
            let caminhoArquivo;
            
            if (nomeArquivo.includes('epc_epi')) {
                caminhoArquivo = path.join(__dirname, 'EPC_EPI', 'epc_epi.js');
            } else if (nomeArquivo.includes('apresentacao') || nomeArquivo.includes('Apresentacao')) {
                caminhoArquivo = path.join(__dirname, 'Apresentacao', 'treinamentoApresentacao.js');
            } else {
                caminhoArquivo = path.join(__dirname, nomeArquivo);
            }
            
            if (!fs.existsSync(caminhoArquivo)) {
                return { id: null, nome: null, erro: 'Arquivo não encontrado' };
            }
            
            const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
            
            // Buscar TREINAMENTO_ID
            const matchId = conteudo.match(/const\s+TREINAMENTO_ID\s*=\s*(\d+)/);
            const id = matchId ? parseInt(matchId[1]) : null;
            
            // Buscar NOME_TREINAMENTO
            const matchNome = conteudo.match(/const\s+NOME_TREINAMENTO\s*=\s*['"`]([^'"`]+)['"`]/);
            const nome = matchNome ? matchNome[1] : null;
            
            return { id, nome };
            
        } catch (error) {
            console.error('❌ Erro ao obter informações do treinamento:', error);
            return { id: null, nome: null, erro: error.message };
        }
    }
    
    /**
     * Criar token de certificado usando ID do próprio treinamento
     * @param {number} usuarioId - ID do usuário
     * @param {string} nomeArquivoTreinamento - Nome do arquivo do treinamento
     * @param {string} certificadoPath - Caminho do certificado
     * @returns {object} - Resultado da criação do token
     */
    static async criarTokenCertificadoTreinamento(usuarioId, nomeArquivoTreinamento, certificadoPath) {
        try {
            const AssinaturaCertificadoService = require('../Certificados/assinaturaCertificado');
            const treinamento_id = this.obterIdTreinamento(nomeArquivoTreinamento);
            
            if (!treinamento_id) {
                throw new Error(`ID do treinamento não encontrado para: ${nomeArquivoTreinamento}`);
            }
            
            console.log(`🎯 Criando token para treinamento ID: ${treinamento_id}`);
            
            return await AssinaturaCertificadoService.criarTokenCertificado(
                usuarioId,
                treinamento_id,
                certificadoPath
            );
            
        } catch (error) {
            console.error('❌ Erro ao criar token de certificado:', error);
            throw error;
        }
    }
}

module.exports = TreinamentoUtils;