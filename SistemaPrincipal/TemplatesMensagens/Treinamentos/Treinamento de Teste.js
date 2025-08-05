// Script de treinamento: Treinamento de Teste
// ID do treinamento: 39
// Gerado automaticamente em: 04/08/2025, 10:35:32

const { sendMessage } = require('../conexao/wppConnectTemplate');
const Treinamento = require('../../BancoDeDados/models/treinamento');
const { Interacao } = require('../../BancoDeDados/models');
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
    'pronto'
    
];

const RESPOSTAS_NEGATIVAS = [
    'não',
    'não, preciso corrigir',
    'não, os dados não são corretos',
    'os dados não são corretos',
    'dados incorretos',
    'não estão corretos',
    'não começar',
    'depois'
];

// Configurações do quiz
const QUIZ_CONFIG = {
    pergunta: 'Qual das alternativas é uma premissa básica de SST?',
    alternativas: {
        a: 'Só a Empresa é responsável',
        b: 'Segurança é de responsabilidade coletiva',
        c: 'Só os supervisores devem usar EPI',
        d: 'Acidentes não podem ser evitados'
    },
    respostaCorreta: 'b_teste',
    explicacao: 'Segurança é de responsabilidade coletiva!'
};

/**
 * Executa o treinamento: Treinamento de Teste
 */
async function executarTreinamento(sender, contato) {
    const treinamento = await Treinamento.findByPk(39);
    
    if (!treinamento) {
        await sendMessage(sender, 'send-message', {
            message: '❌ Treinamento não encontrado.',
        });
        return;
    }

    await sendMessage(sender, 'send-message', {
        message: `👋 Olá, ${contato.nome}! Seja bem-vindo(a) ao ${treinamento.nome}! 💼`,
    });

    await sendMessage(sender, 'send-message', {
        message: '👷 Objetivos do treinamento:\n\n• Respeitar normas de SSMA\n• Evitar acidentes\n• Cuidar da sua segurança e a dos colegas\n• Nunca realizar tarefas sem capacitação',
    });

    await sendMessage(sender, 'send-file', {
        path: '../../media/SSMA.webp',
        filename: 'SSMA.webp',
        caption: '',
    });

    const listMsg = {
        title: '',
        description: '*Pronto para começar?* \nEscolha uma opção:',
        buttonText: 'Ver opções',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'começar_teste', title: 'Começar agora!! 😎 🔥🔥🔥', description: '' },
                { id: 'não_começar_teste', title: 'Não, começo assim que possível 👀 😅', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarInteracao(sender, 'aguardando_inicio_teste', JSON.stringify(listMsg));
}

/**
 * Processa as respostas do treinamento de teste
 */
async function processarRespostaTeste(sender, text, selectedId, contato) {
    console.log(`📝 [TREINAMENTO TESTE] Processando resposta - text: '${text}', selectedId: '${selectedId}'`);
    const ultimaInteracao = await obterUltimaInteracao(sender);
    console.log(`📝 [TREINAMENTO TESTE] Última interação:`, ultimaInteracao?.tipo);
    
    const textLower = text.toLowerCase();
    console.log(`🔍 [DEBUG] textLower: '${textLower}'`);
    console.log(`🔍 [DEBUG] ultimaInteracao.tipo: '${ultimaInteracao?.tipo}'`);
    
    // PRIMEIRO: Confirmação de dados - por selectedId OU por texto
    if (selectedId === 'dados_corretos_teste' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_teste' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase()))) ||
        (contato.statusTreinamento === 'concluído' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        console.log(`✅ Confirmando dados para certificado`);
        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados! Gerando seu certificado...',
        });
        await gerarEEnviarCertificadoTeste(contato, sender);
        return true;
    }
    
    // Dados incorretos
    if (selectedId === 'dados_incorretos_teste' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_teste' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase()))) ||
        (contato.statusTreinamento === 'concluído' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        console.log(`❌ Dados incorretos, solicitando correção`);
        await sendMessage(sender, 'send-message', {
            message: '📝 Para corrigir seus dados, por favor, entre em contato com o suporte.',
        });
        return true;
    }
    
    // SEGUNDO: Início do treinamento - detectar por selectedId OU por texto
    const contemComecaAgora = textLower.includes('começar agora');
    const contemRespositaPositiva = RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase()));
    
    console.log(`🔍 [DEBUG] contemComecaAgora: ${contemComecaAgora}`);
    console.log(`🔍 [DEBUG] contemRespositaPositiva: ${contemRespositaPositiva}`);
    
    if ((selectedId === 'começar_teste' || selectedId === 'pronto_teste' || contemComecaAgora) ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_teste' && contemRespositaPositiva)) {
        console.log(`✅ [TREINAMENTO TESTE] Iniciando treinamento com selectedId: '${selectedId}' ou text: '${text}'`);
        await sendMessage(sender, 'send-message', {
            message: '🚀 Vamos começar o treinamento de SSMA! Prepare-se! 🔥🔥🔥',
        });

        await sendMessage(sender, 'send-message', {
            message: `✅ Módulo 1️ - 📚 *Conceitos Fundamentais* \n\n1️⃣ Segurança e Saúde no Trabalho (SST) \nConjunto de medidas para prevenir doenças e acidentes no trabalho. \n\n2️⃣ Premissas básicas de SST \n• Segurança é responsabilidade de todos \n• A consciência previne acidentes\n• Quem descumpre normas, se coloca em risco`,
        });

        await sendMessage(sender, 'send-message', {
            message: '*Para continuar, digite o número 1️⃣*',
        });

        await salvarInteracao(sender, 'aguardando_numero_teste', '*Para continuar, digite o número 1️⃣*');
        return true;
    }

    // Não começar agora - detectar por selectedId OU por texto
    if (selectedId === 'não_começar_teste' || text.toLowerCase().includes('não') || 
        text.toLowerCase().includes('depois') || RESPOSTAS_NEGATIVAS.includes(text.toLowerCase())) {
        console.log(`⏸️ Adiando treinamento com selectedId: '${selectedId}' ou text: '${text}'`);
        const listMsg = {
            title: '',
            description: 'Escolha uma opção:',
            buttonText: 'Estou pronto(a)',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [{ id: 'pronto_teste', title: 'Começar agora!! 😎 🔥🔥🔥', description: '' }],
            }],
        };

        await sendMessage(sender, 'send-message', {
            message: '😅 Sem problemas! Quando estiver pronto, é só avisar. Estamos aqui para ajudar! 👷‍♂️👷‍♀️',
        });
        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_inicio_teste', JSON.stringify(listMsg));
        return true;
    }

    // Continuar para o quiz
    console.log(`🔍 [DEBUG] Verificando número 1 - text: '${text}', ultimaInteracao.tipo: '${ultimaInteracao?.tipo}'`);
    if (text === '1' && ultimaInteracao?.tipo === 'aguardando_numero_teste') {
        console.log(`➡️ Continuando para o quiz`);
        await sendMessage(sender, 'send-message', {
            message: 'Vamos continuar!🚀🚀🚀 \n\nPra esquentar as coisas, vamos fazer um pequeno quiz! 😜 🔥🔥🔥',
        });

        const quizList = {
            title: '',
            description: `${QUIZ_CONFIG.pergunta}\n\nA) ${QUIZ_CONFIG.alternativas.a}\n\nB) ${QUIZ_CONFIG.alternativas.b}\n\nC) ${QUIZ_CONFIG.alternativas.c}\n\nD) ${QUIZ_CONFIG.alternativas.d}`,
            buttonText: 'Responder',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_teste', title: 'A', description: '' },
                    { id: 'b_teste', title: 'B', description: '' },
                    { id: 'c_teste', title: 'C', description: '' },
                    { id: 'd_teste', title: 'D', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizList);
        await salvarInteracao(sender, 'quiz_teste', JSON.stringify(quizList));
        return true;
    }

    // Processar respostas do quiz - por selectedId OU por texto
    const respostasQuiz = ['a_teste', 'b_teste', 'c_teste', 'd_teste'];
    const respostasTexto = ['a', 'b', 'c', 'd'];
    
    if (respostasQuiz.includes(selectedId) || respostasTexto.includes(textLower)) {
        let respostaProcessada;
        
        if (selectedId && respostasQuiz.includes(selectedId)) {
            respostaProcessada = selectedId;
            console.log(`🧠 Processando resposta do quiz por selectedId: ${selectedId}`);
        } else if (respostasTexto.includes(textLower)) {
            respostaProcessada = textLower + '_teste';
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
            message: '🎉 Parabéns, você completou o Módulo 1!'
        });

        await sendMessage(sender, 'send-sticker-gif', {
            path: '../../media/palmas.gif',
            filename: 'palmas.gif',
            //caption: '👏 Parabéns!'
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
                    { id: 'dados_corretos_teste', title: 'Sim, os dados estão corretos', description: '' },
                    { id: 'dados_incorretos_teste', title: 'Não, preciso corrigir', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', confirmacaoList);
        await salvarInteracao(sender, 'confirmacao_dados_teste', JSON.stringify(confirmacaoList));
        await contato.update({ statusTreinamento: 'concluído' });
        return true;
    }



    // Se chegou até aqui e é o número 1, pode ser que a interação não foi salva corretamente
    if (text === '1') {
        console.log(`🔄 [TREINAMENTO TESTE] Detectou número 1, forçando continuação para o quiz`);
        await sendMessage(sender, 'send-message', {
            message: 'Vamos continuar!🚀🚀🚀 \n\nPra esquentar as coisas, vamos fazer um pequeno quiz! 😜 🔥🔥🔥',
        });

        const quizList = {
            title: '',
            description: `${QUIZ_CONFIG.pergunta}\n\nA) ${QUIZ_CONFIG.alternativas.a}\n\nB) ${QUIZ_CONFIG.alternativas.b}\n\nC) ${QUIZ_CONFIG.alternativas.c}\n\nD) ${QUIZ_CONFIG.alternativas.d}`,
            buttonText: 'Responder',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_teste', title: 'A', description: '' },
                    { id: 'b_teste', title: 'B', description: '' },
                    { id: 'c_teste', title: 'C', description: '' },
                    { id: 'd_teste', title: 'D', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizList);
        await salvarInteracao(sender, 'quiz_teste', JSON.stringify(quizList));
        return true;
    }
    
    console.log(`❌ [TREINAMENTO TESTE] Nenhuma condição atendida para selectedId: '${selectedId}' e text: '${text}'`);
    return false;
}

/**
 * Gera e envia certificado do Treinamento de Teste
 */
async function gerarEEnviarCertificadoTeste(contato, sender) {
    try {
        console.log('📝 Gerando certificado para:', contato.nomeCompleto || contato.nome);
        const certificadoPath = await gerarCertificadoBanco(contato.id);
        
        console.log('📧 Enviando e-mail para:', contato.email);
        const treinamento = await Treinamento.findByPk(39);
        await enviarEmail(contato.email, certificadoPath, treinamento);

        await sendMessage(sender, 'send-message', {
            message: `🎉 Seu certificado foi gerado com sucesso! \n\n📧 Ele foi enviado para: ${contato.email}\n\n📄 Também está disponível aqui:`,
        });

        await sendMessage(sender, 'send-file', {
            path: certificadoPath,
            filename: 'Certificado_Treinamento_de_Teste.pdf',
            caption: '🎓 Seu certificado de conclusão do Treinamento de Teste'
        });

        const finalizarList = {
            title: '',
            description: 'Clique na opção abaixo para finalizar seu treinamento:',
            buttonText: 'Finalizar',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'finalizar_treinamento_teste', title: '✅ Treinamento finalizado', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', finalizarList);
        await salvarInteracao(sender, 'finalizacao_teste', JSON.stringify(finalizarList));

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
