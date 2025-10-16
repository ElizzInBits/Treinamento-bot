const { gerarCertificadoBanco } = require('./certificados2');
const { Usuario } = require('../../BancoDeDados/models');
const path = require('path');
const fs = require('fs');

async function gerarCertificado(nome, email, sendMessage, sender, nometreinamento = null) {
    try {
        console.log(`🎓 Gerando certificado para: ${nome} (${email}) - Treinamento: ${nometreinamento}`);
        
        // Buscar contato pelo telefone
        const formatosTelefone = [
            sender,
            sender.substring(2),
            `${sender.substring(0, 4)}9${sender.substring(4)}`,
            sender.length === 13 ? sender.substring(0, 4) + sender.substring(5) : sender,
        ];
        
        let contato = null;
        for (const formato of formatosTelefone) {
            contato = await Usuario.findOne({ where: { telefone: formato } });
            if (contato) {
                console.log(`✅ Contato encontrado para certificado: ${contato.nome}`);
                break;
            }
        }
        
        if (!contato) {
            throw new Error('Contato não encontrado no banco de dados');
        }
        
        // Atualizar dados do contato se necessário
        if (contato.email !== email || contato.nomeCompleto !== nome) {
            await contato.update({
                email: email,
                nomeCompleto: nome
            });
            console.log('✅ Dados do contato atualizados');
        }
        
        // Gerar certificado usando certificados2.js (já envia por email automaticamente)
        const caminhoArquivo = await gerarCertificadoBanco(contato.id, nometreinamento);
        
        // Criar registro de assinatura e gerar link
        const AssinaturaCertificadoService = require('./assinaturaCertificado');
        const assinatura = await AssinaturaCertificadoService.criarAssinaturaPendente(
            contato.id, 
            caminhoArquivo, 
            nometreinamento
        );
        
        return {
            sucesso: true,
            arquivo: caminhoArquivo,
            linkAssinatura: assinatura.linkAssinatura,
            token: assinatura.token
        };
        
    } catch (error) {
        console.error('❌ Erro ao gerar certificado:', error);
        return {
            sucesso: false,
            erro: error.message
        };
    }
}

module.exports = {
    gerarCertificado
};