const wppconnect = require('@wppconnect-team/wppconnect');
const { sendMessage } = require('./conexao/wppConnectTemplate');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const Message = require('../BancoDeDados/models/message');
const { Contato, Interacao } = require('../BancoDeDados/models');
const { gerarCertificado, enviarEmail } = require('./Certificados/certificados.js');

const timeouts = {};
const emProcessamento = new Set();
const saudacoesEnviadas = new Set();

function agendarLembrete(sender, mensagemLista, tempoMs = 0.3 * 60 * 1000) {
    if (timeouts[sender]) clearTimeout(timeouts[sender]);
    timeouts[sender] = setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '👀 Ah, parece que alguém se esqueceu de mim... Vamos continuar?',
        });
        await sendMessage(sender, 'send-list-message', mensagemLista);
    }, tempoMs);
}

async function salvarUltimaInteracao(sender, tipo, mensagem) {
    await Interacao.upsert({ telefone: sender, tipo, mensagem });
}

async function obterUltimaInteracao(sender) {
    return await Interacao.findOne({
        where: { telefone: sender },
        order: [['updatedAt', 'DESC']],
    });
}

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

function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

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

(async () => {
    await connectDB();
    await sequelize.sync();
})();

wppconnect.create({
    session: 'NERDWHATS_AMERICA',
    headless: 'new',
    executablePath: '/snap/bin/chromium',
    catchQR: (base64Qr, asciiQR) => {
        console.clear();
        console.log('📱 Escaneie o QR Code abaixo com seu WhatsApp:');
        console.log(asciiQR);
    },
    statusFind: (status) => {
        console.log('📶 Status da sessão:', status);
    },
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
})
    .then((client) => {
        console.log('🟢 Cliente conectado! Iniciando listener de mensagens...');
        start(client);
    })
    .catch((error) => {
        console.error('❌ Erro ao iniciar WPPConnect:', error);
    });

async function verificarRespostaEsperada(sender, resposta, opcoesValidas) {
    if (!opcoesValidas.includes(resposta)) {
        await sendMessage(sender, 'send-message', {
            message: '⚠️ Ops, não entendi sua resposta. Tente novamente com uma opção válida!',
        });
        return false;
    }
    return true;
}

async function start(client) {
    console.log('✅ Evento onMessage registrado com sucesso.');
    client.onMessage(async (message) => {
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

            if (timeouts[sender]) clearTimeout(timeouts[sender]);

            // ✅ Saudação inicial apenas uma vez
            if (!saudacoesEnviadas.has(sender)) {
                await sendMessage(sender, 'send-message', {
                    message: '👋 Olá! Eu sou um bot que vai aplicar seus treinamentos.',
                });
                saudacoesEnviadas.add(sender);
            }

            // ✅ Funcionalidade "continuar" 
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
                emProcessamento.delete(sender);
                return;
            }

            if (text === 'pausar' || selectedId === 'pausar') {
                await sendMessage(sender, 'send-message', {
                    message: 'Sem problemas! Quando quiser continuar, é só me chamar.',
                });
                agendarLembrete(sender, getMensagemListaContinuar());
                emProcessamento.delete(sender);
                return;
            }

            // ✅ Verificação de cadastro
            const senderVariacoes = gerarVariacoes(sender);
            const contatos = await Contato.findAll();
            const contato = contatos.find((c) => {
                const variacoesContato = gerarVariacoes(c.telefone);
                return senderVariacoes.some((num) => variacoesContato.includes(num));
            });

            if (!contato) {
                await sendMessage(sender, 'send-message', {
                    message: `🤔 Humm, parece que você ainda não fez seu cadastro.\nClique no link abaixo para se cadastrar e iniciar seu treinamento:\n\n👉 bit.ly/44xw45W`,
                });
                emProcessamento.delete(sender);
                return;
            }

            console.log(`📩 Mensagem de ${sender} (${contato.nome}): ${text}`);
            if (message.isGroupMsg) {
                emProcessamento.delete(sender);
                return;
            }

            const respostasPositivas = [
                'sim',
                'sim, os dados estão corretos',
                'os dados estão corretos',
                '✅ sim, os dados estão corretos',
                'dados corretos',
                'confirmar',
                'sim estão corretos'
            ];

            const respostasNegativas = [
                '❌ Não, preciso corrigir',
                'não',
                'não, os dados não são corretos',
                'os dados não são corretos',
                '❌ não, os dados não são corretos',
                'dados incorretos',
                'não estão corretos',

            ];

            console.log('selectedId:', selectedId);
            console.log('text:', text);
            console.log('rawText:', rawText);


            // Considera selectedId ou texto normal para resposta de confirmação
            const respostaConfirmacao = selectedId || text;

            if (
                respostaConfirmacao === 'dados_corretos' ||
                respostasPositivas.some((frase) => respostaConfirmacao.toLowerCase().includes(frase))
            ) {
                const nomeCompleto = contato.nomeCompleto || contato.nome || 'Nome não informado';
                const emailCadastrado = contato.email || 'E-mail não informado';

                if (nomeCompleto === 'Nome não informado' || emailCadastrado === 'E-mail não informado') {
                    await sendMessage(sender, 'send-message', {
                        message: '⚠️ Dados incompletos no cadastro. Por favor, entre em contato com o suporte.',
                    });
                    emProcessamento.delete(sender);
                    return;
                }

                await sendMessage(sender, 'send-message', {
                    message: '✅ Dados confirmados!',
                });
                await gerarEEnviarCertificado(contato, sender);
                emProcessamento.delete(sender);
                return;
            }

            //////
            if (
                selectedId === 'dados_incorretos' ||
                text === 'dados_incorretos' ||
                respostasNegativas.some((frase) => rawText.trim().toLowerCase() === frase.toLowerCase())
            ) {
                await sendMessage(sender, 'send-message', {
                    message: '📝 Para corrigir seus dados, por favor, me envie seu nome completo correto.',
                });
                await salvarUltimaInteracao(sender, 'corrigir_nome', 'Por favor, me envie seu nome completo correto.');
                agendarLembrete(sender, getMensagemListaContinuar());
                emProcessamento.delete(sender);
                return;
            }
            //////
            /*if (respostaConfirmacao === 'dados_incorretos') {
                await sendMessage(sender, 'send-message', {
                    message: '📝 Para corrigir seus dados, por favor, me envie seu nome completo correto.',
                });
                await salvarUltimaInteracao(sender, 'corrigir_nome', 'Por favor, me envie seu nome completo correto.');
                agendarLembrete(sender, getMensagemListaContinuar());
                emProcessamento.delete(sender);
                return;
            } */

            // Receber nome completo para correção
            if (contato.statusTreinamento === 'concluído') {
                const ultimaInteracao = await obterUltimaInteracao(sender);

                if (ultimaInteracao?.tipo === 'corrigir_nome') {
                    contato.nomeCompleto = rawText.trim();
                    await contato.save();

                    await sendMessage(sender, 'send-message', {
                        message: '👍 Nome atualizado! Agora, me envie seu e-mail correto.',
                    });
                    await salvarUltimaInteracao(sender, 'corrigir_email', 'Por favor, me envie seu e-mail correto.');
                    agendarLembrete(sender, getMensagemListaContinuar());
                    emProcessamento.delete(sender);
                    return;
                }

                if (ultimaInteracao?.tipo === 'corrigir_email') {
                    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;  // Ajustado regex para aceitar mais domínios
                    if (!emailRegex.test(rawText.trim())) {
                        await sendMessage(sender, 'send-message', {
                            message: '⚠️ E-mail inválido! Por favor, insira um e-mail válido.',
                        });
                        await salvarUltimaInteracao(sender, 'corrigir_email', 'Por favor, me envie seu e-mail correto.');
                        agendarLembrete(sender, getMensagemListaContinuar());
                        emProcessamento.delete(sender);
                        return;
                    }

                    contato.email = rawText.trim();
                    await contato.save();

                    await sendMessage(sender, 'send-message', {
                        message: '✅ E-mail atualizado! Gerando seu certificado...',
                    });
                    await gerarEEnviarCertificado(contato, sender);
                    emProcessamento.delete(sender);
                    return;
                }
            }


            if (contato.statusTreinamento === 'não iniciado') {
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
                emProcessamento.delete(sender);
                return;
            }

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
                emProcessamento.delete(sender);
                return;
            }

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
                emProcessamento.delete(sender);
                return;
            }

            if (text === '1') {
                await sendMessage(sender, 'send-message', {
                    message: 'Vamos continuar!🚀🚀🚀 \n\nPra esquentar as coisas, vamos fazer um pequeno quiz! 😜 🔥🔥🔥',
                });

                const quizList = {
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

                await sendMessage(sender, 'send-list-message', quizList);
                await salvarUltimaInteracao(sender, 'quiz', quizList);
                agendarLembrete(sender, getMensagemListaContinuar());
                emProcessamento.delete(sender);
                return;
            }

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

                await sendMessage(sender, 'send-message', { message: '🎉 Parabéns, você completou o Módulo 1!' });
                await sendMessage(sender, 'send-sticker-gif', {
                    path: '../media/palmas.gif',
                    filename: 'palmas',
                });

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
                            { id: 'dados_corretos', title: '✅ Sim, os dados estão corretos', description: '' },
                            { id: 'dados_incorretos', title: '❌ Não, preciso corrigir', description: '' },
                        ],
                    }],
                };

                await sendMessage(sender, 'send-list-message', confirmacaoList);
                await salvarUltimaInteracao(sender, 'confirmacao_dados', confirmacaoList);
                agendarLembrete(sender, getMensagemListaContinuar());

                await contato.update({ statusTreinamento: 'concluído' });
                emProcessamento.delete(sender);
                return;
            }

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
                emProcessamento.delete(sender);
                return;
            }

            await sendMessage(sender, 'send-message', {
                message: '🤔 Não entendi sua mensagem. Por favor, use as opções fornecidas.',
            });
            agendarLembrete(sender, getMensagemListaContinuar());
            emProcessamento.delete(sender);

        } catch (error) {
            console.error('Erro no processamento da mensagem:', error);
            emProcessamento.delete(sender);
        }
    });
}

async function gerarEEnviarCertificado(contato, sender) {
    await sendMessage(sender, 'send-message', {
        message: '📧 Gerando seu certificado...\n\nIsso pode demorar um pouco....',
    });

    try {
        const nomeParaCertificado = contato.nomeCompleto || contato.nome;
        const certificadoPath = await gerarCertificado(nomeParaCertificado);
        await enviarEmail(contato.email, certificadoPath);
        await sendMessage(sender, 'send-message', {
            message: `🎉 Seu certificado foi gerado! \n\nEle foi enviado para: ${contato.email}\n\nTambém está disponível aqui:`,
        });
        await sendMessage(sender, 'send-file', {
            path: certificadoPath,
            filename: 'certificado.pdf',
        });
    } catch (err) {
        console.error('Erro ao gerar certificado:', err);
        await sendMessage(sender, 'send-message', {
            message: '❌ Ocorreu um erro ao gerar ou enviar seu certificado. Tente novamente mais tarde.',
        });
    }
}