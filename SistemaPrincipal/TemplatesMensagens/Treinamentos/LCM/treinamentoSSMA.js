//Script de Treinamento SSMA
//ID do Treinamento: 14

// sendMessage will be passed as parameter to avoid circular dependency
const { Treinamento } = require('../../../BancoDeDados/models');
const { Interacao, Empresa } = require('../../../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('../../Certificados/certificados2.js');

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

// Configurações do quiz
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
    ],
    perguntaAtual: 0
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
            caption: 'SSMA'
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/SSMA.png',
            filename: 'SSMA.png',
            caption: 'SSMA - Segurança, Saúde e Meio Ambiente'
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        await sendMessage(sender, 'send-file', {
            path: 'C:/Treinamento-bot/SistemaPrincipal/TemplatesMensagens/Treinamentos/LCM/Imagens/SST.png',
            filename: 'SST.png',
            caption: 'Saúde e Segurança no Trabalho'
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
                message: `🎉 Parabéns! Você concluiu o quiz com ${pontuacaoFinal}/4 acertos (${percentual.toFixed(0)}%)!`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
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
            description: `Confirme seus dados para o certificado:\n\n👤 Nome: ${contato.nome}\n📧 Email: ${contato.email || 'Não informado'}\n🏢 Empresa: ${nome.empresa || 'Não informada'}\n\nOs dados estão corretos?`,
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

    // Old quiz logic (remove this section)
    if (false) { // Disabled old logic
        if (selectedId === QUIZ_CONFIG.respostaCorreta || selectedId === 'b_ssma') {
            await sendMessage(sender, 'send-message', {
                message: `✅ Correto! ${QUIZ_CONFIG.explicacao}\n\n🎉 Parabéns! Você concluiu o treinamento SSMA com sucesso!`,
            });

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
        } else {
            await sendMessage(sender, 'send-message', {
                message: `❌ Resposta incorreta. A resposta correta é: B) ${QUIZ_CONFIG.alternativas.b}\n\n${QUIZ_CONFIG.explicacao}\n\n🎉 Mesmo assim, parabéns por participar do treinamento!`,
            });

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
        }
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

    // Usuário pronto para começar
    if (selectedId === 'pronto_ssma') {
        await sendMessage(sender, 'send-message', {
            message: '🚀 Excelente! Vamos começar o treinamento SSMA!\n\n' + QUIZ_CONFIG.pergunta,
        });

        const listMsg = {
            title: '',
            description: 'Escolha a alternativa correta:',
            buttonText: 'Ver alternativas',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_ssma', title: `A) ${QUIZ_CONFIG.alternativas.a}`, description: '' },
                    { id: 'b_ssma', title: `B) ${QUIZ_CONFIG.alternativas.b}`, description: '' },
                    { id: 'c_ssma', title: `C) ${QUIZ_CONFIG.alternativas.c}`, description: '' },
                    { id: 'd_ssma', title: `D) ${QUIZ_CONFIG.alternativas.d}`, description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_quiz_ssma', JSON.stringify(listMsg));
        return true;
    }

    // Confirmação de dados para certificado
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