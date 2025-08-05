// Script de treinamento: Curso de Formação de Membros de Cipa
// ID do treinamento: 37 (assumindo que este é o ID correto)
// Gerado automaticamente

const { sendMessage } = require('../conexao/wppConnectTemplate');
const { Treinamento } = require('../../BancoDeDados/models');
const { Interacao, Empresa } = require('../../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('../Certificados/certificados2.js');

// ========================================
// CONFIGURAÇÕES ESPECÍFICAS DO TREINAMENTO
// ========================================
const TEMPO_LEMBRETE = 0.3 * 60 * 1000; // 18 segundos

// Respostas válidas para este treinamento
const RESPOSTAS_POSITIVAS = [
    'sim',
    'sim, os dados estão corretos',
    'os dados estão corretos',
    'dados corretos',
    'confirmar',
    'sim estão corretos',
    'começar agora',
    'pronto',
    'vamos lá'
];

const RESPOSTAS_NEGATIVAS = [
    'não',
    'não, preciso corrigir',
    'não, os dados não são corretos',
    'os dados não são corretos',
    'dados incorretos',
    'não estão corretos',
    'não começar',
    'depois',
    'mais tarde'
];

// Configurações do quiz
const QUIZ_CONFIG = {
    pergunta: 'Qual é o principal objetivo da CIPA?',
    alternativas: {
        a: 'Fiscalizar os funcionários',
        b: 'Prevenir acidentes e doenças do trabalho',
        c: 'Aumentar a produtividade',
        d: 'Reduzir custos operacionais'
    },
    respostaCorreta: 'b_cipa',
    explicacao: 'O principal objetivo da CIPA é prevenir acidentes e doenças do trabalho!'
};

/**
 * Salva interação no banco
 */
async function salvarInteracao(sender, tipo, mensagem) {
    await Interacao.upsert({ telefone: sender, tipo, mensagem });
}

/**
 * Obtém última interação
 */
async function obterUltimaInteracao(sender) {
    return await Interacao.findOne({
        where: { telefone: sender },
        order: [['updatedAt', 'DESC']],
    });
}

/**
 * Executa o treinamento: Curso de Formação de Membros de Cipa
 */
async function executarTreinamento(sender, contato) {
    const treinamento = await Treinamento.findOne({
        where: { nome: 'CURSO DE FORMAÇÃO DE MEMBROS DE CIPA' }
    });
    
    if (!treinamento) {
        await sendMessage(sender, 'send-message', {
            message: '❌ Treinamento não encontrado.',
        });
        return;
    }

    await sendMessage(sender, 'send-message', {
        message: `👋 Olá, ${contato.nome}! Seja bem-vindo(a) ao treinamento: ${treinamento.nome}! 💼`,
    });

    await sendMessage(sender, 'send-message', {
        message: '🛡️ Objetivos do treinamento:\n\n• Conhecer a legislação da CIPA\n• Identificar riscos no ambiente de trabalho\n• Desenvolver habilidades de prevenção\n• Formar membros capacitados',
    });

    const listMsg = {
        title: '',
        description: '*Está preparado para iniciar?* \nSelecione uma opção:',
        buttonText: 'Escolher',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'começar_cipa', title: 'Vamos lá! 🚀 💪', description: '' },
                { id: 'não_começar_cipa', title: 'Preciso me preparar melhor 🤔', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarInteracao(sender, 'aguardando_inicio_cipa', JSON.stringify(listMsg));
}

/**
 * Processa as respostas do treinamento CIPA
 */
async function processarRespostaTeste(sender, text, selectedId, contato) {
    console.log(`📝 [TREINAMENTO CIPA] Processando resposta - text: '${text}', selectedId: '${selectedId}'`);
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    const textLower = text.toLowerCase();
    
    // Início do treinamento
    if (selectedId === 'começar_cipa' || textLower.includes('vamos lá')) {
        await sendMessage(sender, 'send-message', {
            message: '🎯 Excelente! Vamos iniciar o treinamento de CIPA! 💪',
        });

        await sendMessage(sender, 'send-message', {
            message: '📋 Módulo 1 - 🛡️ *Fundamentos da CIPA*\n\n🔸 Legislação Aplicável\n• NR-5 - Comissão Interna de Prevenção de Acidentes\n• Constituição e funcionamento\n• Atribuições e responsabilidades',
        });

        await sendMessage(sender, 'send-message', {
            message: '*Para prosseguir, digite o número 1️⃣*',
        });

        await salvarInteracao(sender, 'aguardando_numero_cipa', '*Para prosseguir, digite o número 1️⃣*');
        return true;
    }

    // Não começar agora
    if (selectedId === 'não_começar_cipa' || textLower.includes('preciso me preparar')) {
        const listMsg = {
            title: '',
            description: 'Quando estiver pronto:',
            buttonText: 'Estou preparado',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [{ id: 'pronto_cipa', title: 'Vamos lá! 🚀 💪', description: '' }],
            }],
        };

        await sendMessage(sender, 'send-message', {
            message: '👍 Sem pressa! Quando se sentir preparado, é só me avisar. Estaremos aqui! 🤝',
        });
        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_inicio_cipa', JSON.stringify(listMsg));
        return true;
    }

    // Continuar para o quiz
    if (text === '1' && ultimaInteracao?.tipo === 'aguardando_numero_cipa') {
        await sendMessage(sender, 'send-message', {
            message: 'Perfeito! 🎯\n\nAgora vamos testar seus conhecimentos! 🧠 💡',
        });

        const quizList = {
            title: '',
            description: `${QUIZ_CONFIG.pergunta}\n\nA) ${QUIZ_CONFIG.alternativas.a}\n\nB) ${QUIZ_CONFIG.alternativas.b}\n\nC) ${QUIZ_CONFIG.alternativas.c}\n\nD) ${QUIZ_CONFIG.alternativas.d}`,
            buttonText: 'Responder',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_cipa', title: 'A', description: '' },
                    { id: 'b_cipa', title: 'B', description: '' },
                    { id: 'c_cipa', title: 'C', description: '' },
                    { id: 'd_cipa', title: 'D', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizList);
        await salvarInteracao(sender, 'quiz_cipa', JSON.stringify(quizList));
        return true;
    }

    // Processar respostas do quiz
    if (ultimaInteracao?.tipo === 'quiz_cipa' && (selectedId.includes('_cipa') || ['a', 'b', 'c', 'd'].includes(textLower))) {
        const respostaCorreta = selectedId === QUIZ_CONFIG.respostaCorreta || textLower === 'b';
        
        if (respostaCorreta) {
            await sendMessage(sender, 'send-message', {
                message: `🎉 Parabéns! Resposta correta!\n\n${QUIZ_CONFIG.explicacao}`,
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: `❌ Resposta incorreta.\n\n${QUIZ_CONFIG.explicacao}`,
            });
        }

        await sendMessage(sender, 'send-message', {
            message: '🎓 Treinamento concluído com sucesso!\n\nVamos gerar seu certificado...',
        });

        await contato.update({ statusTreinamento: 'concluído' });

        const nomeCompleto = contato.nomeCompleto || contato.nome;
        const emailCadastrado = contato.email;

        if (!nomeCompleto || !emailCadastrado) {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ Para gerar o certificado, preciso confirmar seus dados.',
            });
            return true;
        }

        const confirmacaoMsg = {
            title: '',
            description: `🎓 *Confirmação dos dados para o certificado:*\n\n👤 *Nome:* ${nomeCompleto}\n📧 *E-mail:* ${emailCadastrado}\n\nOs dados estão corretos?`,
            buttonText: 'Confirmar',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'dados_corretos_cipa', title: 'Sim, os dados estão corretos', description: '' },
                    { id: 'dados_incorretos_cipa', title: 'Não, preciso corrigir', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', confirmacaoMsg);
        await salvarInteracao(sender, 'confirmacao_dados_cipa', JSON.stringify(confirmacaoMsg));
        return true;
    }

    // Confirmação de dados
    if (selectedId === 'dados_corretos_cipa' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_cipa' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados! Gerando seu certificado...',
        });
        await gerarEEnviarCertificadoCipa(contato, sender);
        return true;
    }

    if (selectedId === 'dados_incorretos_cipa') {
        await sendMessage(sender, 'send-message', {
            message: '📝 Para corrigir seus dados, por favor, entre em contato com o suporte.',
        });
        return true;
    }

    return false;
}

/**
 * Gera e envia certificado CIPA
 */
async function gerarEEnviarCertificadoCipa(contato, sender) {
    try {
        await sendMessage(sender, 'send-message', {
            message: '📧 Gerando seu certificado...',
        });

        const certificadoPath = await gerarCertificadoBanco(contato.id);
        const treinamento = await Treinamento.findOne({
            where: { nome: 'CURSO DE FORMAÇÃO DE MEMBROS DE CIPA' }
        });
        
        await enviarEmail(contato.email, certificadoPath, treinamento);

        await sendMessage(sender, 'send-message', {
            message: `🎉 Certificado gerado com sucesso!\n\n📧 Enviado para: ${contato.email}`,
        });

        await sendMessage(sender, 'send-file', {
            path: certificadoPath,
            filename: 'Certificado_CIPA.pdf',
            caption: '🎓 Seu certificado de conclusão do Curso de Formação de Membros de CIPA'
        });

    } catch (error) {
        console.error('Erro ao gerar certificado CIPA:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro ao gerar certificado. Entre em contato com o suporte.',
        });
    }
}

module.exports = {
    executarTreinamento,
    processarRespostaTeste
};