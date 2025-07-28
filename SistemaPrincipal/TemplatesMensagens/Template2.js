// ========================================
// IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS
// ========================================
const wppconnect = require('@wppconnect-team/wppconnect');
const { sendMessage } = require('./conexao/wppConnectTemplate');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const Message = require('../BancoDeDados/models/message');
const { Contato, Interacao } = require('../BancoDeDados/models');



// ========================================
// VARIÁVEIS DE CONTROLE GLOBAIS
// ========================================
const timeouts = {};
const emProcessamento = new Set();
const saudacoesEnviadas = new Set();

// ========================================
// CONSTANTES E CONFIGURAÇÕES
// ========================================
const TEMPO_LEMBRETE = 0.3 * 60 * 1000; // 18 segundos

const RESPOSTAS_POSITIVAS = [
    'sim',
    'sim, os dados estão corretos',
    'os dados estão corretos',
    'dados corretos',
    'confirmar',
    'sim estão corretos'
];

const RESPOSTAS_NEGATIVAS = [
    'não',
    'não, preciso corrigir',
    'não, os dados não são corretos',
    'os dados não são corretos',
    'dados incorretos',
    'não estão corretos'
];

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Limpa um número de telefone removendo caracteres especiais
 */
function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

/**
 * Gera variações de um número brasileiro (com e sem o 9)
 */
function gerarVariacoes(numeroCompleto) {
    const limpo = limparNumero(numeroCompleto);
    if (!limpo.startsWith('55') || limpo.length < 10) return [limpo];

    const ddd = limpo.slice(2, 4);
    const base = limpo.slice(4);
    let var1 = limpo;
    let var2 = limpo;

    if (base.length === 9 && base[0] === '9') {
        var2 = '55' + ddd + base.slice(1);
    } else if (base.length === 8) {
        var2 = '55' + ddd + '9' + base;
    }

    return [var1, var2];
}

/**
 * Verifica se uma resposta está entre as opções válidas
 */
async function verificarRespostaEsperada(sender, resposta, opcoesValidas) {
    if (!opcoesValidas.includes(resposta)) {
        await sendMessage(sender, 'send-message', {
            message: '⚠️ Ops, não entendi sua resposta. Tente novamente com uma opção válida!',
        });
        return false;
    }
    return true;
}

// ========================================
// FUNÇÕES DE AGENDAMENTO E INTERAÇÃO
// ========================================

/**
 * Agenda um lembrete para o usuário
 */
function agendarLembrete(sender, mensagemLista, tempoMs = TEMPO_LEMBRETE) {
    if (timeouts[sender]) clearTimeout(timeouts[sender]);

    timeouts[sender] = setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '👀 Ah, parece que alguém se esqueceu de mim... Vamos continuar?',
        });
        await sendMessage(sender, 'send-list-message', mensagemLista);
    }, tempoMs);
}

/**
 * Salva a última interação do usuário no banco
 */
async function salvarUltimaInteracao(sender, tipo, mensagem) {
    await Interacao.upsert({ telefone: sender, tipo, mensagem });
}

/**
 * Obtém a última interação do usuário
 */
async function obterUltimaInteracao(sender) {
    return await Interacao.findOne({
        where: { telefone: sender },
        order: [['updatedAt', 'DESC']],
    });
}

// ========================================
// TEMPLATES DE MENSAGENS
// ========================================

/**
 * Retorna template da mensagem de continuar
 */
function getMensagemListaContinuar() {
    return {
        title: '',
        description: 'Escolha uma opção:',
        buttonText: 'Continuar',
        listType: 'SINGLE_SELECT',
        sections: [
            {
                title: '',
                rows: [
                    { id: 'continuar', title: 'Continuar de onde parei', description: '' },
                    { id: 'pausar', title: 'Continuo assim que possível', description: '' },
                ],
            },
        ],
    };
}

/**
 * Retorna template do quiz inicial
 */
function getQuizInicial() {
    return {
        title: '',
        description:
            'Qual das alternativas é uma premissa básica de SST?\n\nA) Só a Empresa é responsável\n\nB) Segurança é de responsabilidade coletiva\n\nC) Só os supervisores devem usar EPI\n\nD) Acidentes não podem ser evitados',
        buttonText: 'Responder',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'a', title: 'A', description: '' },
                { id: 'b', title: 'B', description: '' },
                { id: 'c', title: 'C', description: '' },
                { id: 'd', title: 'D', description: '' },
            ],
        }],
    };
}

/**
 * Retorna template de confirmação de dados
 */
function getConfirmacaoDados(nomeCompleto, emailCadastrado) {
    return {
        title: '',
        description: `🎓 *Confirmação dos dados para o certificado:*\n\n👤 *Nome:* ${nomeCompleto}\n📧 *E-mail:* ${emailCadastrado}\n\nOs dados estão corretos?`,
        buttonText: 'Confirmar',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'dados_corretos', title: 'Sim, os dados estão corretos', description: '' },
                { id: 'dados_incorretos', title: 'Não, preciso corrigir', description: '' },
            ],
        }],
    };
}

function getFinalizarTreinamento() {
    return {
        title: '',
        description: 'Clique na opção abaixo para finalizar seu treinamento:',
        buttonText: 'Finalizar',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'finalizar_treinamento', title: '✅ Treinamento finalizado', description: '' },
            ],
        }],
    };
}

// ========================================
// FUNÇÕES DE PROCESSAMENTO DE MENSAGENS
// ========================================

/**
 * Processa comandos de continuar/pausar
 */
async function processarComandosContinuar(sender, text, selectedId) {
    if (text === 'continuar' || selectedId === 'continuar') {
        const ultima = await obterUltimaInteracao(sender);
        if (ultima) {
            if (ultima.tipo === 'quiz') {
                await sendMessage(sender, 'send-list-message', ultima.mensagem);
            } else {
                await sendMessage(sender, 'send-message', { message: ultima.mensagem });
            }
            agendarLembrete(sender, getMensagemListaContinuar());
        } else {
            await sendMessage(sender, 'send-message', {
                message: '❗️Não encontrei onde você parou. Vamos começar do início?',
            });
            await sendMessage(sender, 'send-list-message', getMensagemListaContinuar());
        }
        return true;
    }

    if (text === 'pausar' || selectedId === 'pausar') {
        await sendMessage(sender, 'send-message', {
            message: 'Sem problemas! Quando quiser continuar, é só me chamar.',
        });
        agendarLembrete(sender, getMensagemListaContinuar());
        return true;
    }

    return false;
}

/**
 * Verifica se o contato está cadastrado
 */
async function verificarCadastro(sender) {
    const senderVariacoes = gerarVariacoes(sender);
    const contatos = await Contato.findAll();

    return contatos.find((c) => {
        const variacoesContato = gerarVariacoes(c.telefone);
        return senderVariacoes.some((num) => variacoesContato.includes(num));
    });
}

/**
 * Processa confirmação de dados
 */
async function processarConfirmacaoDados(sender, textoNormalizado, selectedIdNormalizado, contato) {
    // Dados corretos
    if (selectedIdNormalizado === 'dados_corretos' || RESPOSTAS_POSITIVAS.includes(textoNormalizado)) {
        const nomeCompleto = contato.nomeCompleto || contato.nome || 'Nome não informado';
        const emailCadastrado = contato.email || 'E-mail não informado';

        if (nomeCompleto === 'Nome não informado' || emailCadastrado === 'E-mail não informado') {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ Dados incompletos no cadastro. Por favor, entre em contato com o suporte.',
            });
            return true;
        }

        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados!',
        });
        await gerarEEnviarCertificado(contato, sender);
        return true;
    }

    // Dados incorretos
    if (selectedIdNormalizado === 'dados_incorretos' || RESPOSTAS_NEGATIVAS.includes(textoNormalizado)) {
        await sendMessage(sender, 'send-message', {
            message: '📝 Para corrigir seus dados, por favor, me envie seu nome completo correto.',
        });
        await salvarUltimaInteracao(sender, 'corrigir_nome', 'Por favor, me envie seu nome completo correto.');
        agendarLembrete(sender, getMensagemListaContinuar());
        return true;
    }

    return false;
}

/**
 * Processa correção de dados
 */
async function processarCorrecaoDados(sender, rawText, contato) {
    const ultimaInteracao = await obterUltimaInteracao(sender);

    // Correção de nome
    if (ultimaInteracao?.tipo === 'corrigir_nome') {
        contato.nomeCompleto = rawText.trim();
        await contato.save();

        await sendMessage(sender, 'send-message', {
            message: '👍 Nome atualizado! Agora, me envie seu e-mail correto.',
        });
        await salvarUltimaInteracao(sender, 'corrigir_email', 'Por favor, me envie seu e-mail correto.');
        agendarLembrete(sender, getMensagemListaContinuar());
        return true;
    }

    // Correção de email
    if (ultimaInteracao?.tipo === 'corrigir_email') {
        if (!EMAIL_REGEX.test(rawText.trim())) {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ E-mail inválido! Por favor, insira um e-mail válido.',
            });
            await salvarUltimaInteracao(sender, 'corrigir_email', 'Por favor, me envie seu e-mail correto.');
            agendarLembrete(sender, getMensagemListaContinuar());
            return true;
        }

        contato.email = rawText.trim();
        await contato.save();

        await sendMessage(sender, 'send-message', {
            message: '✅ E-mail atualizado! Gerando seu certificado...',
        });
        await gerarEEnviarCertificado(contato, sender);
        return true;
    }

    return false;
}

/**
 * Inicia o treinamento para novos usuários
 */
async function iniciarTreinamento(sender, contato) {
    await sendMessage(sender, 'send-message', {
        message: `👋 Olá, ${contato.nome}! Seja bem-vindo(a) à equipe LCM! 💼\n\nVocê está iniciando seu Treinamento Básico de SSMA...`,
    });

    await sendMessage(sender, 'send-message', {
        message: '👷 Objetivos do treinamento:\n\n• Respeitar normas de SSMA\n• Evitar acidentes\n• Cuidar da sua segurança e a dos colegas\n• Nunca realizar tarefas sem capacitação',
    });

    await sendMessage(sender, 'send-file', {
        path: '../media/SSMA.webp',
        filename: 'SSMA',
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
                { id: 'começar agora', title: 'Começar agora!! 😎 🔥🔥🔥', description: '' },
                { id: 'não começar', title: 'Não, começo assim que possível 👀 😅', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await contato.update({ statusTreinamento: 'em andamento' });
    await salvarUltimaInteracao(sender, 'quiz', listMsg);
    agendarLembrete(sender, getMensagemListaContinuar());
}

/**
 * Processa as opções do quiz
 */
async function processarQuiz(sender, text, selectedId, contato) {
    // Quiz inicial - alternativas A, B, C, D
    if (['a', 'b', 'c', 'd'].includes(text) || ['a', 'b', 'c', 'd'].includes(selectedId)) {
        const respostaCorreta = 'b';
        const respostaUsuario = text || selectedId;

        if (respostaUsuario !== respostaCorreta) {
            await sendMessage(sender, 'send-message', {
                message: '❌ Resposta incorreta! A resposta correta é B) Segurança é de responsabilidade coletiva.',
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: '✅ Resposta correta! Segurança é de responsabilidade coletiva!',
            });
        }

        await sendMessage(sender, 'send-message', {
            message: '🎉 Parabéns, você completou o Módulo 1!'
        });

        await sendMessage(sender, 'send-sticker-gif', {
            path: '../media/palmas.gif',
            filename: 'palmas',
        });

        const nomeCompleto = contato.nomeCompleto || contato.nome || 'Nome não informado';
        const emailCadastrado = contato.email || 'E-mail não informado';
        const confirmacaoList = getConfirmacaoDados(nomeCompleto, emailCadastrado);

        await sendMessage(sender, 'send-list-message', confirmacaoList);
        await salvarUltimaInteracao(sender, 'confirmacao_dados', confirmacaoList);
        agendarLembrete(sender, getMensagemListaContinuar());
        await contato.update({ statusTreinamento: 'concluído' });
        return true;
    }

    return false;
}

/**
 * Gera e envia certificado para o usuário
 */
async function gerarEEnviarCertificado(contato, sender) {
  await sendMessage(sender, 'send-message', {
    message: '📧 Gerando seu certificado...\n\nIsso pode demorar um pouco...',
  });

  try {
    const nomeParaCertificado = contato.nomeCompleto || contato.nome;
    
    // Dados padrão para o treinamento SSMA
    const dadosTreinamento = {
      nome: 'Treinamento Básico de SSMA',
      modalidade: 'EAD - Ensino à Distância',
      cargaHoraria: '4',
      tipo: 'Treinamento Básico',
      emConformidade: 'Em conformidade com as normas de Segurança, Saúde e Meio Ambiente aplicáveis.',
      documento: 'CPF: ***.***.***-**',
      periodo: new Date().toLocaleDateString('pt-BR')
    };
    
    console.log('📝 Gerando certificado para:', nomeParaCertificado);
    const certificadoPath = await gerarCertificado(nomeParaCertificado, dadosTreinamento);
    
    console.log('📧 Enviando e-mail para:', contato.email);
    await enviarEmail(contato.email, certificadoPath);

    await sendMessage(sender, 'send-message', {
      message: `🎉 Seu certificado foi gerado com sucesso! \n\n📧 Ele foi enviado para: ${contato.email}\n\n📄 Também está disponível aqui:`,
    });

    await sendMessage(sender, 'send-file', {
      path: certificadoPath,
      filename: 'Certificado_SSMA.pdf',
      caption: '🎓 Seu certificado de conclusão do Treinamento SSMA'
    });

    await sendMessage(sender, 'send-list-message', getFinalizarTreinamento());
    await salvarUltimaInteracao(sender, 'finalizacao', getFinalizarTreinamento());

  } catch (err) {
    console.error('❌ Erro detalhado ao gerar certificado:', err);
    await sendMessage(sender, 'send-message', {
      message: `❌ Ocorreu um erro ao gerar seu certificado:\n\n${err.message}\n\nPor favor, entre em contato com o suporte.`,
    });
  }
}



// ========================================
// FUNÇÃO PRINCIPAL DE PROCESSAMENTO
// ========================================

async function processarMensagem(message) {
    const sender = message.from.replace('@c.us', '');

    if (emProcessamento.has(sender)) {
        console.log(`⏳ Ignorando nova mensagem de ${sender}, já está em processamento.`);
        return;
    }

    emProcessamento.add(sender);

    try {
        const text = message.body?.toLowerCase() || '';
        const selectedId = message.selectedRowId || '';
        const rawText = message.body || '';

        await salvarUltimaInteracao(sender, 'resposta', rawText.trim());

        if (timeouts[sender]) clearTimeout(timeouts[sender]);

        // Saudação inicial apenas uma vez
        if (!saudacoesEnviadas.has(sender)) {
            console.log('📤 TENTANDO ENVIAR MENSAGEM PARA:', sender);
            const resultado = await sendMessage(sender, 'send-message', {
                message: '👋 Olá! Eu sou um bot que vai aplicar seus treinamentos.',
            });
            console.log('📝 RESULTADO:', resultado);
            saudacoesEnviadas.add(sender);
        }

        // Processar comandos continuar/pausar
        if (await processarComandosContinuar(sender, text, selectedId)) {
            return;
        }

        // Verificação de cadastro
        const contato = await verificarCadastro(sender);
        if (!contato) {
            await sendMessage(sender, 'send-message', {
                message: `🤔 Humm, parece que você ainda não fez seu cadastro.\nClique no link abaixo para se cadastrar e iniciar seu treinamento:\n\n👉 bit.ly/44xw45W`,
            });
            return;
        }

        // ✅ Atualizar a última interação no campo do contato
        contato.ultimaInteracao = rawText.trim();
        await contato.save();

        const correuCorrecao = await processarCorrecaoDados(sender, rawText, contato);
        if (correuCorrecao) return;

        console.log(`📩 Mensagem de ${sender} (${contato.nome}): ${text}`);

        // Ignorar mensagens de grupo
        if (message.isGroupMsg) {
            return;
        }

        const textoNormalizado = rawText.trim().toLowerCase();
        const selectedIdNormalizado = (selectedId || '').trim().toLowerCase();

        // Processar confirmação de dados para usuários que concluíram
        if (contato.statusTreinamento === 'concluído') {
            if (await processarConfirmacaoDados(sender, textoNormalizado, selectedIdNormalizado, contato)) {
                return;
            }
            if (await processarCorrecaoDados(sender, rawText, contato)) {
                return;
            }
        }

        // Iniciar treinamento para novos usuários
        if (contato.statusTreinamento === 'não iniciado') {
            await iniciarTreinamento(sender, contato);
            return;
        }

        // Opções do treinamento em andamento
        if (text === 'não, começo assim que possível 👀 😅' || selectedId === 'não começar') {
            const listMsg = {
                title: '',
                description: 'Escolha uma opção:',
                buttonText: 'Estou pronto(a)',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [{ id: 'pronto', title: 'Começar agora!! 😎 🔥🔥🔥', description: '' }],
                }],
            };

            await sendMessage(sender, 'send-message', {
                message: '😅 Sem problemas! Quando estiver pronto, é só avisar. Estamos aqui para ajudar! 👷‍♂️👷‍♀️',
            });
            await sendMessage(sender, 'send-list-message', listMsg);
            await salvarUltimaInteracao(sender, 'quiz', listMsg);
            agendarLembrete(sender, getMensagemListaContinuar());
            return;
        }

        // Começar treinamento
        if (text === 'começar agora!! 😎 🔥🔥🔥' || selectedId === 'começar agora' || selectedId === 'pronto') {
            await sendMessage(sender, 'send-message', {
                message: '🚀 Vamos começar o treinamento de SSMA! Prepare-se! 🔥🔥🔥',
            });

            await sendMessage(sender, 'send-message', {
                message: `✅ Modulo 1️ - 📚 *Conceitos Fundamentais* \n\n1️⃣ Segurança e Saúde no Trabalho (SST) \nConjunto de medidas para previnir doenças e acidentes no trabalho. \n\n2️⃣ Premissas básicas de SST \n• Segurança é responsabilidade de todos \n• A consciência previne acidentes\n• Quem descumpre normas, se coloca em risco`,
            });

            await sendMessage(sender, 'send-message', {
                message: '*Para continuar, digite o número 1️⃣*',
            });

            await salvarUltimaInteracao(sender, 'quiz', '*Para continuar, digite o número 1️⃣*');
            agendarLembrete(sender, getMensagemListaContinuar());
            return;
        }

        // Continuar para o quiz
        if (text === '1') {
            await sendMessage(sender, 'send-message', {
                message: 'Vamos continuar!🚀🚀🚀 \n\nPra esquentar as coisas, vamos fazer um pequeno quiz! 😜 🔥🔥🔥',
            });

            const quizList = getQuizInicial();
            await sendMessage(sender, 'send-list-message', quizList);
            await salvarUltimaInteracao(sender, 'quiz', quizList);
            agendarLembrete(sender, getMensagemListaContinuar());
            return;
        }

        // Processar respostas do quiz
        if (await processarQuiz(sender, text, selectedId, contato)) {
            return;
        }

        // Quiz adicional para usuários em andamento
        if (contato.statusTreinamento === 'em andamento' && ['2', '3', '4', '5'].includes(text)) {
            const quizList = {
                title: '',
                description: '*Pergunta:* Qual o objetivo do treinamento SSMA?',
                buttonText: 'Responda',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'a', title: 'Evitar acidentes', description: '' },
                        { id: 'b', title: 'Apenas cumprir regras', description: '' },
                        { id: 'c', title: 'Ignorar normas', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', quizList);
            await salvarUltimaInteracao(sender, 'quiz', quizList);
            agendarLembrete(sender, getMensagemListaContinuar());
            return;
        }

        // Finalizar treinamento
        if (selectedId === 'finalizar_treinamento' || text === '✅ treinamento finalizado') {
            await sendMessage(sender, 'send-message', {
                message: '👏 Muito bem! Ficamos felizes com sua participação. Até a próxima! 🚀',
            });
            return;
        }


        // Mensagem padrão para entradas não reconhecidas
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua mensagem. Por favor, use as opções fornecidas.',
        });
        agendarLembrete(sender, getMensagemListaContinuar());

    } catch (error) {
        console.error('Erro no processamento da mensagem:', error);
    } finally {
        emProcessamento.delete(sender);
    }
}

// Exportar função para ser usada externamente
module.exports = { processarMensagem };