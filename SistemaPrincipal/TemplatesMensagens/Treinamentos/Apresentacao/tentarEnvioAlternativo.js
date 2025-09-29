// ==================== FUNÇÃO AUXILIAR PARA ENVIO ALTERNATIVO ====================

const { enviarVideoBase64, enviarVideoEmPartes } = require('./videoFallback');

async function tentarEnvioAlternativo(sender, sendMessage, videoPath, tipoTreinamento) {
    try {
        console.log(`🔄 Tentando envio alternativo para: ${tipoTreinamento}`);
        
        // Tentar base64 primeiro
        const sucessoBase64 = await enviarVideoBase64(
            sender, 
            sendMessage, 
            videoPath, 
            `🎥 Exemplo prático: ${tipoTreinamento}`,
            `${tipoTreinamento.toLowerCase().replace(/\s+/g, '-')}.mp4`
        );
        
        if (!sucessoBase64) {
            // Tentar envio em partes (simulação)
            const sucessoPartes = await enviarVideoEmPartes(
                sender,
                sendMessage,
                videoPath,
                `Exemplo prático: ${tipoTreinamento}`
            );
            
            if (!sucessoPartes) {
                // Fallback final para mensagem de texto
                const mensagemFallback = gerarMensagemFallback(tipoTreinamento);
                await sendMessage(sender, 'send-message', {
                    message: mensagemFallback
                });
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no envio alternativo:', error);
        
        // Último recurso - mensagem de texto
        const mensagemFallback = gerarMensagemFallback(tipoTreinamento);
        await sendMessage(sender, 'send-message', {
            message: mensagemFallback
        });
        
        return false;
    }
}

function gerarMensagemFallback(tipoTreinamento) {
    if (tipoTreinamento.toLowerCase().includes('motorista')) {
        return '🎥 *Exemplo prático: Treinamento para motoristas*\n\n🚗 Nossos treinamentos incluem:\n• Vídeos explicativos\n• Simulações práticas\n• Testes interativos\n• Certificado válido\n\n📱 Tudo direto no WhatsApp!';
    } else if (tipoTreinamento.toLowerCase().includes('terceiros')) {
        return '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!';
    } else {
        return `🎥 *Exemplo prático: ${tipoTreinamento}*\n\n📚 Nossos treinamentos incluem:\n• Conteúdo interativo\n• Certificação válida\n• Acompanhamento em tempo real\n• Relatórios detalhados\n\n📱 Tudo direto no WhatsApp!`;
    }
}

module.exports = {
    tentarEnvioAlternativo
};