// Script de treinamento: Treinamento de Teste2
// ID do treinamento: 38
// Gerado automaticamente em: 05/08/2025, 11:40:00

const { sendMessage } = require('../conexao/wppConnectTemplate');
const Treinamento = require('../../BancoDeDados/models/treinamento');
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
    pergunta: 'Qual é o principal objetivo da prevenção de acidentes no trabalho?',
    alternativas: {
        a: 'Reduzir custos da empresa',
        b: 'Proteger a vida e saúde dos trabalhadores',
        c: 'Cumprir apenas as leis trabalhistas',
        d: 'Evitar multas dos órgãos fiscalizadores'
    },
    respostaCorreta: 'b_teste2',
    explicacao: 'O principal objetivo é proteger a vida e saúde dos trabalhadores!'
};

/**
 * Executa o treinamento: Treinamento de Teste2
 */
async function executarTreinamento(sender, contato) {
    const treinamento = await Treinamento.findByPk(38);
    
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
        message: '🛡️ Objetivos do treinamento:\n\n• Conhecer os princípios de prevenção\n• Identificar riscos no ambiente de trabalho\n• Aplicar medidas preventivas\n• Desenvolver consciência de segurança',
    });

    await sendMessage(sender, 'send-file', {
        path: '../../media/SSMA.webp',
        filename: 'SSMA.webp',
        caption: '',
    });

    const listMsg = {
        title: '',
        description: '*Está preparado para iniciar?* \nSelecione uma opção:',
        buttonText: 'Escolher',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'começar_teste2', title: 'Vamos lá! 🚀 💪', description: '' },
                { id: 'não_começar_teste2', title: 'Preciso me preparar melhor 🤔', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarInteracao(sender, 'aguardando_inicio_teste2', JSON.stringify(listMsg));
}

/**
 * Processa as respostas do treinamento de teste2
 */
async function processarRespostaTeste(sender, text, selectedId, contato) {
    console.log(`📝 [TREINAMENTO TESTE2] Processando resposta - text: '${text}', selectedId: '${selectedId}'`);
    const ultimaInteracao = await obterUltimaInteracao(sender);
    console.log(`📝 [TREINAMENTO TESTE2] Última interação:`, ultimaInteracao?.tipo);
    
    const textLower = text.toLowerCase();
    console.log(`🔍 [DEBUG] textLower: '${textLower}'`);
    console.log(`🔍 [DEBUG] ultimaInteracao.tipo: '${ultimaInteracao?.tipo}'`);
    
    // PRIMEIRO: Confirmação de dados - por selectedId OU por texto
    if (selectedId === 'dados_corretos_teste2' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_teste2' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase()))) ||
        (contato.statusTreinamento === 'concluído' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        console.log(`✅ Confirmando dados para certificado`);
        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados! Gerando seu certificado...',
        });
        await gerarEEnviarCertificadoTeste2(contato, sender);
        return true;
    }
    
    // Dados incorretos
    if (selectedId === 'dados_incorretos_teste2' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_teste2' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase()))) ||
        (contato.statusTreinamento === 'concluído' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        console.log(`❌ Dados incorretos, solicitando correção`);
        await sendMessage(sender, 'send-message', {
            message: '📝 Para corrigir seus dados, por favor, entre em contato com o suporte.',
        });
        return true;
    }
    
    // SEGUNDO: Início do treinamento - detectar por selectedId OU por texto
    const contemComecaAgora = textLower.includes('vamos lá') || textLower.includes('começar');
    const contemRespositaPositiva = RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase()));
    
    console.log(`🔍 [DEBUG] contemComecaAgora: ${contemComecaAgora}`);
    console.log(`🔍 [DEBUG] contemRespositaPositiva: ${contemRespositaPositiva}`);
    
    if ((selectedId === 'começar_teste2' || selectedId === 'pronto_teste2' || contemComecaAgora) ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_teste2' && contemRespositaPositiva)) {
        console.log(`✅ [TREINAMENTO TESTE2] Iniciando treinamento com selectedId: '${selectedId}' ou text: '${text}'`);
        await sendMessage(sender, 'send-message', {
            message: '🎯 Excelente! Vamos iniciar o treinamento de Prevenção de Acidentes! 💪',
        });

        await sendMessage(sender, 'send-message', {
            message: `📋 Módulo 1️ - 🛡️ *Fundamentos da Prevenção* \n\n🔸 Cultura de Segurança \nDesenvolver mentalidade preventiva em todas as atividades. \n\n🔸 Identificação de Riscos \n• Reconhecer perigos no ambiente \n• Avaliar probabilidade de acidentes\n• Implementar medidas de controle`,
        });

        await sendMessage(sender, 'send-message', {
            message: '*Para prosseguir, digite o número 2️⃣*',
        });

        await salvarInteracao(sender, 'aguardando_numero_teste2', '*Para prosseguir, digite o número 2️⃣*');
        return true;
    }

    // Não começar agora - detectar por selectedId OU por texto
    if (selectedId === 'não_começar_teste2' || textLower.includes('preciso me preparar') || 
        textLower.includes('depois') || RESPOSTAS_NEGATIVAS.includes(textLower)) {
        console.log(`⏸️ Adiando treinamento com selectedId: '${selectedId}' ou text: '${text}'`);
        const listMsg = {
            title: '',
            description: 'Quando estiver pronto:',
            buttonText: 'Estou preparado',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [{ id: 'pronto_teste2', title: 'Vamos lá! 🚀 💪', description: '' }],
            }],
        };

        await sendMessage(sender, 'send-message', {
            message: '👍 Sem pressa! Quando se sentir preparado, é só me avisar. Estaremos aqui! 🤝',
        });
        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_inicio_teste2', JSON.stringify(listMsg));
        return true;
    }

    // Continuar para o quiz
    console.log(`🔍 [DEBUG] Verificando número 2 - text: '${text}', ultimaInteracao.tipo: '${ultimaInteracao?.tipo}'`);
    if (text === '2' && ultimaInteracao?.tipo === 'aguardando_numero_teste2') {
        console.log(`➡️ Continuando para o quiz`);
        await sendMessage(sender, 'send-message', {
            message: 'Perfeito!🎯🎯🎯 \n\nAgora vamos testar seus conhecimentos! 🧠 💡',
        });

        const quizList = {
            title: '',
            description: `${QUIZ_CONFIG.pergunta}\n\nA) ${QUIZ_CONFIG.alternativas.a}\n\nB) ${QUIZ_CONFIG.alternativas.b}\n\nC) ${QUIZ_CONFIG.alternativas.c}\n\nD) ${QUIZ_CONFIG.alternativas.d}`,
            buttonText: 'Responder',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_teste2', title: 'A', description: '' },
                    { id: 'b_teste2', title: 'B', description: '' },
                    { id: 'c_teste2', title: 'C', description: '' },
                    { id: 'd_teste2', title: 'D', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizList);
        await salvarInteracao(sender, 'quiz_teste2', JSON.stringify(quizList));
        return true;
    }

    // Processar respostas do quiz - por selectedId OU por texto
    const respostasQuiz = ['a_teste2', 'b_teste2', 'c_teste2', 'd_teste2'];
    const respostasTexto = ['a', 'b', 'c', 'd'];
    
    if (respostasQuiz.includes(selectedId) || respostasTexto.includes(textLower)) {
        let respostaProcessada;
        
        if (selectedId && respostasQuiz.includes(selectedId)) {
            respostaProcessada = selectedId;
            console.log(`🧠 Processando resposta do quiz por selectedId: ${selectedId}`);
        } else if (respostasTexto.includes(textLower)) {
            respostaProcessada = textLower + '_teste2';
            console.log(`🧠 Processando resposta do quiz por texto: ${textLower} -> ${respostaProcessada}`);
        }
        
        if (respostaProcessada !== QUIZ_CONFIG.respostaCorreta) {
            await sendMessage(sender, 'send-message', {
                message: `❌ Resposta incorreta! A resposta correta é B) ${QUIZ_CONFIG.alternativas.b}.`,
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: `✅ Resposta correta! ${QUIZ_CONFIG.explicacao}`,
            });
        }

        await sendMessage(sender, 'send-message', {
            message: '🏆 Parabéns, você concluiu o Módulo de Prevenção!'
        });

        await sendMessage(sender, 'send-sticker-gif', {
            path: '../../media/palmas.gif',
            filename: 'palmas.gif',
        });

        // Confirmação de dados para certificado
        const nomeCompleto = contato.nomeCompleto || contato.nome || 'Nome não informado';
        const emailCadastrado = contato.email || 'E-mail não informado';
        
        const confirmacaoList = {
            title: '',
            description: `🎓 *Confirmação dos dados para o certificado:*\n\n👤 *Nome:* ${nomeCompleto}\n📧 *E-mail:* ${emailCadastrado}\n\nOs dados estão corretos?`,
            buttonText: 'Confirmar',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'dados_corretos_teste2', title: 'Sim, os dados estão corretos', description: '' },
                    { id: 'dados_incorretos_teste2', title: 'Não, preciso corrigir', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', confirmacaoList);
        await salvarInteracao(sender, 'confirmacao_dados_teste2', JSON.stringify(confirmacaoList));
        await contato.update({ statusTreinamento: 'concluído' });
        return true;
    }

    // Se chegou até aqui e é o número 2, pode ser que a interação não foi salva corretamente
    if (text === '2') {
        console.log(`🔄 [TREINAMENTO TESTE2] Detectou número 2, forçando continuação para o quiz`);
        await sendMessage(sender, 'send-message', {
            message: 'Perfeito!🎯🎯🎯 \n\nAgora vamos testar seus conhecimentos! 🧠 💡',
        });

        const quizList = {
            title: '',
            description: `${QUIZ_CONFIG.pergunta}\n\nA) ${QUIZ_CONFIG.alternativas.a}\n\nB) ${QUIZ_CONFIG.alternativas.b}\n\nC) ${QUIZ_CONFIG.alternativas.c}\n\nD) ${QUIZ_CONFIG.alternativas.d}`,
            buttonText: 'Responder',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_teste2', title: 'A', description: '' },
                    { id: 'b_teste2', title: 'B', description: '' },
                    { id: 'c_teste2', title: 'C', description: '' },
                    { id: 'd_teste2', title: 'D', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizList);
        await salvarInteracao(sender, 'quiz_teste2', JSON.stringify(quizList));
        return true;
    }
    
    console.log(`❌ [TREINAMENTO TESTE2] Nenhuma condição atendida para selectedId: '${selectedId}' e text: '${text}'`);
    return false;
}

/**
 * Gera e envia certificado do Treinamento de Teste2
 */
async function gerarEEnviarCertificadoTeste2(contato, sender) {
    try {
        console.log('📝 Gerando certificado para:', contato.nomeCompleto || contato.nome);
        const certificadoPath = await gerarCertificadoBanco(contato.id);
        
        console.log('📧 Enviando e-mail para:', contato.email);
        const treinamento = await Treinamento.findByPk(38);
        await enviarEmail(contato.email, certificadoPath, treinamento);

        await sendMessage(sender, 'send-message', {
            message: `🎉 Seu certificado foi gerado com sucesso! \n\n📧 Ele foi enviado para: ${contato.email}\n\n📄 Também está disponível aqui:`,
        });

        await sendMessage(sender, 'send-file', {
            path: certificadoPath,
            filename: 'Certificado_Treinamento_de_Teste2.pdf',
            caption: '🎓 Seu certificado de conclusão do Treinamento de Prevenção'
        });

        const finalizarList = {
            title: '',
            description: 'Clique na opção abaixo para finalizar seu treinamento:',
            buttonText: 'Finalizar',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'finalizar_treinamento_teste2', title: '✅ Treinamento finalizado', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', finalizarList);
        await salvarInteracao(sender, 'finalizacao_teste2', JSON.stringify(finalizarList));

    } catch (err) {
        console.error('❌ Erro ao gerar certificado:', err);
        await sendMessage(sender, 'send-message', {
            message: `❌ Ocorreu um erro ao gerar seu certificado:\n\n${err.message}\n\nPor favor, entre em contato com o suporte.`,
        });
    }
}

/**
 * Agenda lembrete para o usuário
 */
function agendarLembrete(sender, mensagemLista, tempoMs = TEMPO_LEMBRETE) {
    // Implementação específica do treinamento se necessário
}

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

module.exports = { executarTreinamento, processarRespostaTeste };