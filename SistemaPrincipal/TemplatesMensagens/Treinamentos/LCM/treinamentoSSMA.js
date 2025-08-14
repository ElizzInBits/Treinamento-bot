//Script de Treinamento SSMA
//ID do Treinamento: 14

// sendMessage will be passed as parameter to avoid circular dependency
const { Treinamento } = require('../../../BancoDeDados/models');
const { Interacao, Empresa } = require('../../../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('../../Certificados/certificados2.js');



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
    'pode mandar',
    'pode mandar!!',
    'Vamos nessa',
    'Vamos nessa 😝😼🔥',
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
    'Ainda não, preciso me preparar um pouco',
    'Ainda não, preciso me preparar um pouco 😅👀🛌'
];

// Configurações do quiz Módulo 1
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
        }
    ]
};

// Configurações do quiz Módulo 2
const QUIZ_MODULO2_CONFIG = {
    perguntas: [
        {
            pergunta: '1. Uma ferramenta cai ao lado de um trabalhador, sem atingi-lo. Isso é:',
            alternativas: {
                a: 'Acidente pessoal',
                b: 'Acidente material',
                c: 'Quase acidente',
                d: 'Não é acidente'
            },
            respostaCorreta: 'c',
            explicacao: 'Correto! É um quase acidente - evento que poderia ter causado lesão mas não causou.'
        },
        {
            pergunta: '2. Verdadeiro ou Falso: Acidente de trajeto só conta se acontecer indo para o trabalho.',
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
            pergunta: '3. Todo acidente deve ser comunicado:',
            alternativas: {
                a: 'Apenas se houver ferimento',
                b: 'Só os graves',
                c: 'Imediatamente ao SESMT',
                d: 'Apenas no final do dia'
            },
            respostaCorreta: 'c',
            explicacao: 'Correto! Todo acidente deve ser comunicado imediatamente ao SESMT!'
        },
        {
            pergunta: '4. Um vazamento de óleo que contamina o solo é um acidente:',
            alternativas: {
                a: 'Pessoal',
                b: 'Material',
                c: 'Ambiental',
                d: 'De trajeto'
            },
            respostaCorreta: 'c',
            explicacao: 'Correto! É um acidente ambiental pois causa danos ao meio ambiente!'
        }
    ]
};

// Configurações do quiz Módulo 3
const QUIZ_MODULO3_CONFIG = {
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
            explicacao: 'Correto! O exame admissional deve ser realizado na contratação do colaborador.'
        },
        {
            pergunta: '2. Com que frequência deve ser realizado o exame periódico?',
            alternativas: {
                a: 'A cada 6 meses',
                b: 'A cada 12 meses',
                c: 'A cada 18 meses',
                d: 'A cada 24 meses'
            },
            respostaCorreta: 'b',
            explicacao: 'Correto! O exame periódico deve ser realizado a cada 12 meses.'
        },
        {
            pergunta: '3. Sobre os treinamentos de saúde e segurança, é correto afirmar:',
            alternativas: {
                a: 'São opcionais para colaboradores experientes',
                b: 'Podem ser realizados apenas verbalmente',
                c: 'Nenhum colaborador pode trabalhar sem estar devidamente treinado',
                d: 'São necessários apenas para atividades de risco'
            },
            respostaCorreta: 'c',
            explicacao: 'Correto! Nenhum colaborador poderá desenvolver suas atividades sem estar devidamente treinado.'
        },
        {
            pergunta: '4. O que deve acompanhar todo treinamento realizado?',
            alternativas: {
                a: 'Apenas a presença do supervisor',
                b: 'Certificado e/ou Lista de Presença assinada',
                c: 'Apenas avaliação teórica',
                d: 'Somente registro fotográfico'
            },
            respostaCorreta: 'b',
            explicacao: 'Correto! Todo treinamento deve ser acompanhado de Certificado e/ou Lista de Presença devidamente assinada.'
        }
    ]
};

// Funções auxiliares
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
    await new Promise(resolve => setTimeout(resolve, 2500));

    await sendMessage(sender, 'send-message', {
        message: '🎯 *OBJETIVOS DO TREINAMENTO*\n\n📋 *Objetivo Geral:*\nCapacitar os colaboradores  nos princípios básicos de SSMA, desenvolvendo consciência preventiva e comportamentos seguros.\n\n🔹 *Objetivos Específicos:*\n• Compreender a importância da segurança no trabalho\n• Conhecer tipos de acidentes e como preveni-los\n• Dominar o uso correto dos EPIs\n• Identificar riscos no ambiente de trabalho\n• Aplicar medidas de controle e hierarquia de segurança\n• Desenvolver comportamentos seguros e responsáveis\n• Conhecer procedimentos de emergência',

    });
    await new Promise(resolve => setTimeout(resolve, 4000));

    await sendMessage(sender, 'send-message', {
        message: ' 👷‍♀️ *Suas Responsabilidades como Colaborador*\n\n✅ Respeitar procedimentos de Saúde e Segurança da sua função.\n\n✅ Cuidar da sua segurança e dos colegas.\n\n✅ Não realizar atividades sem capacitação e autorização.\n\n✅ Manter organização do local de trabalho.',
    });
    await new Promise(resolve => setTimeout(resolve, 3500));

    await sendMessage(sender, 'send-message', {
        message: '😉 *Lembre-se: Cada colaborador é responsável pela sua segurança e a dos colegas.* ',
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const listMsg = {
        title: '',
        description: '*Pronto para iniciar o conteúdo?* \nEscolha uma opção:',
        buttonText: 'Ver opções',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'começar_ssma', title: 'Pode mandar!! 😎 🔥🔥🔥', description: '' },
                { id: 'não_começar_ssma', title: 'Ainda não, preciso me praparar um pouco 👀 😅', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarInteracao(sender, 'aguardando_inicio_ssma', JSON.stringify(listMsg));
}

/**
 * Processa as respostas do treinamento SSMA
 */
async function processarRespostaSSMA(sender, text, selectedId, contato, sendMessage) {
    console.log(`📝 [TREINAMENTO SSMA] Processando resposta - text: '${text}', selectedId: '${selectedId}'`);
    console.log(`📝 [TREINAMENTO SSMA] Status do contato: ${contato.statusTreinamento}, TreinamentoId: ${contato.treinamentoId}`);
    const ultimaInteracao = await obterUltimaInteracao(sender);
    console.log(`📝 [TREINAMENTO SSMA] Última interação:`, ultimaInteracao?.tipo);

    const textLower = text.toLowerCase();

    // AQUI VOCÊ PODE INSERIR A LÓGICA DO CONTEÚDO DO TREINAMENTO SSMA
    // Exemplo de estrutura básica:

    // Início do treinamento
    if (selectedId === 'começar_ssma' ||
        textLower.includes('pode mandar') ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_ssma' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {

        await sendMessage(sender, 'send-message', {
            message: '🚀 Excelente! Vamos começar o treinamento SSMA! 📚  ',
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/NR 06.png',
            filename: 'NR_06.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/SSMA.png',
            filename: 'SSMA.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/SST.png',
            filename: 'SST.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '🎆 *Premissas Básicas da Segurança*\n\n⭐ A Segurança é IMPRESCINDÍVEL - não é opcional!\n⭐ A responsabilidade é de cada um e é INTRANSFERÍVEL\n⭐ Consciência em segurança é vital\n⭐ O único prejudicado pela falta de segurança será VOCÊ MESMO\n\n🎯 *Nossa meta é ZERO acidentes! Acidentes causam sofrimento, afastamentos, problemas familiares e até morte.*',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '*Agora vamos testar um pouquinho dos seus conhecimentos!* 🧠🔥🧨 ',
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        const quizIntroMsg = {
            title: '',
            description: 'Vamos iniciar um pequeno quiz?\nEscolha uma opção:',
            buttonText: 'Ver opções',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'comecar_quiz_Modulo1', title: 'Vamos nessa 😝😼🔥', description: '' },
                    { id: 'nao_comecar_quiz_Modulo1', title: 'Ainda não, preciso me preparar um pouco 😅👀🛌', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizIntroMsg);
        await salvarInteracao(sender, 'aguardando_quiz_intro', JSON.stringify(quizIntroMsg));
        return true;
    }

    // Quiz intro responses
    if (selectedId === 'comecar_quiz_Modulo1' ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_intro' && (textLower.includes('vamos nessa') || textLower.includes('vamos') || textLower.includes('refazer') || RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase()))))) {

        // Resetar pontuação ao iniciar/reiniciar quiz
        await salvarInteracao(sender, 'quiz_pontuacao', '0');

        const perguntaAtual = QUIZ_CONFIG.perguntas[0];

        await sendMessage(sender, 'send-message', {
            message: 'Então lá vai 🧨🔥🚀\n\n' + perguntaAtual.pergunta,
        });

        const listMsg = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_q1', title: `A) ${perguntaAtual.alternativas.a}`, description: '' },
                    { id: 'b_q1', title: `B) ${perguntaAtual.alternativas.b}`, description: '' },
                    { id: 'c_q1', title: `C) ${perguntaAtual.alternativas.c}`, description: '' },
                    { id: 'd_q1', title: `D) ${perguntaAtual.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_q1', JSON.stringify(listMsg));
        return true;
    }

    // Not ready for quiz
    if (selectedId === 'nao_comecar_quiz_Modulo1' ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_intro' && textLower.includes('ainda não'))) {

        await sendMessage(sender, 'send-message', {
            message: '😅 Sem problemas! Quando estiver pronto para o quiz, é só me avisar!',
        });

        const listMsg = {
            title: '',
            description: 'Escolha uma opção:',
            buttonText: 'Estou pronto(a)',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [{ id: 'comecar_quiz_Modulo1', title: 'Agora posso fazer o quiz! 😎 🔥', description: '' }],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_intro', JSON.stringify(listMsg));
        return true;
    }

    // Quiz Question 1
    if (['a_q1', 'b_q1', 'c_q1', 'd_q1'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_q1' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta1 = QUIZ_CONFIG.perguntas[0];

        let respostaCorreta = false;
        if (selectedId === `${pergunta1.respostaCorreta}_q1`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta1.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        // Inicializar pontuação
        let pontuacao = respostaCorreta ? 1 : 0;
        await salvarInteracao(sender, 'quiz_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta1.explicacao}` : `❌ Incorreta. ${pergunta1.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Pergunta 2
        const pergunta2 = QUIZ_CONFIG.perguntas[1];
        await sendMessage(sender, 'send-message', {
            message: pergunta2.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_q2', title: `A) ${pergunta2.alternativas.a}`, description: '' },
                    { id: 'b_q2', title: `B) ${pergunta2.alternativas.b}`, description: '' },
                    { id: 'c_q2', title: `C) ${pergunta2.alternativas.c}`, description: '' },
                    { id: 'd_q2', title: `D) ${pergunta2.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_q2', JSON.stringify(listMsg));
        return true;
    }

    // Quiz Question 2
    if (['a_q2', 'b_q2', 'c_q2', 'd_q2'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_q2' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta2 = QUIZ_CONFIG.perguntas[1];

        let respostaCorreta = false;
        if (selectedId === `${pergunta2.respostaCorreta}_q2`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta2.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        // Atualizar pontuação
        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacao = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        await salvarInteracao(sender, 'quiz_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta2.explicacao}` : `❌ Incorreta. ${pergunta2.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Pergunta 3
        const pergunta3 = QUIZ_CONFIG.perguntas[2];
        await sendMessage(sender, 'send-message', {
            message: pergunta3.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_q3', title: `A) ${pergunta3.alternativas.a}`, description: '' },
                    { id: 'b_q3', title: `B) ${pergunta3.alternativas.b}`, description: '' },
                    { id: 'c_q3', title: `C) ${pergunta3.alternativas.c}`, description: '' },
                    { id: 'd_q3', title: `D) ${pergunta3.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_q3', JSON.stringify(listMsg));
        return true;
    }

    // Quiz Question 3
    if (['a_q3', 'b_q3', 'c_q3', 'd_q3'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_q3' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta3 = QUIZ_CONFIG.perguntas[2];

        let respostaCorreta = false;
        if (selectedId === `${pergunta3.respostaCorreta}_q3`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta3.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        // Atualizar pontuação
        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacao = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        await salvarInteracao(sender, 'quiz_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta3.explicacao}` : `❌ Incorreta. ${pergunta3.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Pergunta 4
        const pergunta4 = QUIZ_CONFIG.perguntas[3];
        await sendMessage(sender, 'send-message', {
            message: pergunta4.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_q4', title: `A) ${pergunta4.alternativas.a}`, description: '' },
                    { id: 'b_q4', title: `B) ${pergunta4.alternativas.b}`, description: '' },
                    { id: 'c_q4', title: `C) ${pergunta4.alternativas.c}`, description: '' },
                    { id: 'd_q4', title: `D) ${pergunta4.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_q4', JSON.stringify(listMsg));
        return true;
    }

    // Quiz Question 4 (Final)
    if (['a_q4', 'b_q4', 'c_q4', 'd_q4'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_q4' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta4 = QUIZ_CONFIG.perguntas[3];

        let respostaCorreta = false;
        if (selectedId === `${pergunta4.respostaCorreta}_q4`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta4.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        // Calcular pontuação final
        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacaoFinal = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        const percentual = (pontuacaoFinal / 4) * 100;

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta4.explicacao}` : `❌ Incorreta. ${pergunta4.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Verificar se atingiu 80%
        if (percentual >= 80) {
            await sendMessage(sender, 'send-message', {
                message: `🎉 Parabéns! Você concluiu o Módulo 1 com ${pontuacaoFinal}/4 acertos (${percentual.toFixed(0)}%)!`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Oferecer Módulo 2
            await sendMessage(sender, 'send-message', {
                message: '🚀 Agora vamos para o Módulo 2*',
            });
            await new Promise(resolve => setTimeout(resolve, 1500));

            const modulo2Msg = {
                title: '',
                description: 'Deseja iniciar o Módulo 2 agora?\nEscolha uma opção:',
                buttonText: 'Ver opções',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'iniciar_modulo2', title: 'Sim, vamos para o Módulo 2! 🚀', description: '' },
                        { id: 'pular_modulo2', title: 'Não, depois continuo 🦥 😅', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', modulo2Msg);
            await salvarInteracao(sender, 'aguardando_modulo2_intro', JSON.stringify(modulo2Msg));
            return true;
        } else {
            await sendMessage(sender, 'send-message', {
                message: `😔 Você acertou ${pontuacaoFinal}/4 questões (${percentual.toFixed(0)}%). É necessário pelo menos 80% para prosseguir.`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            const retryMsg = {
                title: '',
                description: 'Você precisa refazer o quiz. Escolha uma opção:',
                buttonText: 'Tentar novamente',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'comecar_quiz_Modulo1', title: 'Refazer o quiz 🔄', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', retryMsg);
            await salvarInteracao(sender, 'aguardando_quiz_intro', JSON.stringify(retryMsg));
            return true;
        }

        const listMsg = {
            title: '',
            description: `Confirme seus dados para o certificado:\n\n👤 Nome: ${contato.nome}\n📧 Email: ${contato.email || 'Não informado'}\n🏢 Empresa: ${contato.empresa || 'Não informada'}\n\nOs dados estão corretos?`,
            buttonText: 'Confirmar dados',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'dados_corretos_ssma', title: 'Sim, os dados estão corretos', description: '' },
                    { id: 'dados_incorretos_ssma', title: 'Não, preciso corrigir', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'confirmacao_dados_ssma', JSON.stringify(listMsg));
        return true;
    }

    // Módulo 2 - Iniciar
    if (selectedId === 'iniciar_modulo2' ||
        (ultimaInteracao?.tipo === 'aguardando_modulo2_intro' && (textLower.includes('sim') || textLower.includes('vamos')))) {

        await sendMessage(sender, 'send-message', {
            message: '*Boaa!!* \n\nEntão vamos nessa 🦾⛑️🚀 ',
        });

        await sendMessage(sender, 'send-message', {
            message: '🎆 *Módulo 2*\n\nNesse módulo vamos entender melhor os tipos de acidentes e o que fazer',
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/CIPA.png',
            filename: 'CIPA.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-message', {
            message: '🚨 TIPOS DE ACIDENTES - CONHECER PARA PREVENIR ',
        });

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/LEI.png',
            filename: 'LEI.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-message', {
            message: 'Todo acidente do trabalho deve ser comunicado ao Setor da Segurança do Trabalho. Caso o acidente ocorra nas frentes de serviços e o Técnico não esteja no local, o seu Líder imediato deve ser comunicado e o mesmo deve comunicar ao SESMT de imediato. 👷🩸🩹🩼',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '🏥 *ACIDENTE PESSOAL*\nGera lesão física e/ou doença no colaborador\nPode causar morte, invalidez permanente, total ou parcial\nExemplos: cortes, fraturas, queimaduras, intoxicações',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '🌍 *ACIDENTE AMBIENTAL*\nEventos não planejados e indesejados que podem causar diretamente ou indiretamente danos ao meio ambiente, saúde pública, prejuízos sociais e econômicos.\nExemplos: vazamentos, contaminação do solo/água',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '🔧 *ACIDENTE MATERIAL*\nDanos em máquinas, equipamentos, veículos e estruturas industriais e/ou prediais.\nPode gerar paralisação de atividades',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '⚡ *QUASE ACIDENTE*\nEvento que PODERIA ter sido acidente, mas não foi\nExemplos: Uma ferramenta pesada cai bem ao lado de um trabalhador que estava passando por um corredor.\nImportante: São alertas para prevenção!',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '📅 *Acidentes do Trabalho com classificação por Afastamento*\n\n✅ SEM AFASTAMENTO: Retorno no mesmo dia ou dia seguinte\n❌ COM AFASTAMENTO: Impossibilita o acidentado exercer suas atividades de trabalho.\n🚗 DE TRAJETO: Acontece no percurso entre casa-trabalho, desde que não tenha sido alterado o itinerário normal diário.',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '⚠️ *TODO acidente deve ser comunicado IMEDIATAMENTE por meio da CAT, via sistema E-SOCAL usando PO.SST-02!*',

        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/ComunicacaoDoEvento_Acidente.png',
            filename: 'LEI.png',
            caption: '  '
        });
        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/ComunicacaoDoEvento_Acidente2.png',
            filename: 'LEI.png',
            caption: ' '
        });


        const quizModulo2Msg = {
            title: '',
            description: 'Pronto para o quiz do Módulo 2?\nEscolha uma opção:',
            buttonText: 'Ver opções',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'comecar_quiz_Modulo2', title: 'Vamos nessa! 🚀', description: '' },
                    { id: 'nao_comecar_quiz_Modulo2', title: 'Ainda não 😅 🦥', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizModulo2Msg);
        await salvarInteracao(sender, 'aguardando_quiz_modulo2_intro', JSON.stringify(quizModulo2Msg));
        return true;
    }

    // Quiz Módulo 2 - Iniciar
    if (selectedId === 'comecar_quiz_Modulo2' ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_modulo2_intro' && (textLower.includes('vamos nessa') || textLower.includes('vamos')))) {

        // Resetar pontuação do Módulo 2
        await salvarInteracao(sender, 'quiz_modulo2_pontuacao', '0');

        const perguntaAtual = QUIZ_MODULO2_CONFIG.perguntas[0];

        await sendMessage(sender, 'send-message', {
            message: 'Então lá vai o quiz do Módulo 2! 🧨🔥🚀\n\n' + perguntaAtual.pergunta,
        });

        const listMsg = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_m2q1', title: `A) ${perguntaAtual.alternativas.a}`, description: '' },
                    { id: 'b_m2q1', title: `B) ${perguntaAtual.alternativas.b}`, description: '' },
                    { id: 'c_m2q1', title: `C) ${perguntaAtual.alternativas.c}`, description: '' },
                    { id: 'd_m2q1', title: `D) ${perguntaAtual.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_m2q1', JSON.stringify(listMsg));
        return true;
    }

    // Quiz Módulo 2 - Questão 1
    if (['a_m2q1', 'b_m2q1', 'c_m2q1', 'd_m2q1'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_m2q1' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta1 = QUIZ_MODULO2_CONFIG.perguntas[0];

        let respostaCorreta = false;
        if (selectedId === `${pergunta1.respostaCorreta}_m2q1`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta1.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        let pontuacao = respostaCorreta ? 1 : 0;
        await salvarInteracao(sender, 'quiz_modulo2_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta1.explicacao}` : `❌ Incorreta. ${pergunta1.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Pergunta 2
        const pergunta2 = QUIZ_MODULO2_CONFIG.perguntas[1];
        await sendMessage(sender, 'send-message', {
            message: pergunta2.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_m2q2', title: `A) ${pergunta2.alternativas.a}`, description: '' },
                    { id: 'b_m2q2', title: `B) ${pergunta2.alternativas.b}`, description: '' },
                    { id: 'c_m2q2', title: `C) ${pergunta2.alternativas.c}`, description: '' },
                    { id: 'd_m2q2', title: `D) ${pergunta2.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_m2q2', JSON.stringify(listMsg));
        return true;
    }

    // Quiz Módulo 2 - Questão 2
    if (['a_m2q2', 'b_m2q2', 'c_m2q2', 'd_m2q2'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_m2q2' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta2 = QUIZ_MODULO2_CONFIG.perguntas[1];

        let respostaCorreta = false;
        if (selectedId === `${pergunta2.respostaCorreta}_m2q2`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta2.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        // Atualizar pontuação
        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_modulo2_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacao = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        await salvarInteracao(sender, 'quiz_modulo2_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta2.explicacao}` : `❌ Incorreta. ${pergunta2.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Pergunta 3
        const pergunta3 = QUIZ_MODULO2_CONFIG.perguntas[2];
        await sendMessage(sender, 'send-message', {
            message: pergunta3.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg3 = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_m2q3', title: `A) ${pergunta3.alternativas.a}`, description: '' },
                    { id: 'b_m2q3', title: `B) ${pergunta3.alternativas.b}`, description: '' },
                    { id: 'c_m2q3', title: `C) ${pergunta3.alternativas.c}`, description: '' },
                    { id: 'd_m2q3', title: `D) ${pergunta3.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg3);
        await salvarInteracao(sender, 'aguardando_quiz_m2q3', JSON.stringify(listMsg3));
        return true;
    }

    // Quiz Módulo 2 - Questão 3
    if (['a_m2q3', 'b_m2q3', 'c_m2q3', 'd_m2q3'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_m2q3' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta3 = QUIZ_MODULO2_CONFIG.perguntas[2];

        let respostaCorreta = false;
        if (selectedId === `${pergunta3.respostaCorreta}_m2q3`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta3.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        // Atualizar pontuação
        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_modulo2_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacao = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        await salvarInteracao(sender, 'quiz_modulo2_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta3.explicacao}` : `❌ Incorreta. ${pergunta3.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Pergunta 4
        const pergunta4 = QUIZ_MODULO2_CONFIG.perguntas[3];
        await sendMessage(sender, 'send-message', {
            message: pergunta4.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg4 = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_m2q4', title: `A) ${pergunta4.alternativas.a}`, description: '' },
                    { id: 'b_m2q4', title: `B) ${pergunta4.alternativas.b}`, description: '' },
                    { id: 'c_m2q4', title: `C) ${pergunta4.alternativas.c}`, description: '' },
                    { id: 'd_m2q4', title: `D) ${pergunta4.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg4);
        await salvarInteracao(sender, 'aguardando_quiz_m2q4', JSON.stringify(listMsg4));
        return true;
    }

    // Quiz Módulo 2 - Questão 4 (Final)
    if (['a_m2q4', 'b_m2q4', 'c_m2q4', 'd_m2q4'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_m2q4' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta4 = QUIZ_MODULO2_CONFIG.perguntas[3];

        let respostaCorreta = false;
        if (selectedId === `${pergunta4.respostaCorreta}_m2q4`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta4.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        // Calcular pontuação final do Módulo 2
        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_modulo2_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacaoFinal = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        const percentual = (pontuacaoFinal / 4) * 100;

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta4.explicacao}` : `❌ Incorreta. ${pergunta4.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Verificar se atingiu 80% no Módulo 2
        if (percentual >= 80) {
            await sendMessage(sender, 'send-message', {
                message: `🎉 Parabéns! Você concluiu o Módulo 2 com ${pontuacaoFinal}/4 acertos (${percentual.toFixed(0)}%)!`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Oferecer Módulo 3
            await sendMessage(sender, 'send-message', {
                message: '🚀 Agora vamos para o Módulo 3!',
            });
            await new Promise(resolve => setTimeout(resolve, 1500));

            const modulo3Msg = {
                title: '',
                description: 'Deseja iniciar o Módulo 3 agora?\nEscolha uma opção:',
                buttonText: 'Ver opções',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'iniciar_modulo3', title: 'Sim, vamos para o Módulo 3! 🚀', description: '' },
                        { id: 'pular_modulo3', title: 'Não, Depois eu volto 🛌🦥', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', modulo3Msg);
            await salvarInteracao(sender, 'aguardando_modulo3_intro', JSON.stringify(modulo3Msg));
            return true;
        } else {
            await sendMessage(sender, 'send-message', {
                message: `😔 Você acertou ${pontuacaoFinal}/4 questões (${percentual.toFixed(0)}%). É necessário pelo menos 80% para prosseguir.`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            const retryMsg = {
                title: '',
                description: 'Você precisa refazer o quiz do Módulo 2. Escolha uma opção:',
                buttonText: 'Tentar novamente',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'comecar_quiz_Modulo2', title: 'Refazer o quiz do Módulo 2 🔄', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', retryMsg);
            await salvarInteracao(sender, 'aguardando_quiz_modulo2_intro', JSON.stringify(retryMsg));
            return true;
        }
    }

    // Módulo 2 - Pular para certificado
    if (selectedId === 'pular_modulo2' ||
        (ultimaInteracao?.tipo === 'aguardando_modulo2_intro' && (textLower.includes('não') || textLower.includes('finalizar')))) {

        const listMsg = {
            title: '',
            description: `Confirme seus dados para o certificado:\n\n👤 Nome: ${contato.nome}\n📧 Email: ${contato.email || 'Não informado'}\n🏢 Empresa: ${contato.empresa || 'Não informada'}\n\nOs dados estão corretos?`,
            buttonText: 'Confirmar dados',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'dados_corretos_ssma', title: 'Sim, os dados estão corretos', description: '' },
                    { id: 'dados_incorretos_ssma', title: 'Não, preciso corrigir', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'confirmacao_dados_ssma', JSON.stringify(listMsg));
        return true;
    }

    // Módulo 3 - Iniciar
    if (selectedId === 'iniciar_modulo3' ||
        (ultimaInteracao?.tipo === 'aguardando_modulo3_intro' && (textLower.includes('sim') || textLower.includes('vamos')))) {

        await sendMessage(sender, 'send-message', {
            message: '*Excelente!* \n\nEntão vamos da inicio ⚡🚀',
        });

        await sendMessage(sender, 'send-message', {
            message: '🎆 *Módulo 3 - PROGRAMAS DE SAÚDE E SEGURANÇA DO TRABALHO*\n\nNeste módulo vamos conhecer os programas legais voltados à saúde e segurança',
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-message', {
            message: 'Os programas legais são voltados à saúde e segurança do trabalhador com medidas educaitivas, preventivas e de conscientização, que apontam a eliminação ou neutralização dos riscos existentes no ambiente de trabalho, tais como físicos, químicos, biologicos, acidentes e egornômicos.',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/PCMSO.png',
            filename: 'PCMSO.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/PGR.png',
            filename: 'PCMSO.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));






        const quizModulo3Msg = {
            title: '',
            description: 'Pronto para o quiz do Módulo 3?\nEscolha uma opção:',
            buttonText: 'Ver opções',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'comecar_quiz_Modulo3', title: 'Vamos nessa! 🚀', description: '' },
                    { id: 'nao_comecar_quiz_Modulo3', title: 'Ainda não 😅', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizModulo3Msg);
        await salvarInteracao(sender, 'aguardando_quiz_modulo3_intro', JSON.stringify(quizModulo3Msg));
        return true;
    }

    // Quiz Módulo 3 - Iniciar
    if (selectedId === 'comecar_quiz_Modulo3' ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_modulo3_intro' && (textLower.includes('vamos nessa') || textLower.includes('vamos')))) {

        await salvarInteracao(sender, 'quiz_modulo3_pontuacao', '0');

        const perguntaAtual = QUIZ_MODULO3_CONFIG.perguntas[0];

        await sendMessage(sender, 'send-message', {
            message: 'Então lá vai o quiz do Módulo 3! 🧨🔥🚀\n\n' + perguntaAtual.pergunta,
        });

        const listMsg = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_m3q1', title: `A) ${perguntaAtual.alternativas.a}`, description: '' },
                    { id: 'b_m3q1', title: `B) ${perguntaAtual.alternativas.b}`, description: '' },
                    { id: 'c_m3q1', title: `C) ${perguntaAtual.alternativas.c}`, description: '' },
                    { id: 'd_m3q1', title: `D) ${perguntaAtual.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_m3q1', JSON.stringify(listMsg));
        return true;
    }

    // Quiz Módulo 3 - Questão 1
    if (['a_m3q1', 'b_m3q1', 'c_m3q1', 'd_m3q1'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_m3q1' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta1 = QUIZ_MODULO3_CONFIG.perguntas[0];

        let respostaCorreta = false;
        if (selectedId === `${pergunta1.respostaCorreta}_m3q1`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta1.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        let pontuacao = respostaCorreta ? 1 : 0;
        await salvarInteracao(sender, 'quiz_modulo3_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta1.explicacao}` : `❌ Incorreta. ${pergunta1.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pergunta2 = QUIZ_MODULO3_CONFIG.perguntas[1];
        await sendMessage(sender, 'send-message', {
            message: pergunta2.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg2 = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_m3q2', title: `A) ${pergunta2.alternativas.a}`, description: '' },
                    { id: 'b_m3q2', title: `B) ${pergunta2.alternativas.b}`, description: '' },
                    { id: 'c_m3q2', title: `C) ${pergunta2.alternativas.c}`, description: '' },
                    { id: 'd_m3q2', title: `D) ${pergunta2.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg2);
        await salvarInteracao(sender, 'aguardando_quiz_m3q2', JSON.stringify(listMsg2));
        return true;
    }

    // Quiz Módulo 3 - Questão 2
    if (['a_m3q2', 'b_m3q2', 'c_m3q2', 'd_m3q2'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_m3q2' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta2 = QUIZ_MODULO3_CONFIG.perguntas[1];

        let respostaCorreta = false;
        if (selectedId === `${pergunta2.respostaCorreta}_m3q2`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta2.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_modulo3_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacao = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        await salvarInteracao(sender, 'quiz_modulo3_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta2.explicacao}` : `❌ Incorreta. ${pergunta2.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pergunta3 = QUIZ_MODULO3_CONFIG.perguntas[2];
        await sendMessage(sender, 'send-message', {
            message: pergunta3.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg3 = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_m3q3', title: `A) ${pergunta3.alternativas.a}`, description: '' },
                    { id: 'b_m3q3', title: `B) ${pergunta3.alternativas.b}`, description: '' },
                    { id: 'c_m3q3', title: `C) ${pergunta3.alternativas.c}`, description: '' },
                    { id: 'd_m3q3', title: `D) ${pergunta3.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg3);
        await salvarInteracao(sender, 'aguardando_quiz_m3q3', JSON.stringify(listMsg3));
        return true;
    }

    // Quiz Módulo 3 - Questão 3
    if (['a_m3q3', 'b_m3q3', 'c_m3q3', 'd_m3q3'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_m3q3' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta3 = QUIZ_MODULO3_CONFIG.perguntas[2];

        let respostaCorreta = false;
        if (selectedId === `${pergunta3.respostaCorreta}_m3q3`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta3.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_modulo3_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacao = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        await salvarInteracao(sender, 'quiz_modulo3_pontuacao', pontuacao.toString());

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta3.explicacao}` : `❌ Incorreta. ${pergunta3.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pergunta4 = QUIZ_MODULO3_CONFIG.perguntas[3];
        await sendMessage(sender, 'send-message', {
            message: pergunta4.pergunta,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const listMsg4 = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_m3q4', title: `A) ${pergunta4.alternativas.a}`, description: '' },
                    { id: 'b_m3q4', title: `B) ${pergunta4.alternativas.b}`, description: '' },
                    { id: 'c_m3q4', title: `C) ${pergunta4.alternativas.c}`, description: '' },
                    { id: 'd_m3q4', title: `D) ${pergunta4.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg4);
        await salvarInteracao(sender, 'aguardando_quiz_m3q4', JSON.stringify(listMsg4));
        return true;
    }

    // Quiz Módulo 3 - Questão 4 (Final)
    if (['a_m3q4', 'b_m3q4', 'c_m3q4', 'd_m3q4'].includes(selectedId) ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_m3q4' && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {
        const pergunta4 = QUIZ_MODULO3_CONFIG.perguntas[3];

        let respostaCorreta = false;
        if (selectedId === `${pergunta4.respostaCorreta}_m3q4`) {
            respostaCorreta = true;
        } else if (textLower.includes(`${pergunta4.respostaCorreta})`)) {
            respostaCorreta = true;
        }

        const pontuacaoAnterior = await Interacao.findOne({
            where: { telefone: sender, tipo: 'quiz_modulo3_pontuacao' },
            order: [['createdAt', 'DESC']]
        });
        let pontuacaoFinal = parseInt(pontuacaoAnterior?.mensagem || '0') + (respostaCorreta ? 1 : 0);
        const percentual = (pontuacaoFinal / 4) * 100;

        await sendMessage(sender, 'send-message', {
            message: respostaCorreta ? `✅ Correto! ${pergunta4.explicacao}` : `❌ Incorreta. ${pergunta4.explicacao}`,
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        if (percentual >= 80) {
            await sendMessage(sender, 'send-message', {
                message: `🎉 Parabéns! Você concluiu o Módulo 3 com ${pontuacaoFinal}/4 acertos (${percentual.toFixed(0)}%)!`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            const listMsgCert = {
                title: '',
                description: `Confirme seus dados para o certificado:\n\n👤 Nome: ${contato.nome}\n📧 Email: ${contato.email || 'Não informado'}\n🏢 Empresa: ${contato.empresa || 'Não informada'}\n\nOs dados estão corretos?`,
                buttonText: 'Confirmar dados',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'dados_corretos_ssma', title: 'Sim, os dados estão corretos', description: '' },
                        { id: 'dados_incorretos_ssma', title: 'Não, preciso corrigir', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', listMsgCert);
            await salvarInteracao(sender, 'confirmacao_dados_ssma', JSON.stringify(listMsgCert));
            return true;
        } else {
            await sendMessage(sender, 'send-message', {
                message: `😔 Você acertou ${pontuacaoFinal}/4 questões (${percentual.toFixed(0)}%). É necessário pelo menos 80% para prosseguir.`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            const retryMsg = {
                title: '',
                description: 'Você precisa refazer o quiz do Módulo 3. Escolha uma opção:',
                buttonText: 'Tentar novamente',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'comecar_quiz_Modulo3', title: 'Refazer o quiz do Módulo 3 🔄', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', retryMsg);
            await salvarInteracao(sender, 'aguardando_quiz_modulo3_intro', JSON.stringify(retryMsg));
            return true;
        }
    }

    // Módulo 3 - Pular para certificado
    if (selectedId === 'pular_modulo3' ||
        (ultimaInteracao?.tipo === 'aguardando_modulo3_intro' && (textLower.includes('não') || textLower.includes('finalizar')))) {

        const listMsg = {
            title: '',
            description: `Confirme seus dados para o certificado:\n\n👤 Nome: ${contato.nome}\n📧 Email: ${contato.email || 'Não informado'}\n🏢 Empresa: ${contato.empresa || 'Não informada'}\n\nOs dados estão corretos?`,
            buttonText: 'Confirmar dados',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'dados_corretos_ssma', title: 'Sim, os dados estão corretos', description: '' },
                    { id: 'dados_incorretos_ssma', title: 'Não, preciso corrigir', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'confirmacao_dados_ssma', JSON.stringify(listMsg));
        return true;
    }

    // Certificate confirmation (keeping existing logic)
    if (selectedId === 'dados_corretos_ssma' ||
        (ultimaInteracao?.tipo === 'confirmacao_dados_ssma' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {

        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados! Gerando seu certificado...',
        });
        await gerarEEnviarCertificadoSSMA(contato, sender, sendMessage);
        return true;
    }

    // Dados incorretos
    if (selectedId === 'dados_incorretos_ssma' ||
        (ultimaInteracao?.tipo === 'confirmacao_dados_ssma' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {

        await sendMessage(sender, 'send-message', {
            message: '📝 Para corrigir seus dados, por favor, entre em contato com o suporte.',
        });
        return true;
    }



    // Não começar agora
    if (selectedId === 'não_começar_ssma' ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_ssma' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {

        const listMsg = {
            title: '',
            description: 'Escolha uma opção:',
            buttonText: 'Estou pronto(a)',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [{ id: 'pronto_ssma', title: 'Começar agora!! 😎 🔥🔥🔥', description: '' }],
            }],
        };

        await sendMessage(sender, 'send-message', {
            message: '😅 Sem problemas! Quando estiver pronto, é só avisar. Estamos aqui para ajudar! 👷♂️👷♀️',
        });
        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_inicio_ssma', JSON.stringify(listMsg));
        return true;
    }



    return false;
}

/**
 * Gera e envia certificado do treinamento SSMA
 */
async function gerarEEnviarCertificadoSSMA(contato, sender, sendMessage) {
    try {
        const treinamento = await Treinamento.findByPk(14);

        if (!treinamento) {
            await sendMessage(sender, 'send-message', {
                message: '❌ Erro: Treinamento não encontrado.',
            });
            return;
        }

        // Gerar certificado
        const certificadoPath = await gerarCertificadoBanco(contato, treinamento);

        if (certificadoPath) {
            await sendMessage(sender, 'send-file', {
                path: certificadoPath,
                filename: `Certificado_${contato.nome.replace(/\s+/g, '_')}_SSMA.pdf`,
                caption: '🎓 Parabéns! Aqui está seu certificado de conclusão do treinamento SSMA!',
            });

            // Enviar por email se disponível
            if (contato.email) {
                await enviarEmail(contato.email, certificadoPath, treinamento.nome);
            }

            await sendMessage(sender, 'send-message', {
                message: '✅ Treinamento concluído com sucesso! Obrigado pela participação! 🎉',
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: '❌ Erro ao gerar certificado. Entre em contato com o suporte.',
            });
        }
    } catch (error) {
        console.error('Erro ao gerar certificado SSMA:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro interno. Entre em contato com o suporte.',
        });
    }
}

module.exports = {
    executarTreinamento,
    processarRespostaSSMA
};