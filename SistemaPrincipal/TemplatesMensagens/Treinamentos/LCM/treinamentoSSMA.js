//Script de Treinamento SSMA
//ID do Treinamento: 14

// sendMessage will be passed as parameter to avoid circular dependency
const { Treinamento, Contato } = require('../../../BancoDeDados/models/index.js');
const { Interacao, Empresa } = require('../../../BancoDeDados/models/index.js');
const { gerarCertificadoBanco, enviarEmail } = require('../../Certificados/certificados2.js');
const { Op } = require('sequelize');

// Respostas aceitas para verificação - EXPANDIDAS
const RESPOSTAS_POSITIVAS = ['sim', 'vamos', 'pode mandar', 'começar', 'iniciar', 'pronto', 'ok', 'vamos nessa', 'vamos começar', 'sim - vamos começar', 'confirmar', 'dados corretos', 'estou pronto', 'bora', 'beleza', 'certo', 'perfeito'];
const RESPOSTAS_NEGATIVAS = ['não', 'nao', 'ainda não', 'ainda nao', 'depois', 'mais tarde', 'preciso me preparar', 'dados incorretos', 'corrigir', 'cancelar', 'parar', 'sair'];

// Função universal para verificar respostas
function verificarRespostaSSMA(texto, tipo = 'positiva') {
    const textoLimpo = texto.toLowerCase().trim();
    const respostas = tipo === 'positiva' ? RESPOSTAS_POSITIVAS : RESPOSTAS_NEGATIVAS;
    
    return respostas.some(resposta => 
        textoLimpo.includes(resposta) || 
        textoLimpo === resposta ||
        textoLimpo.startsWith(resposta) ||
        textoLimpo.endsWith(resposta)
    );
}

// Configurações do quiz Módulo 1 (SSMA + Acidentes - 8 questões)
const QUIZ_CONFIG = {
    perguntas: [
        {
            pergunta: '1. O que significa SSMA?',
            alternativas: {
                a: 'Sistema de Segurança e Meio Ambiente',
                b: 'Saúde, Segurança e Meio Ambiente',
                c: 'Serviço de Segurança e Medicina Ambiental',
                d: 'Setor de Segurança e Medicina do Trabalho'
            },
            respostaCorreta: 'b',
            explicacao: 'SSMA significa Saúde, Segurança e Meio Ambiente!'
        },
        {
            pergunta: '2. Verdadeiro ou Falso: A responsabilidade pela segurança pode ser transferida para outra pessoa.',
            alternativas: {
                a: 'Verdadeiro - pode ser transferida',
                b: 'Falso - A responsabilidade é intransferível',
                c: 'Verdadeiro - apenas para supervisores',
                d: 'Falso - apenas em emergências'
            },
            respostaCorreta: 'b',
            explicacao: 'Falso - A responsabilidade pela segurança é intransferível!'
        },
        {
            pergunta: '3. Qual é o objetivo principal da SST?',
            alternativas: {
                a: 'Apenas evitar multas',
                b: 'Proteger a integridade do trabalhador',
                c: 'Reduzir custos',
                d: 'Agradar fiscais'
            },
            respostaCorreta: 'b',
            explicacao: 'O objetivo principal da SST é proteger a integridade do trabalhador!'
        },
        {
            pergunta: '4. Complete a premissa: "A Segurança é _____"',
            alternativas: {
                a: 'opcional',
                b: 'negociável',
                c: 'imprescindível',
                d: 'relativa'
            },
            respostaCorreta: 'c',
            explicacao: 'A Segurança é IMPRESCINDÍVEL - não é opcional!'
        },
        {
            pergunta: '5. Uma ferramenta cai ao lado de um trabalhador, sem atingi-lo. Isso é:',
            alternativas: {
                a: 'Acidente pessoal',
                b: 'Acidente material',
                c: 'Quase acidente',
                d: 'Não é acidente'
            },
            respostaCorreta: 'c',
            explicacao: 'É um quase acidente - evento que poderia ter causado lesão mas não causou.'
        },
        {
            pergunta: '6. Verdadeiro ou Falso: Acidente de trajeto só conta se acontecer indo para o trabalho.',
            alternativas: {
                a: 'Verdadeiro - só na ida',
                b: 'Falso - vale para ida E volta',
                c: 'Verdadeiro - só na volta',
                d: 'Falso - não existe acidente de trajeto'
            },
            respostaCorreta: 'b',
            explicacao: 'Falso - Acidente de trajeto vale tanto na ida quanto na volta do trabalho!'
        },
        {
            pergunta: '7. Todo acidente deve ser comunicado:',
            alternativas: {
                a: 'Apenas se houver ferimento',
                b: 'Só os graves',
                c: 'Imediatamente ao SESMT',
                d: 'Apenas no final do dia'
            },
            respostaCorreta: 'c',
            explicacao: 'Todo acidente deve ser comunicado imediatamente ao SESMT!'
        },
        {
            pergunta: '8. Um vazamento de óleo que contamina o solo é um acidente:',
            alternativas: {
                a: 'Pessoal',
                b: 'Material',
                c: 'Ambiental',
                d: 'De trajeto'
            },
            respostaCorreta: 'c',
            explicacao: 'É um acidente ambiental pois causa danos ao meio ambiente!'
        }
    ]
};

// Configurações do quiz Módulo 2 (Programas de Saúde e Segurança + EPI/EPC)
const QUIZ_MODULO2_CONFIG = {
    perguntas: [
        {
            pergunta: '1. O PCMSO é o Programa de Controle Médico e Saúde Ocupacional. Qual exame deve ser realizado na contratação?',
            alternativas: {
                a: 'Exame periódico',
                b: 'Exame admissional',
                c: 'Exame demissional',
                d: 'Exame de retorno ao trabalho'
            },
            respostaCorreta: 'b',
            explicacao: 'O exame admissional deve ser realizado na contratação do colaborador.'
        },
        {
            pergunta: '2. Qual a diferença entre EPC e EPI?',
            alternativas: {
                a: 'EPC é individual, EPI é coletivo',
                b: 'EPC protege todos, EPI é uso pessoal',
                c: 'Não há diferença entre eles',
                d: 'EPI tem prioridade sobre EPC'
            },
            respostaCorreta: 'b',
            explicacao: 'EPC (Equipamento de Proteção Coletiva) protege todos, EPI (Equipamento de Proteção Individual) é de uso pessoal.'
        },
        {
            pergunta: '3. Qual filtro respiratório deve ser usado para fumos e agentes biológicos?',
            alternativas: {
                a: 'PFF1',
                b: 'PFF2',
                c: 'PFF3',
                d: 'Qualquer um serve'
            },
            respostaCorreta: 'b',
            explicacao: 'O filtro PFF2 é indicado para fumos e agentes biológicos.'
        },
        {
            pergunta: '4. Sobre trabalho em altura, é correto afirmar:',
            alternativas: {
                a: 'É considerado acima de 1 metro',
                b: 'É considerado acima de 2 metros',
                c: 'É considerado acima de 3 metros',
                d: 'Não há altura mínima definida'
            },
            respostaCorreta: 'b',
            explicacao: 'Trabalho em altura é considerado acima de 2 metros.'
        },
        {
            pergunta: '5. Qual dos pensamentos abaixo é considerado perigoso para a segurança?',
            alternativas: {
                a: '"Vou usar todos os EPIs necessários"',
                b: '"Preciso seguir os procedimentos"',
                c: '"Nunca vai acontecer comigo"',
                d: '"Segurança em primeiro lugar"'
            },
            respostaCorreta: 'c',
            explicacao: '"Nunca vai acontecer comigo" é um dos 4 pensamentos perigosos que devemos evitar.'
        },
        {
            pergunta: '6. Sobre a perda auditiva, é correto afirmar:',
            alternativas: {
                a: 'É reversível com tratamento',
                b: 'É irreversível',
                c: 'Só acontece com ruído muito alto',
                d: 'Pode ser curada com cirurgia'
            },
            respostaCorreta: 'b',
            explicacao: 'A perda auditiva é irreversível, por isso a proteção auditiva é fundamental.'
        }
    ]
};

// Funções auxiliares locais (evitar dependência circular)
async function salvarInteracao(sender, tipo, dados) {
    try {
        await Interacao.create({
            telefone: sender,
            tipo: tipo,
            mensagem: dados || '',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Erro ao salvar interação:', error);
    }
}

async function obterUltimaInteracao(sender) {
    try {
        return await Interacao.findOne({
            where: { telefone: sender },
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.error('Erro ao obter última interação:', error);
        return null;
    }
}

/**
 * Executa o treinamento SSMA
 */
async function executarTreinamento(sender, contato, sendMessage) {
    const treinamento = await Treinamento.findByPk(14);

    if (!treinamento) {
        await sendMessage(sender, 'send-message', {
            message: '❌ Treinamento não encontrado.',
        });
        return;
    }

    await sendMessage(sender, 'send-message', {
        message: `Seja bem-vindo(a) ao treinamento: ${treinamento.nome}! 💼`,
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    await sendMessage(sender, 'send-message', {
        message: '🎯 *OBJETIVOS DO TREINAMENTO*\n\n📋 *Objetivo Geral:*\nCapacitar os colaboradores nos princípios básicos de SSMA, desenvolvendo consciência sobre segurança, saúde e meio ambiente.\n\n🎯 *Objetivos Específicos:*\n• Conhecer os conceitos de SSMA\n• Identificar tipos de acidentes\n• Compreender programas de segurança\n• Utilizar EPIs corretamente',
    });

    const iniciarMsg = {
        title: '',
        description: '📚 Você está pronto para começar o treinamento?',
        buttonText: 'Escolher opção',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'iniciar_ssma', title: 'SIM - Vamos começar! 🚀', description: '' },
                { id: 'nao_iniciar_ssma', title: 'NÃO - Preciso me preparar 📖', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', iniciarMsg);
    await salvarInteracao(sender, 'aguardando_confirmacao', 'treinamento_ssma');
}

/**
 * Processa resposta do usuário durante o treinamento
 */
async function processarResposta(sender, message, sendMessage) {
    const ultimaInteracao = await obterUltimaInteracao(sender);
    if (!ultimaInteracao) return false;

    const mensagem = message.toLowerCase().trim();

    // Aguardando confirmação para iniciar
    if (ultimaInteracao.tipo === 'aguardando_confirmacao') {
        if (RESPOSTAS_POSITIVAS.some(resp => mensagem.includes(resp)) || mensagem.includes('iniciar_ssma')) {
            await iniciarModulo1(sender, sendMessage);
            return true;
        }
        if (RESPOSTAS_NEGATIVAS.some(resp => mensagem.includes(resp)) || mensagem.includes('nao_iniciar_ssma')) {
            await sendMessage(sender, 'send-message', {
                message: '⏰ Sem problemas! Quando estiver pronto, digite *SSMA* para retomar o treinamento.',
            });
            return true;
        }
    }

    // Processando quiz módulo 1
    if (ultimaInteracao.tipo.startsWith('quiz_modulo1_')) {
        return await processarQuizModulo1(sender, mensagem, ultimaInteracao, sendMessage);
    }

    // Processando quiz módulo 2
    if (ultimaInteracao.tipo.startsWith('quiz_modulo2_')) {
        return await processarQuizModulo2(sender, mensagem, ultimaInteracao, sendMessage);
    }

    return false;
}

/**
 * Inicia o Módulo 1 do treinamento
 */
async function iniciarModulo1(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '📖 *MÓDULO 1: CONCEITOS BÁSICOS DE SSMA*\n\nVamos começar com os fundamentos!',
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await enviarPergunta(sender, 0, QUIZ_CONFIG, 'quiz_modulo1', sendMessage);
}

/**
 * Envia uma pergunta do quiz
 */
async function enviarPergunta(sender, indicePergunta, config, tipoQuiz, sendMessage) {
    const pergunta = config.perguntas[indicePergunta];
    
    const mensagem = `${pergunta.pergunta}\n\n` +
        `a) ${pergunta.alternativas.a}\n` +
        `b) ${pergunta.alternativas.b}\n` +
        `c) ${pergunta.alternativas.c}\n` +
        `d) ${pergunta.alternativas.d}\n\n` +
        `Responda com a letra da alternativa (a, b, c ou d):`;

    await sendMessage(sender, 'send-message', { message: mensagem });
    await salvarInteracao(sender, `${tipoQuiz}_pergunta_${indicePergunta}`, JSON.stringify({ acertos: 0, perguntaAtual: indicePergunta }));
}

/**
 * Processa resposta do quiz módulo 1
 */
async function processarQuizModulo1(sender, resposta, ultimaInteracao, sendMessage) {
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const perguntaAtual = dados.perguntaAtual || 0;
    const acertos = dados.acertos || 0;
    
    const pergunta = QUIZ_CONFIG.perguntas[perguntaAtual];
    const respostaCorreta = resposta === pergunta.respostaCorreta;
    
    // Feedback da resposta
    await sendMessage(sender, 'send-message', {
        message: respostaCorreta ? `✅ Correto! ${pergunta.explicacao}` : `❌ Incorreto. ${pergunta.explicacao}`,
    });
    
    const novosAcertos = respostaCorreta ? acertos + 1 : acertos;
    const proximaPergunta = perguntaAtual + 1;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Verifica se terminou o módulo 1
    if (proximaPergunta >= QUIZ_CONFIG.perguntas.length) {
        await finalizarModulo1(sender, novosAcertos, sendMessage);
        return true;
    }
    
    // Próxima pergunta
    await enviarPergunta(sender, proximaPergunta, QUIZ_CONFIG, 'quiz_modulo1', sendMessage);
    return true;
}

/**
 * Finaliza o módulo 1 e inicia módulo 2
 */
async function finalizarModulo1(sender, acertos, sendMessage) {
    const total = QUIZ_CONFIG.perguntas.length;
    const percentual = Math.round((acertos / total) * 100);
    
    await sendMessage(sender, 'send-message', {
        message: `🎯 *MÓDULO 1 CONCLUÍDO!*\n\n📊 Resultado: ${acertos}/${total} (${percentual}%)`,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await sendMessage(sender, 'send-message', {
        message: '📖 *MÓDULO 2: PROGRAMAS DE SEGURANÇA E EPIs*\n\nVamos para a segunda parte!',
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await enviarPergunta(sender, 0, QUIZ_MODULO2_CONFIG, 'quiz_modulo2', sendMessage);
}

/**
 * Processa resposta do quiz módulo 2
 */
async function processarQuizModulo2(sender, resposta, ultimaInteracao, sendMessage) {
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const perguntaAtual = dados.perguntaAtual || 0;
    const acertos = dados.acertos || 0;
    
    const pergunta = QUIZ_MODULO2_CONFIG.perguntas[perguntaAtual];
    const respostaCorreta = resposta === pergunta.respostaCorreta;
    
    await sendMessage(sender, 'send-message', {
        message: respostaCorreta ? `✅ Correto! ${pergunta.explicacao}` : `❌ Incorreto. ${pergunta.explicacao}`,
    });
    
    const novosAcertos = respostaCorreta ? acertos + 1 : acertos;
    const proximaPergunta = perguntaAtual + 1;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (proximaPergunta >= QUIZ_MODULO2_CONFIG.perguntas.length) {
        await finalizarTreinamento(sender, novosAcertos, sendMessage);
        return true;
    }
    
    await enviarPergunta(sender, proximaPergunta, QUIZ_MODULO2_CONFIG, 'quiz_modulo2', sendMessage);
    return true;
}

/**
 * Finaliza o treinamento completo
 */
async function finalizarTreinamento(sender, acertosModulo2, sendMessage) {
    const total = QUIZ_MODULO2_CONFIG.perguntas.length;
    const percentual = Math.round((acertosModulo2 / total) * 100);
    
    await sendMessage(sender, 'send-message', {
        message: `🎉 *TREINAMENTO CONCLUÍDO!*\n\n📊 Módulo 2: ${acertosModulo2}/${total} (${percentual}%)\n\n🏆 Parabéns! Você completou o treinamento de SSMA.`,
    });
    
    // Gerar certificado
    try {
        const contato = await Contato.findOne({ where: { telefone: sender } });
        if (contato) {
            await gerarCertificadoBanco(contato.nome, 'SSMA - Saúde, Segurança e Meio Ambiente', sender);
            await sendMessage(sender, 'send-message', {
                message: '📜 Seu certificado foi gerado e enviado por email!',
            });
        }
    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
    }
    
    await salvarInteracao(sender, 'treinamento_concluido', 'ssma');
}

/**
 * Processa as respostas do treinamento SSMA
 */
async function processarRespostaSSMA(sender, text, selectedId, contato, sendMessage) {
    return await processarResposta(sender, text, sendMessage);
}

/**
 * Processa seleção de treinamentos pendentes
 */
async function processarTreinamentosPendentes(sender, selectedId, contato, sendMessage, text = '') {
    if (selectedId === 'nao_ver_treinamentos') {
        await sendMessage(sender, 'send-message', {
            message: '🙏 Sem problemas! Quando quiser ver seus treinamentos, digite "treinamentos".',
        });
        return true;
    }
    return false;
}

module.exports = {
    executarTreinamento,
    processarResposta,
    processarRespostaSSMA,
    processarTreinamentosPendentes
};

console.log('📝 treinamentoSSMA.js ORIGINAL carregado');