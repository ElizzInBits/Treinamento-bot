const wppconnect = require('@wppconnect-team/wppconnect');
const { sendMessage } = require('./conexao/wppConnectTemplate');
const { connectDB, sequelize } = require('./BancoDeDados/database');
const Message = require('./BancoDeDados/models/message');
const Contato = require('./BancoDeDados/models/contato');
const { title } = require('process');

// Conectar ao banco e sincronizar models
(async () => {
    await connectDB();
    await sequelize.sync(); // Cria as tabelas se não existirem
})();

wppconnect
    .create({
        session: 'NERDWHATS_AMERICA',
        catchQR: (base64Qr, asciiQR) => {
            console.log('📱 Escaneie o QR Code abaixo com seu WhatsApp:');
            console.log(asciiQR);
        },
        statusFind: (status) => {
            console.log('📶 Status da sessão:', status); 
        },
    })
    .then((client) => start(client))
    .catch((err) => console.error('Erro ao iniciar WPPConnect:', err));

// Função para verificar se a resposta é uma das esperadas
async function verificarRespostaEsperada(sender, resposta, opcoesValidas) {
    if (!opcoesValidas.includes(resposta)) {
        await sendMessage(sender, 'send-message', {
            message: `⚠️ Ops, não entendi sua resposta. Tente novamente com uma opção válida!`,
        });
        return false; // Resposta inválida
    }
    return true; // Resposta válida
}

async function start(client) {
    client.onMessage(async (message) => {
        const sender = message.from.replace('@c.us', '');
        const text = message.body?.toLowerCase() || '';

        // VERIFICA SE O NÚMERO ESTÁ NA TABELA DE CONTATOS
        const contato = await Contato.findOne({ where: { telefone: sender } });
        if (!contato) {
            console.log(`Número ${sender} não está autorizado (não está no banco). Ignorando.`);
            return; // NÃO VAI RESPONDER SE NÃO ESTIVER NO BANCO
        }

        console.log(`📩 Mensagem recebida de ${sender} (${contato.nome}): ${text}`);

        if (message.isGroupMsg) return;

        // Verificação se o treinamento já foi iniciado
        if (contato.statusTreinamento === 'não iniciado') {
            await sendMessage(sender, 'send-message', {
                message: `👋 Olá, ${contato.nome}! Seja bem-vindo(a) à equipe LCM! 💼\n\nVocê está iniciando seu Treinamento Básico de SSMA...`,
            });

            await sendMessage(sender, 'send-message', {
                message: '👷 Objetivos do treinamento:\n\n• Respeitar normas de SSMA\n• Evitar acidentes\n• Cuidar da sua segurança e a dos colegas\n• Nunca realizar tarefas sem capacitação',
            });

            await sendMessage(sender, 'send-file', {
                path: './media/SSMA.webp',
                filename: 'SSMA',
                caption: '',
            });

            await sendMessage(sender, 'send-list-message', {
                title: '',
                description: '*Pronto para começar?* \nEscolha uma opção:',
                buttonText: 'Ver opções',
                listType: 'SINGLE_SELECT',
                sections: [
                    {
                        title: '',
                        rows: [
                            {
                                id: 'começar agora',
                                title: 'Começar agora!! 😎 🔥🔥🔥',
                                description: '',
                            },
                            {
                                id: 'não começar',
                                title: 'Não, começo assim que possível 👀 😅',
                                description: '',
                            },
                        ],
                    },
                ],
            });

            // Atualiza o status do treinamento para 'em andamento'
            await Contato.update({ statusTreinamento: 'em andamento' }, { where: { telefone: sender } });
            return; // Não seguir para os próximos passos, pois as mensagens iniciais já foram enviadas
        }

        // Tratamento de respostas após a escolha inicial
        if (text === 'não, começo assim que possível 👀 😅') {
            await sendMessage(sender, 'send-message', {
                message: '😅 Sem problemas! \nQuando estiver pronto, é só avisar. Estamos aqui para ajudar! 👷‍♂️👷‍♀️',
            });

            await sendMessage(sender, 'send-list-message', {
                title: '',
                description: 'Escolha uma opção:',
                buttonText: 'Estou pronto(a)',
                listType: 'SINGLE_SELECT',
                sections: [
                    {
                        title: '',
                        rows: [
                            {
                                id: 'pronto',
                                title: 'Começar agora!! 😎 🔥🔥🔥',
                                description: '',
                            },
                        ],
                    },
                ],
            });
            return; // Evita que outras verificações aconteçam após esta resposta
        }

        else if (text === 'começar agora!! 😎 🔥🔥🔥') {
            await sendMessage(sender, 'send-message', {
                message: `🚀 Vamos começar o treinamento de SSMA! Prepare-se! 🔥🔥🔥`,
            });

            await sendMessage(sender, 'send-message', {
                message: `✅ Modulo 1️ - 📚 *Conceitos Fundamentais*
                    \n\n1️⃣ Segurança e Saúde no Trabalho (SST)
                    \nConjunto de medidas para previnir doenças e acidentes no trabalho.

                    \n\n2️⃣ Premissas básicas de SST
                    \n • Segurança é responsabilidade de todos
                    \n • A consciência previne acidentes
                    \n • Quem descumpre normas, se coloca em risco`,
            });

            await sendMessage(sender, 'send-message', {
                message: '*Para continuar, digite o número 1️⃣*',
            });
        }

        // Verificação da resposta para continuar
        if (text === '1') {
            await sendMessage(sender, 'send-message', {
                message: `Vamos continuar!🚀🚀🚀 
                    \nPra esquentar as coisas, vamos fazer um pequeno quiz! 😜 🔥🔥🔥`,
            });

            await sendMessage(sender, 'send-list-message', {
                title: '',
                description: 'Qual das alternativas é uma premissa básica de SST? \n\nA) Só a Empresa é responsável pela segurança \n\nB) Segurança é de responsabilidade coletiva \n\nC) Só os supervisores devem usar EPI \n\nD) Acidentes não podem ser evitados',
                buttonText: 'Responder',
                listType: 'SINGLE_SELECT',
                sections: [
                    {
                        title: '',
                        rows: [
                            {
                                id: 'a',
                                title: 'A',
                                description: '',
                            },
                            {
                                id: 'b',
                                title: 'B',
                                description: '',
                            },
                            {
                                id: 'c',
                                title: 'C',
                                description: '',
                            },
                            {
                                id: 'd',
                                title: 'D',
                                description: '',
                            },
                        ],
                    },
                ],
            });

            return; // Evita que a resposta inválida seja tratada logo após a pergunta
        }

        // Verificação de respostas no quiz (após o quiz começar)
        if (['a', 'b', 'c', 'd'].includes(text)) {
            const respostaCorreta = 'b'; // Definindo a resposta correta

            if (text !== respostaCorreta) {
                await sendMessage(sender, 'send-message', {
                    message: `❌ Resposta incorreta! A resposta correta é B) Segurança é de responsabilidade coletiva.`,
                });
            } else {
                await sendMessage(sender, 'send-message', {
                    message: `✅ Resposta correta! Segurança é de responsabilidade coletiva!`,
                });
            }

            // Se a resposta for válida, faz o próximo passo ou encerra a interação
            
            await sendMessage(sender, 'send-message', {
                message: `🎉 Parabéns, você completou o Módulo 1!`,
            });
            await sendMessage(sender, 'send-sticker-gif', {
                path: './media/palmas.gif', // caminho relativo à pasta onde o script está
                filename: 'palmas',
                caption: ''
            });

            return;
        }

        // Verificação de respostas inesperadas (apenas nos pontos onde esperamos algo específico)
        const respostasEsperadas = [
            'começar agora!! 😎 🔥🔥🔥', 
            'não, começo assim que possível 👀 😅',
            'pronto',
            '1',
            'a',
            'b',
            'c',
            'd'
        ];

        // Verifica se a resposta do usuário é uma das opções esperadas, caso contrário, manda "Ops"
        await verificarRespostaEsperada(sender, text, respostasEsperadas);
    });
}
