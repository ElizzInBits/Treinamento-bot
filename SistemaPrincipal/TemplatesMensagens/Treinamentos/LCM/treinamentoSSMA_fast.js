//Script de Treinamento SSMA - VERSÃO OTIMIZADA
//ID do Treinamento: 1

const { Treinamento, Contato } = require('../../../BancoDeDados/models');
const { Interacao, Empresa } = require('../../../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('../../Certificados/certificados2.js');
const { Op } = require('sequelize');

// Respostas aceitas para verificação
const RESPOSTAS_POSITIVAS = ['sim', 'vamos', 'pode mandar', 'começar', 'iniciar', 'pronto', 'ok', 'vamos nessa'];
const RESPOSTAS_NEGATIVAS = ['não', 'nao', 'ainda não', 'ainda nao', 'depois', 'mais tarde', 'preciso me preparar'];

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
 * Executa o treinamento SSMA - VERSÃO RÁPIDA
 */
async function executarTreinamento(sender, contato, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: `🚀 Bem-vindo ao treinamento SSMA! Vamos começar direto com o conteúdo!`,
    });

    await sendMessage(sender, 'send-message', {
        message: '🎯 *CONCEITOS BÁSICOS DE SSMA*\n\n⭐ A Segurança é IMPRESCINDÍVEL\n⭐ A responsabilidade é INTRANSFERÍVEL\n⭐ Meta: ZERO acidentes\n\n🚨 *TIPOS DE ACIDENTES*\n🏥 Pessoal: danos físicos\n🌍 Ambiental: prejuízos ao meio ambiente\n🔧 Material: danos a equipamentos\n⚡ Quase acidente: poderia ter sido acidente',
    });

    // Ir direto para o quiz
    const perguntaAtual = QUIZ_CONFIG.perguntas[0];
    await sendMessage(sender, 'send-message', {
        message: 'Agora vamos testar seus conhecimentos! 🧠\n\n' + perguntaAtual.pergunta,
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
}

/**
 * Processa as respostas do treinamento SSMA - VERSÃO OTIMIZADA
 */
async function processarRespostaSSMA(sender, text, selectedId, contato, sendMessage) {
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const textLower = text.toLowerCase();

    // Processar questões do quiz (1-8) - SEM DELAYS
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

            // Se não é a última pergunta, continuar
            if (i < 8) {
                const proximaPergunta = QUIZ_CONFIG.perguntas[i];
                await sendMessage(sender, 'send-message', {
                    message: proximaPergunta.pergunta,
                });

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
                // Última pergunta - resultado final
                const percentual = (pontuacao / 8) * 100;

                if (percentual >= 80) {
                    await sendMessage(sender, 'send-message', {
                        message: `🎉 Parabéns! Você concluiu o treinamento com ${pontuacao}/8 acertos (${percentual.toFixed(0)}%)!`,
                    });

                    const listMsgCert = {
                        title: '',
                        description: `Confirme seus dados para o certificado:\n\n👤 Nome: ${contato.nome}\n📧 Email: ${contato.email || 'Não informado'}\n\nOs dados estão corretos?`,
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
                        message: `😔 Você acertou ${pontuacao}/8 questões (${percentual.toFixed(0)}%). É necessário pelo menos 80% para prosseguir.\n\nVamos tentar novamente!`,
                    });

                    // Reiniciar quiz
                    await salvarInteracao(sender, 'quiz_pontuacao', '0');
                    const perguntaAtual = QUIZ_CONFIG.perguntas[0];
                    
                    await sendMessage(sender, 'send-message', {
                        message: perguntaAtual.pergunta,
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
            }
        }
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

    return false;
}

/**
 * Gera e envia certificado do treinamento SSMA
 */
async function gerarEEnviarCertificadoSSMA(contato, sender, sendMessage) {
    try {
        const certificadoPath = await gerarCertificadoBanco(contato.id);

        if (certificadoPath) {
            await sendMessage(sender, 'send-file', {
                path: certificadoPath,
                filename: `Certificado_${contato.nome.replace(/\s+/g, '_')}_SSMA.pdf`,
                caption: '🎓 Parabéns! Aqui está seu certificado de conclusão do treinamento SSMA!',
            });

            if (contato.email) {
                const treinamento = await Treinamento.findByPk(1);
                await enviarEmail(contato.email, certificadoPath, treinamento);
                await sendMessage(sender, 'send-message', {
                    message: '📧 Certificado também enviado por email!',
                });
            }

            // Atualizar status do contato para concluído
            await contato.update({ statusTreinamento: 'concluído' });
            
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

console.log('📝 treinamentoSSMA_fast.js carregado - VERSÃO OTIMIZADA');