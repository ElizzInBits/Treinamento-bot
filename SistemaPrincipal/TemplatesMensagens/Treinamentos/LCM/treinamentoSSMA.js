//Script de Treinamento SSMA
//ID do Treinamento: 14

// sendMessage will be passed as parameter to avoid circular dependency
const { Treinamento, Contato } = require('../../../BancoDeDados/models');
const { Interacao, Empresa } = require('../../../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('../../Certificados/certificados2.js');
const { Op } = require('sequelize');

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
        message: '🎯 *OBJETIVOS DO TREINAMENTO*\n\n📋 *Objetivo Geral:*\nCapacitar os colaboradores nos princípios básicos de SSMA, desenvolvendo consciência preventiva e comportamentos seguros.\n\n🔹 *Objetivos Específicos:*\n• Compreender a importância da segurança no trabalho\n• Conhecer tipos de acidentes e como preveni-los\n• Dominar o uso correto dos EPIs\n• Identificar riscos no ambiente de trabalho\n• Aplicar medidas de controle e hierarquia de segurança\n• Desenvolver comportamentos seguros e responsáveis\n• Conhecer procedimentos de emergência',
    });
    await new Promise(resolve => setTimeout(resolve, 4000));

    await sendMessage(sender, 'send-message', {
        message: ' 👷 *Suas Responsabilidades como Colaborador*\n\n✅ Respeitar procedimentos de Saúde e Segurança da sua função.\n\n✅ Cuidar da sua segurança e dos colegas.\n\n✅ Não realizar atividades sem capacitação e autorização.\n\n✅ Manter organização do local de trabalho.',
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
                { id: 'não_começar_ssma', title: 'Ainda não, preciso me preparar um pouco 👀 😅', description: '' },
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
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const textLower = text.toLowerCase();

    // Início do treinamento
    if (selectedId === 'começar_ssma' ||
        textLower.includes('pode mandar') ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_ssma' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {

        await sendMessage(sender, 'send-message', {
            message: '🚀 Excelente! Vamos começar o treinamento! 📚',
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/NR 06.png',
            filename: 'SSMA.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/SSMA.png',
            filename: 'SSMA.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/SST.png',
            filename: 'SSMA.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));


        await sendMessage(sender, 'send-message', {
            message: '🎆 *Premissas Básicas da Segurança*\n\n⭐ A Segurança é IMPRESCINDÍVEL - não é opcional!\n⭐ A responsabilidade é de cada um e é INTRANSFERÍVEL\n⭐ Consciência em segurança é vital\n⭐ O único prejudicado pela falta de segurança será VOCÊ MESMO\n\n🎯 *Nossa meta é ZERO acidentes! Acidentes causam sofrimento, afastamentos, problemas familiares e até morte.*',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '🚨 *TIPOS DE ACIDENTES - CONHECER PARA PREVENIR*\n\nTodo acidente do trabalho deve ser comunicado ao SESMT imediatamente!',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '🏥 *ACIDENTE PESSOAL*\n\nDanos físicos e/ou doenças no colaborador.\n\nPode causar morte ou invalidez permanente\n\nExemplos: cortes, fraturas, queimaduras',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '🌍 *ACIDENTE AMBIENTAL*\n\nEventos que causam prejuízos ao meio ambiente.\n\nExemplos: vazamento de óleo, contaminação de solo ou água',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '🔧 *ACIDENTE MATERIAL*\n\nDanos a máquinas, equipamentos ou veículos.\n\nPode causar paralisação das atividades',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '⚡ *QUASE ACIDENTE*\n\nSituação que poderia ter sido um acidente, mas não foi.\n\nExemplo: ferramenta cai próximo ao trabalhador\n\nAtenção: Servem como alerta para prevenir acidentes!',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '📅 *CLASSIFICAÇÃO POR AFASTAMENTO*\n\n✅ Sem afastamento: retorno no mesmo dia\n\n❌ Com afastamento: impossibilita o trabalho\n\n🚗 De trajeto: no caminho trabalho - casa - trabalho',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '*Agora vamos testar seus conhecimentos sobre SSMA e acidentes!* 🧠🔥🧨',
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        const quizIntroMsg = {
            title: '',
            description: 'Vamos iniciar o quiz do Módulo 1?\nEscolha uma opção:',
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

    // Quiz Módulo 1 - Iniciar
    if (selectedId === 'comecar_quiz_Modulo1' ||
        (ultimaInteracao?.tipo === 'aguardando_quiz_intro' && (textLower.includes('vamos nessa') || textLower.includes('vamos') || textLower.includes('refazer')))) {

        await salvarInteracao(sender, 'quiz_pontuacao', '0');
        const perguntaAtual = QUIZ_CONFIG.perguntas[0];

        await sendMessage(sender, 'send-message', {
            message: 'Então lá vai o quiz! 🧨🔥🚀\n\n' + perguntaAtual.pergunta,
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

    // Processar questões do Módulo 1 (1-8)
    for (let i = 1; i <= 8; i++) {
        if ([`a_q${i}`, `b_q${i}`, `c_q${i}`, `d_q${i}`].includes(selectedId) ||
            (ultimaInteracao?.tipo === `aguardando_quiz_q${i}` && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {

            const pergunta = QUIZ_CONFIG.perguntas[i - 1];
            let respostaCorreta = false;

            if (selectedId === `${pergunta.respostaCorreta}_q${i}`) {
                respostaCorreta = true;
            } else if (textLower.includes(`${pergunta.respostaCorreta})`)) {
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
                message: respostaCorreta ? `✅ Correto! ${pergunta.explicacao}` : `❌ Incorreta. ${pergunta.explicacao}`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Se não é a última pergunta, continuar
            if (i < 8) {
                const proximaPergunta = QUIZ_CONFIG.perguntas[i];
                await sendMessage(sender, 'send-message', {
                    message: proximaPergunta.pergunta,
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
                            { id: `a_q${i + 1}`, title: `A) ${proximaPergunta.alternativas.a}`, description: '' },
                            { id: `b_q${i + 1}`, title: `B) ${proximaPergunta.alternativas.b}`, description: '' },
                            { id: `c_q${i + 1}`, title: `C) ${proximaPergunta.alternativas.c}`, description: '' },
                            { id: `d_q${i + 1}`, title: `D) ${proximaPergunta.alternativas.d}`, description: '' },
                        ],
                    }],
                };

                await sendMessage(sender, 'send-list-message', listMsg);
                await salvarInteracao(sender, `aguardando_quiz_q${i + 1}`, JSON.stringify(listMsg));
                return true;
            } else {
                // Última pergunta - calcular resultado final
                const percentual = (pontuacao / 8) * 100;

                if (percentual >= 80) {
                    await sendMessage(sender, 'send-message', {
                        message: `🎉 Parabéns! Você concluiu o Módulo 1 com ${pontuacao}/8 acertos (${percentual.toFixed(0)}%)!`,
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const modulo2Msg = {
                        title: '',
                        description: 'Deseja iniciar o Módulo 2 agora?\nEscolha uma opção:',
                        buttonText: 'Ver opções',
                        listType: 'SINGLE_SELECT',
                        sections: [{
                            title: '',
                            rows: [
                                { id: 'iniciar_modulo2', title: 'Sim, vamos para o Módulo 2! 🚀', description: '' },
                                { id: 'pular_modulo2', title: 'Não, finalizar treinamento 🎓', description: '' },
                            ],
                        }],
                    };

                    await sendMessage(sender, 'send-list-message', modulo2Msg);
                    await salvarInteracao(sender, 'aguardando_modulo2_intro', JSON.stringify(modulo2Msg));
                    return true;
                } else {
                    await sendMessage(sender, 'send-message', {
                        message: `😔 Você acertou ${pontuacao}/8 questões (${percentual.toFixed(0)}%). É necessário pelo menos 80% para prosseguir.`,
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
            }
        }
    }

    // Módulo 2 - Iniciar
    if (selectedId === 'iniciar_modulo2' ||
        (ultimaInteracao?.tipo === 'aguardando_modulo2_intro' && (textLower.includes('sim') || textLower.includes('vamos')))) {

        await sendMessage(sender, 'send-message', {
            message: '*Excelente!* \n\nVamos para o Módulo 2! ⚡🚀',
        });

        await sendMessage(sender, 'send-message', {
            message: '🎆 *Módulo 2 - PROGRAMAS DE SAÚDE E SEGURANÇA DO TRABALHO*\n\nNeste módulo vamos conhecer os programas legais voltados à saúde e segurança',
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-message', {
            message: '📜 *PROGRAMAS LEGAIS*\n\nVoltados à saúde e segurança do trabalhador, com medidas:\n📚 Educativas | 🚫 Preventivas | 🧠 De conscientização\n🎯 Objetivo: eliminar ou neutralizar riscos no ambiente de trabalho.',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/PCMSO.png',
            filename: 'PCMSO.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-message', {
            message: '🏥 *PCMSO – Programa de Controle Médico e Saúde Ocupacional*\n\nExigido pela NR-7\n\nControla riscos à saúde do trabalhador\n\nRealiza exames médicos obrigatórios',
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/PGR.png',
            filename: 'PGR.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-message', {
            message: '🔍 *PGR – Programa de Gerenciamento de Riscos*\n\nIdentifica riscos no ambiente de trabalho\n\nDefine medidas de controle\n\nPrevê exames médicos quando necessário',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: 'Tipos de riscos controlados:\n🔊 Físicos | 🧪 Químicos | 🦠 Biológicos | ⚡ Acidentes | 🧑‍💻 Ergonômicos',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/MAPARISCO.png',
            filename: 'MAPARISCO.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMessage(sender, 'send-message', {
            message: '🗺️ *MAPAS DE RISCOS*\n\nServem para:\n\nDiagnosticar a situação de segurança\n\nFacilitar a troca de informações entre trabalhadores\n\nIncentivar a participação na prevenção',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '🛡️ *EQUIPAMENTOS DE PROTEÇÃO – EPC x EPI*\n\nEPC (Coletiva) → Protege todos. Ex.: guarda-corpos, ventilação, sinalização. Prioridade sobre EPI.\n\nEPI (Individual) → Uso pessoal e obrigatório, com Certificado de Aprovação (CA).',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '⚠ *4 PENSAMENTOS PERIGOSOS A EVITAR:*\n\n❌ "Nunca vai acontecer comigo"\n❌ "Sou bom, não preciso de EPI"\n❌ "É desconfortável"\n❌ "Quanto mais rápido, melhor"',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '🎯 *PROTEÇÃO POR ÁREA*\n\n🪖 *Cabeça e Face*\nCapacete – impactos, quedas de objetos, choques elétricos\nCapuz – calor, respingos químicos, riscos mecânicos\nÓculos – partículas, radiação UV/IV, respingos químicos\nProtetor Facial – impacto multidirecional + proteção extra à visão',
        });
        await new Promise(resolve => setTimeout(resolve, 3500));

        await sendMessage(sender, 'send-message', {
            message: '👂 *Audição*\nPlugues de espuma – descartáveis (1 uso)\nPlugues de silicone – reutilizáveis com higienização\nAbafadores tipo concha – maior proteção, menos práticos\n\n⚠ Perda auditiva é irreversível!',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '💨 *Respiratória*\nContaminantes: poeiras, névoas, fumos, gases, vapores\n\nFiltros:\nPFF1 → poeiras/névoas\nPFF2 → fumos/agentes biológicos\nPFF3 → particulados tóxicos\n\nTeste de vedação: cobrir respirador e inalar forte.\n🚫 Não usar com barba.',
        });
        await new Promise(resolve => setTimeout(resolve, 3500));

        await sendMessage(sender, 'send-message', {
            message: '🙌 *Membros Superiores*\nLuva isolante + cobertura – elétrica\nLuva Nitrílica – química/biológica\nLuva de PVC – óleos/solventes\nLuva de Raspa – abrasivos\nLuvas Vaqueta – uso geral',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '🦵 *Membros Inferiores*\nBota PVC – umidade/químicos\nBota Couro – proteção completa\nSapato Couro – riscos leves\nBota Borracha – lama/umidade\n\nCaracterísticas: bico de proteção, palmilha anti-perfuração, solado antiderrapante.',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-message', {
            message: '👕 *Corpo e Cremes Barreira*\nVestimentas: jalecos, jaquetas, macacões, coletes reflexivos\nCremes: proteção contra água, óleo ou riscos especiais → aplicar antes do trabalho.',
        });
        await new Promise(resolve => setTimeout(resolve, 2500));

        await sendMessage(sender, 'send-message', {
            message: '🪂 *Proteção contra Quedas*\nTrabalho em altura: acima de 2 m\nCinturão de segurança + talabarte + trava-quedas\nPonto de ancoragem: acima da argola dorsal, min. 2.300 kgf\n\nRegras: inspeção antes do uso, nunca modificar, descartar se usado em queda.',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/SEGURANCA.png',
            filename: 'SEGURANCA.png',
            caption: ' '
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const quizModulo2Msg = {
            title: '',
            description: 'Pronto para o quiz do Módulo 2?\nEscolha uma opção:',
            buttonText: 'Ver opções',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'comecar_quiz_Modulo2', title: 'Vamos nessa! 🚀', description: '' },
                    { id: 'nao_comecar_quiz_Modulo2', title: 'Ainda não 😅', description: '' },
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

    // Processar questões do Módulo 2 (1-6)
    for (let i = 1; i <= 6; i++) {
        if ([`a_m2q${i}`, `b_m2q${i}`, `c_m2q${i}`, `d_m2q${i}`].includes(selectedId) ||
            (ultimaInteracao?.tipo === `aguardando_quiz_m2q${i}` && (textLower.includes('a)') || textLower.includes('b)') || textLower.includes('c)') || textLower.includes('d)')))) {

            const pergunta = QUIZ_MODULO2_CONFIG.perguntas[i - 1];
            let respostaCorreta = false;

            if (selectedId === `${pergunta.respostaCorreta}_m2q${i}`) {
                respostaCorreta = true;
            } else if (textLower.includes(`${pergunta.respostaCorreta})`)) {
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
                message: respostaCorreta ? `✅ Correto! ${pergunta.explicacao}` : `❌ Incorreta. ${pergunta.explicacao}`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Se não é a última pergunta, continuar
            if (i < 6) {
                const proximaPergunta = QUIZ_MODULO2_CONFIG.perguntas[i];
                await sendMessage(sender, 'send-message', {
                    message: proximaPergunta.pergunta,
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
                            { id: `a_m2q${i + 1}`, title: `A) ${proximaPergunta.alternativas.a}`, description: '' },
                            { id: `b_m2q${i + 1}`, title: `B) ${proximaPergunta.alternativas.b}`, description: '' },
                            { id: `c_m2q${i + 1}`, title: `C) ${proximaPergunta.alternativas.c}`, description: '' },
                            { id: `d_m2q${i + 1}`, title: `D) ${proximaPergunta.alternativas.d}`, description: '' },
                        ],
                    }],
                };

                await sendMessage(sender, 'send-list-message', listMsg);
                await salvarInteracao(sender, `aguardando_quiz_m2q${i + 1}`, JSON.stringify(listMsg));
                return true;
            } else {
                // Última pergunta - calcular resultado final
                const percentual = (pontuacao / 6) * 100;

                if (percentual >= 80) {
                    await sendMessage(sender, 'send-message', {
                        message: `🎉 Parabéns! Você concluiu o Módulo 2 com ${pontuacao}/6 acertos (${percentual.toFixed(0)}%)!`,
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
                        message: `😔 Você acertou ${pontuacao}/6 questões (${percentual.toFixed(0)}%). É necessário pelo menos 80% para prosseguir.`,
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
        }
    }

    // Pular Módulo 2 para certificado
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

    // Confirmação de dados do certificado
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

        const certificadoPath = await gerarCertificadoBanco(contato.id);

        if (certificadoPath) {
            await sendMessage(sender, 'send-file', {
                path: certificadoPath,
                filename: `Certificado_${contato.nome.replace(/\s+/g, '_')}_SSMA.pdf`,
                caption: '🎓 Parabéns! Aqui está seu certificado de conclusão do treinamento SSMA!',
            });

            if (contato.email) {
                await enviarEmail(contato.email, certificadoPath, treinamento);
                await sendMessage(sender, 'send-message', {
                    message: '📧 Certificado também enviado por email!',
                });
            }

            await sendMessage(sender, 'send-message', {
                message: '✅ Treinamento concluído com sucesso! Obrigado pela participação! 🎉',
            });

            // Verificar se há outros treinamentos pendentes
            await verificarTreinamentosPendentes(contato, sender, sendMessage);
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

/**
 * Verifica se há treinamentos pendentes para o contato
 */
async function verificarTreinamentosPendentes(contato, sender, sendMessage) {
    try {
        // Buscar treinamentos da empresa do contato através da tabela de relacionamento
        const { EmpresaTreinamento } = require('../../../BancoDeDados/models');
        
        const empresaTreinamentos = await EmpresaTreinamento.findAll({
            where: { empresa_id: contato.empresaId }
        });
        
        const treinamentosIds = empresaTreinamentos.map(et => et.treinamento_id).filter(id => id !== 14);
        
        const treinamentosPendentes = await Treinamento.findAll({
            where: {
                id: { [Op.in]: treinamentosIds }
            }
        });

        if (treinamentosPendentes.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await sendMessage(sender, 'send-message', {
                message: '📚 Você possui outros treinamentos disponíveis!',
            });

            const listMsg = {
                title: '',
                description: 'Deseja ver seus treinamentos pendentes?',
                buttonText: 'Ver opções',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'ver_treinamentos_pendentes', title: 'Ver treinamentos disponíveis 📚', description: '' },
                        { id: 'nao_ver_treinamentos', title: 'Não, obrigado 🙏', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', listMsg);
            await salvarInteracao(sender, 'aguardando_opcao_treinamentos', JSON.stringify(listMsg));
        }
    } catch (error) {
        console.error('Erro ao verificar treinamentos pendentes:', error);
    }
}

/**
 * Mostra lista de treinamentos pendentes
 */
async function mostrarTreinamentosPendentes(contato, sender, sendMessage) {
    try {
        const { EmpresaTreinamento } = require('../../../BancoDeDados/models');
        
        const empresaTreinamentos = await EmpresaTreinamento.findAll({
            where: { empresa_id: contato.empresaId }
        });
        
        const treinamentosIds = empresaTreinamentos.map(et => et.treinamento_id).filter(id => id !== 14);
        
        const treinamentosPendentes = await Treinamento.findAll({
            where: {
                id: { [Op.in]: treinamentosIds }
            }
        });

        if (treinamentosPendentes.length === 0) {
            await sendMessage(sender, 'send-message', {
                message: '✅ Você não possui treinamentos pendentes no momento.',
            });
            return;
        }

        const rows = treinamentosPendentes.map(treinamento => ({
            id: `iniciar_treinamento_${treinamento.id}`,
            title: treinamento.nome,
            description: `Carga horária: ${treinamento.cargaHoraria || 'Não informada'}`
        }));

        // Adicionar opção para não iniciar nenhum
        rows.push({ id: 'nao_iniciar_treinamento', title: 'Não iniciar nenhum agora', description: '' });

        const listMsg = {
            title: '',
            description: 'Escolha um treinamento para iniciar:',
            buttonText: 'Ver treinamentos',
            listType: 'SINGLE_SELECT',
            sections: [{ title: '', rows }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'escolhendo_treinamento_pendente', JSON.stringify(listMsg));
    } catch (error) {
        console.error('Erro ao mostrar treinamentos pendentes:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro ao buscar treinamentos. Tente novamente.',
        });
    }
}

/**
 * Processa seleção de treinamentos pendentes
 */
async function processarTreinamentosPendentes(sender, selectedId, contato, sendMessage) {
    const ultimaInteracao = await obterUltimaInteracao(sender);

    // Ver treinamentos pendentes
    if (selectedId === 'ver_treinamentos_pendentes' ||
        ultimaInteracao?.tipo === 'aguardando_opcao_treinamentos') {
        await mostrarTreinamentosPendentes(contato, sender, sendMessage);
        return true;
    }

    // Não ver treinamentos
    if (selectedId === 'nao_ver_treinamentos') {
        await sendMessage(sender, 'send-message', {
            message: '🙏 Sem problemas! Quando quiser iniciar um treinamento, é só entrar em contato.',
        });
        return true;
    }

    // Iniciar treinamento específico
    if (selectedId?.startsWith('iniciar_treinamento_')) {
        const treinamentoId = selectedId.replace('iniciar_treinamento_', '');
        
        const treinamento = await Treinamento.findByPk(treinamentoId);
        if (treinamento) {
            await sendMessage(sender, 'send-message', {
                message: `🚀 Iniciando treinamento: ${treinamento.nome}`,
            });
            
            // Aqui você pode chamar a função específica do treinamento
            // Por exemplo: await executarTreinamentoEspecifico(treinamentoId, sender, contato, sendMessage);
            
            await sendMessage(sender, 'send-message', {
                message: '🚧 Sistema de treinamentos em desenvolvimento. Em breve você poderá iniciar este treinamento!',
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: '❌ Treinamento não encontrado.',
            });
        }
        return true;
    }

    // Não iniciar nenhum treinamento
    if (selectedId === 'nao_iniciar_treinamento') {
        await sendMessage(sender, 'send-message', {
            message: '🙏 Sem problemas! Quando quiser iniciar um treinamento, é só entrar em contato.',
        });
        return true;
    }

    return false;
}

module.exports = {
    executarTreinamento,
    processarRespostaSSMA,
    processarTreinamentosPendentes
};