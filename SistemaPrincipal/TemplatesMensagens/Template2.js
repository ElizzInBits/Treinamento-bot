const wppconnect = require('@wppconnect-team/wppconnect');
const { sendMessage } = require('./conexao/wppConnectTemplate');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const Message = require('../BancoDeDados/models/message');
const Contato = require('../BancoDeDados/models/contato');
const { gerarCertificado, enviarEmail } = require('./Certificados/certificados.js');

const timeouts = {};
const ultimasInteracoes = {};
const emProcessamento = new Set();

function agendarLembrete(sender, mensagemLista, tempoMs = 0.3 * 60 * 1000) {
    if (timeouts[sender]) clearTimeout(timeouts[sender]);
    timeouts[sender] = setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '👀 Ah, parece que alguém se esqueceu de mim... Vamos continuar?',
        });
        await sendMessage(sender, 'send-list-message', mensagemLista);
    }, tempoMs);
}

function salvarUltimaInteracao(sender, tipo, mensagem) {
    ultimasInteracoes[sender] = { tipo, mensagem };
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
            const selectedId = message.selectedRowId?.toLowerCase() || '';
            const rawText = message.body || '';

            if (timeouts[sender]) clearTimeout(timeouts[sender]);

            // ✅ Saudação inicial
            await sendMessage(sender, 'send-message', {
                message: '👋 Olá! Eu sou um bot que ajuda no seu treinamento de SSMA.',
            });

            // ✅ Verificação de cadastro
            const senderVariacoes = gerarVariacoes(sender);
            const contatos = await Contato.findAll();
            const contato = contatos.find((c) => {
                const variacoesContato = gerarVariacoes(c.telefone);
                return senderVariacoes.some((num) => variacoesContato.includes(num));
            });

            if (!contato) {
                await sendMessage(sender, 'send-message', {
                    message: `🤔 Humm, parece que você ainda não fez seu cadastro.\nClique no link abaixo para se cadastrar e iniciar seu treinamento:\n\n👉 http://92.112.178.26:3000/autoCadastro/`,
                });
                emProcessamento.delete(sender);
                return;
            }

            console.log(`📩 Mensagem de ${sender} (${contato.nome}): ${text}`);
            if (message.isGroupMsg) return;

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

                salvarUltimaInteracao(sender, 'quiz', listMsg);
                agendarLembrete(sender, getMensagemListaContinuar());
                return;
            }

            if (text === 'continuar' || selectedId === 'continuar') {
                const ultima = ultimasInteracoes[sender];
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
                return;
            }

            if (text === 'pausar' || selectedId === 'pausar') {
                await sendMessage(sender, 'send-message', {
                    message: 'Sem problemas! Quando quiser continuar, é só me chamar.',
                });
                agendarLembrete(sender, getMensagemListaContinuar());
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
                salvarUltimaInteracao(sender, 'quiz', listMsg);
                agendarLembrete(sender, getMensagemListaContinuar());
                return;
            }

            if (text === 'começar agora!! 😎 🔥🔥🔥' || selectedId === 'começar agora') {
                await sendMessage(sender, 'send-message', {
                    message: '🚀 Vamos começar o treinamento de SSMA! Prepare-se! 🔥🔥🔥',
                });
                await sendMessage(sender, 'send-message', {
                    message: `✅ Modulo 1️ - 📚 *Conceitos Fundamentais* \n\n1️⃣ Segurança e Saúde no Trabalho (SST) \nConjunto de medidas para previnir doenças e acidentes no trabalho. \n\n2️⃣ Premissas básicas de SST \n• Segurança é responsabilidade de todos \n• A consciência previne acidentes\n• Quem descumpre normas, se coloca em risco`,
                });
                await sendMessage(sender, 'send-message', {
                    message: '*Para continuar, digite o número 1️⃣*',
                });
                salvarUltimaInteracao(sender, 'quiz', '*Para continuar, digite o número 1️⃣*');
                agendarLembrete(sender, getMensagemListaContinuar());
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
                salvarUltimaInteracao(sender, 'quiz', quizList);
                agendarLembrete(sender, getMensagemListaContinuar());
                return;
            }

            if (['a', 'b', 'c', 'd'].includes(text)) {
                const respostaCorreta = 'b';
                if (text !== respostaCorreta) {
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
                await sendMessage(sender, 'send-message', {
                    message: '🎓 Agora, por favor, me envie seu nome completo para emissão do certificado.',
                });
                await contato.update({ statusTreinamento: 'concluído' });

                salvarUltimaInteracao(sender, 'nome', 'Por favor, me envie seu nome completo para emissão do certificado.');
                agendarLembrete(sender, getMensagemListaContinuar());
                return;
            }

            if (contato.statusTreinamento === 'concluído') {
                if (!contato.nomeCompleto) {
                    contato.nomeCompleto = rawText.trim();
                    await contato.save();
                    await sendMessage(sender, 'send-message', {
                        message: '👍 Nome completo recebido. Agora, me envie seu e-mail para que eu possa enviar o seu certificado.',
                    });
                    salvarUltimaInteracao(sender, 'email', 'Por favor, me envie seu e-mail para envio do certificado.');
                    agendarLembrete(sender, getMensagemListaContinuar());
                    return;
                }

                if (!contato.email) {
                    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
                    if (!emailRegex.test(text)) {
                        await sendMessage(sender, 'send-message', {
                            message: '⚠️ E-mail inválido! Por favor, insira um e-mail válido.',
                        });
                        salvarUltimaInteracao(sender, 'email', 'Por favor, me envie seu e-mail para envio do certificado.');
                        agendarLembrete(sender, getMensagemListaContinuar());
                        return;
                    }

                    contato.email = text;
                    await contato.save();
                }

                if (contato.nomeCompleto && contato.email) {
                    await sendMessage(sender, 'send-message', {
                        message: '📧 Informações encontradas! Gerando seu certificado...',
                    });

                    try {
                        const certificadoPath = await gerarCertificado(contato.nomeCompleto);
                        await enviarEmail(contato.email, certificadoPath);
                        await sendMessage(sender, 'send-message', {
                            message: `🎉 Seu certificado foi gerado!\n\nEle foi enviado por e-mail e também está disponível aqui:`,
                        });
                        await sendMessage(sender, 'send-file', {
                            path: certificadoPath,
                            filename: 'certificado.pdf',
                        });
                    } catch (err) {
                        await sendMessage(sender, 'send-message', {
                            message: '❌ Ocorreu um erro ao gerar ou enviar seu certificado.',
                        });
                    }
                    return;
                }
            }


            const respostasEsperadas = ['começar agora!! 😎 🔥🔥🔥', 'não, começo assim que possível 👀 😅', 'pronto', '1', 'a', 'b', 'c', 'd'];
        await verificarRespostaEsperada(sender, text, respostasEsperadas);

    } catch (error) {
        console.error(`❌ Erro no processamento da mensagem de ${sender}:`, error);
    } finally {
        emProcessamento.delete(sender);
    }
});
}
