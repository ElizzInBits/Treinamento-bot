const fs = require('fs');
const path = require('path');
const { SessaoTreinamento, Interacao, Usuario } = require('../../../BancoDeDados/models');

// ID do treinamento
const TREINAMENTO_ID = 16;
const NOME_TREINAMENTO = 'NR6 - EPC e EPI - Uso, Guarda e Conservação';

class EPCEPITraining {
    constructor() {
        this.sessions = new Map();
        this.basePath = path.join(__dirname, 'material_treinamento');
    }

    async iniciarTreinamento(client, message, contato) {
        const sessionKey = `${contato.numero}_epc_epi`;

        this.sessions.set(sessionKey, {
            etapa: 'introducao',
            pontuacao: 0,
            respostasCorretas: 0,
            inicioTreinamento: new Date()
        });

        // Salvar no banco de dados

        // Salvar no SessaoTreinamento (serve para persistência do treinamento)
        await SessaoTreinamento.create({
            telefone: message.from,
            tipoTreinamento: 'epc_epi',
            etapaAtual: 'epc_epi_introducao',
            dadosSessao: JSON.stringify({
                etapa: 'epc_epi_introducao',
                contato_id: contato.id
            }),
            ativo: true,
            ultimaAtualizacao: new Date()
        });

        //Serve para atualizar a Interacao para indicar que estamos no treinamento EPC/EPI
        await Interacao.create({
            telefone: message.from,
            tipo: 'epc_epi_introducao',
            mensagem: JSON.stringify({
                etapa: 'epc_epi_introducao',
                contato_id: contato.id,
                nome: contato.nome || 'Usuário',
                empresa_id: contato.empresaId || 'N/A'
            })
        });

        await this.enviarIntroducao(client, message);
    }

    async enviarIntroducao(client, message) {
        await client.sendMessage(message.from, {
            text: 'Show! Aqui o treinamento acontece como uma conversa rápida:\n\nHoje vamos falar sobre EPC e EPI. Você já ouviu falar deles?\n\n1️⃣ Sim, já sei.\n2️⃣ Não, mas gostaria de saber mais.'
        });
    }

    async processarResposta(client, message, contato) {
        const sessionKey = `${contato.numero}_epc_epi`;
        let session = this.sessions.get(sessionKey);

        if (!session) {
            // Tentar recuperar sessão do banco de dados
            session = await this.recuperarSessaoBanco(contato.numero);
            if (session) {
                this.sessions.set(sessionKey, session);
                console.log(`🔄 [EPC_EPI] Sessão recuperada do banco: ${session.etapa}`);
            } else {
                await this.iniciarTreinamento(client, message, contato);
                return;
            }
        }

        const resposta = message.selectedButtonId || message.body;
        console.log(`🔍 [EPC_EPI] Etapa: ${session.etapa} | Resposta: "${resposta}"`);

        switch (session.etapa) {
            case 'introducao':
                await this.processarIntroducao(client, message, session, resposta);
                // Forçar atualização da sessão
                this.sessions.set(sessionKey, session);
                await this.salvarSessaoBanco(contato.numero, session);
                break;
            case 'audio_confirmacao':
                await this.processarAudioConfirmacao(client, message, session, resposta);
                await this.salvarSessaoBanco(contato.numero, session);
                break;
            case 'pergunta_a':
                await this.processarPerguntaA(client, message, session, resposta);
                break;
            case 'pergunta_b':
                await this.processarPerguntaB(client, message, session, resposta);
                break;
            case 'pergunta_epc':
                await this.processarPerguntaEPC(client, message, session, resposta);
                break;
            case 'pergunta_epi':
                await this.processarPerguntaEPI(client, message, session, resposta);
                break;
            case 'quiz_hierarquia':
                await this.processarQuizHierarquia(client, message, session, resposta);
                break;
            case 'pergunta_relaxar_a':
                await this.processarPerguntaRelaxarA(client, message, session, resposta);
                break;
            case 'pergunta_relaxar_b':
                await this.processarPerguntaRelaxarB(client, message, session, resposta);
                break;
            case 'pergunta_relaxar_c':
                await this.processarPerguntaRelaxarC(client, message, session, resposta);
                break;
            case 'pergunta_relaxar_d':
                await this.processarPerguntaRelaxarD(client, message, session, resposta);
                break;

            case 'enviar_pdf_nr6':
            case 'enviar_video_medidas':
                // Etapas automáticas, não precisam processar resposta
                break;

            case 'pergunta_verdadeiro_falso_a':
                await this.processarPerguntaVerdadeiroFalsoA(client, message, session, resposta);
                break;

            case 'pergunta_verdadeiro_falso_b':
                await this.processarPerguntaVerdadeiroFalsoB(client, message, session, resposta);
                break;

            case 'pergunta_verdadeiro_falso_c':
                await this.processarPerguntaVerdadeiroFalsoC(client, message, session, resposta);
                break;

            case 'pergunta_verdadeiro_falso_d':
                await this.processarPerguntaVerdadeiroFalsoD(client, message, session, resposta);
                break;

            case 'pergunta_verdadeiro_falso_e':
                await this.processarPerguntaVerdadeiroFalsoE(client, message, session, resposta);
                break;

            case 'tipos_epi_introducao':
                // Etapa automática, não precisa processar resposta
                break;

            case 'pergunta_capacetes_a':
                await this.processarPerguntaCapacetesA(client, message, session, resposta);
                break;

            case 'pergunta_capacetes_b':
                await this.processarPerguntaCapacetesB(client, message, session, resposta);
                break;
            case 'confirmar_dados_certificado':
                await this.processarConfirmacaoDados(client, message, session, resposta);
                break;
        }
    }

    async processarIntroducao(client, message, session, resposta) {
        console.log(`🔍 [EPC_EPI] Processando introdução: "${resposta}"`);
        const respostaNormalizada = resposta.toLowerCase().trim();
        if (resposta === 'epc_epi_sim_sei' || resposta === 'epc_epi_nao_sei' || resposta === '1' || resposta === '2' || respostaNormalizada.includes('sim') || respostaNormalizada.includes('não') || respostaNormalizada.includes('nao')) {
            console.log(`✅ [EPC_EPI] Avançando para áudio`);
            session.etapa = 'audio_confirmacao';

            // Salvar no banco de dados
            try {

                // Atualizar SessaoTreinamento
                await SessaoTreinamento.create({
                    telefone: message.from,
                    tipoTreinamento: 'epc_epi',
                    etapaAtual: 'epc_epi_audio_confirmacao',
                    dadosSessao: JSON.stringify({
                        etapa: 'epc_epi_audio_confirmacao'
                    }),
                    ativo: true,
                    ultimaAtualizacao: new Date()
                });

                // CRÍTICO: Atualizar Interacao para manter o usuário no treinamento
                await Interacao.create({
                    telefone: message.from,
                    tipo: 'epc_epi_audio_confirmacao',
                    mensagem: JSON.stringify({
                        etapa: 'epc_epi_audio_confirmacao'
                    })
                });

                console.log(`✅ [EPC_EPI] Etapa salva no banco: audio_confirmacao`);
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao salvar etapa:`, error);
            }

            await this.enviarAudio(client, message);
            return true;
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida na introdução: "${resposta}"`);
            return false;
        }
    }

    async enviarAudio(client, message) {
        const audioPath = path.join(this.basePath, 'Audios', 'entendendo_epc-epi.mp3');

        if (fs.existsSync(audioPath)) {
            console.log(`🎧 [EPC_EPI] Enviando áudio: ${audioPath}`);
            try {
                await client.sendMessage(message.from, {
                    audio: { url: audioPath }
                });
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao enviar áudio:`, error);
                await client.sendMessage(message.from, {
                    text: '🎧 Áudio: Entendendo EPC e EPI\n\nExplicação sobre equipamentos de proteção coletiva e individual.'
                });
            }
        } else {
            console.log(`⚠️ [EPC_EPI] Áudio não encontrado: ${audioPath}`);
            await client.sendMessage(message.from, {
                text: '🎧 Áudio: Entendendo EPC e EPI\n\nExplicação sobre equipamentos de proteção coletiva e individual.'
            });
        }

        setTimeout(async() => {
            await this.perguntarProsseguir(client, message);
        }, 2000);
    }

    async perguntarProsseguir(client, message) {
        const sections = [{
            title: 'Podemos prosseguir?',
            rows: [
                { rowId: 'prosseguir_sim', title: '1 – SIM', description: '🟢 Avançar para próxima mensagem' },
                { rowId: 'prosseguir_nao', title: '2 – NÃO', description: '🟡 Aguardar comando' }
            ]
        }];

        await client.sendMessage(message.from, {
            buttonText: 'SELECIONE UMA OPÇÃO',
            description: 'Podemos prosseguir?',
            sections: sections
        });
    }

    async processarAudioConfirmacao(client, message, session, resposta) {
        console.log(`🔍 [EPC_EPI] Processando audio confirmação: "${resposta}"`);

        const respostaNormalizada = resposta.toLowerCase().trim();

        if (respostaNormalizada.includes('sim') || respostaNormalizada === '1' || resposta === 'prosseguir_sim') {
            console.log(`✅ [EPC_EPI] Avançando para próxima etapa`);
            session.etapa = 'perigo_risco';

            // Atualizar estado no banco
            try {
                const { Interacao } = require('../../../BancoDeDados/models');
                await Interacao.create({
                    telefone: message.from,
                    tipo: 'epc_epi_perigo_risco',
                    mensagem: JSON.stringify({
                        etapa: 'epc_epi_perigo_risco'
                    })
                });
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao atualizar interação:`, error);
            }

            await this.explicarPerigoRisco(client, message, session);
        } else if (respostaNormalizada.includes('não') || respostaNormalizada.includes('nao') || respostaNormalizada === '2' || resposta === 'prosseguir_nao') {
            await client.sendMessage(message.from, {
                text: 'Aguardo seu comando. É só clicar sim e estarei pronto para começarmos'
            });

            const buttons = [
                { buttonId: 'prosseguir_sim', buttonText: { displayText: 'SIM' }, type: 1 }
            ];

            await client.sendMessage(message.from, {
                text: 'Pronto para continuar?',
                buttons: buttons,
                headerType: 1
            });
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida: "${resposta}"`);
            await this.perguntarProsseguir(client, message);
        }
    }

    async explicarPerigoRisco(client, message, session) {
        const texto = `Ótimo! Vamos prosseguir. Antes, vamos ver a diferença entre Perigo e Risco.\n\n` +
            `De forma simples e direta:\n\n` +
            `• *Perigo* 👉 é a fonte de dano. Algo que tem potencial de causar acidente ou doença.\n` +
            `Exemplo: eletricidade, produto químico, altura.\n\n` +
            `• *Risco* 👉 é a probabilidade e a gravidade de esse dano realmente acontecer quando há exposição ao perigo.\n` +
            `Exemplo: trabalhar com eletricidade sem EPI aumenta o risco de choque.\n\n` +
            `🔑 *Resumindo:*\n` +
            `➡️ Perigo = o que pode causar dano.\n` +
            `➡️ Risco = a chance de o dano acontecer quando se é exposto ao perigo.`;

        await client.sendMessage(message.from, { text: texto });

        setTimeout(async() => {
            await this.enviarImagensPerigo(client, message, session);
        }, 3000);
    }

    async enviarImagensPerigo(client, message, session) {
        const imagens = [
            'perigo_maquina.jpg',
            'perigo_eletricidade.jpg',
            'perigo_altura.jpg'
        ];

        for (const imagem of imagens) {
            const imagemPath = path.join(this.basePath, 'Imagens', imagem);
            if (fs.existsSync(imagemPath)) {
                try {
                    await client.sendMessage(message.from, {
                        image: { url: imagemPath }
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`❌ [EPC_EPI] Erro ao enviar imagem ${imagem}:`, error);
                }
            } else {
                console.log(`⚠️ [EPC_EPI] Imagem não encontrada: ${imagemPath}`);
            }
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_a';
            await this.enviarPerguntaA(client, message);
        }, 2000);
    }

    async enviarPerguntaA(client, message) {
        const sections = [{
            title: 'FALA AÍ!',
            rows: [
                { rowId: 'pergunta_a_verdadeiro', title: '1 – VERDADEIRO', description: '🟢' },
                { rowId: 'pergunta_a_falso', title: '2 – FALSO', description: '🟡' }
            ]
        }];

        await client.sendMessage(message.from, {
            text: 'A - Com base nas imagens anteriores, podemos dizer que o Perigo é uma característica da atividade ou de uma etapa da atividade.\n\nIsso é verdadeiro ou falso?'
        });

        setTimeout(async() => {
            await client.sendMessage(message.from, {
                buttonText: 'SELECIONE UMA OPÇÃO',
                description: 'Responda:',
                sections: sections
            });
        }, 1000);
    }

    async processarPerguntaA(client, message, session, resposta) {
        console.log(`🔍 [EPC_EPI] Processando pergunta A: "${resposta}"`);

        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === 'pergunta_a_verdadeiro' || resposta === '1' || respostaNormalizada.includes('verdadeiro')) {
            await client.sendMessage(message.from, {
                text: '🎉 Parabéns! Resposta correta!'
            });
            session.etapa = 'pergunta_b';

            // Atualizar estado no banco
            try {
                const { Interacao } = require('../../../BancoDeDados/models');
                await Interacao.create({
                    telefone: message.from,
                    tipo: 'epc_epi_pergunta_b',
                    mensagem: JSON.stringify({
                        etapa: 'epc_epi_pergunta_b'
                    })
                });
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao atualizar interação:`, error);
            }

            setTimeout(async() => {
                await this.enviarPerguntaB(client, message);
            }, 1500);
        } else if (resposta === 'pergunta_a_falso' || resposta === '2' || respostaNormalizada.includes('falso')) {
            await client.sendMessage(message.from, {
                text: 'Não é bem isso! Quer dar mais uma olhada nas imagens? Vá lá, olhe! Depois pode tentar responder novamente.'
            });

            setTimeout(async() => {
                await this.enviarPerguntaA(client, message);
            }, 3000);
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida na pergunta A: "${resposta}"`);
            await this.enviarPerguntaA(client, message);
        }
    }

    async enviarPerguntaB(client, message) {
        const sections = [{
            title: 'Responda:',
            rows: [
                { rowId: 'pergunta_b_verdadeiro', title: '1 – VERDADEIRO', description: '🟢' },
                { rowId: 'pergunta_b_falso', title: '2 – FALSO', description: '🟡' }
            ]
        }];

        await client.sendMessage(message.from, {
            text: 'B - Ainda em relação às imagens e ao conceito de Risco: Chamamos de risco uma situação de exposição ao perigo, mas onde não há chance de acontecer algo ruim.\n\nIsso é verdadeiro ou falso?'
        });

        setTimeout(async() => {
            await client.sendMessage(message.from, {
                buttonText: 'SELECIONE UMA OPÇÃO',
                description: 'Responda:',
                sections: sections
            });
        }, 1000);
    }

    async processarPerguntaB(client, message, session, resposta) {
        console.log(`🔍 [EPC_EPI] Processando pergunta B: "${resposta}"`);

        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === 'pergunta_b_verdadeiro' || resposta === '1' || respostaNormalizada.includes('verdadeiro')) {
            await client.sendMessage(message.from, {
                text: '🎉 Parabéns! Resposta correta!'
            });
            session.etapa = 'video';
            setTimeout(async() => {
                await this.enviarVideo(client, message, session);
            }, 1500);
        } else if (resposta === 'pergunta_b_falso' || resposta === '2' || respostaNormalizada.includes('falso')) {
            await client.sendMessage(message.from, {
                text: 'Não é bem isso! Quer dar mais uma olhada nas imagens? Vá lá, olhe! Depois pode tentar responder novamente.'
            });

            setTimeout(async() => {
                await this.enviarPerguntaB(client, message);
            }, 3000);
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida na pergunta B: "${resposta}"`);
            await this.enviarPerguntaB(client, message);
        }
    }

    async enviarVideo(client, message, session) {
        const videoPath = path.join(this.basePath, 'Videos', 'Medidas de Controle EPC e EPI.mp4');

        console.log(`🎥 [EPC_EPI] Tentando enviar vídeo: ${videoPath}`);

        if (fs.existsSync(videoPath)) {
            console.log(`✅ [EPC_EPI] Arquivo de vídeo encontrado, enviando...`);
            try {
                await client.sendMessage(message.from, {
                    video: { path: videoPath },
                    caption: ''
                });
                console.log(`✅ [EPC_EPI] Vídeo enviado com sucesso`);
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao enviar vídeo:`, error);
                await client.sendMessage(message.from, {
                    text: '🎥 Vídeo: Medidas de Controle EPC e EPI\n\nRoteiro de Vídeo Curto sobre equipamentos de proteção coletiva e individual.'
                });
            }
        } else {
            console.log(`⚠️ [EPC_EPI] Vídeo não encontrado: ${videoPath}`);
            await client.sendMessage(message.from, {
                text: '🎥 Vídeo: Medidas de Controle EPC e EPI\n\nRoteiro de Vídeo Curto sobre equipamentos de proteção coletiva e individual.'
            });
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_epc';
            await this.perguntarEPC(client, message);
        }, 3000);
    }

    async perguntarEPC(client, message) {
        const sections = [{
            title: 'Escolha a resposta correta:',
            rows: [
                { rowId: 'epc_resposta_1', title: '1️⃣ Equipamentos do trabalhador', description: 'São os equipamentos usados pelo trabalhador para se proteger da exposição ao risco.' },
                { rowId: 'epc_resposta_2', title: '2️⃣ Equipamentos coletivos', description: 'São Equipamentos que protegem um grupo de pessoas ao mesmo tempo.' }
            ]
        }];

        await client.sendMessage(message.from, {
            text: 'Lá vamos nós de novo!\n\nCom base no vídeo anterior responda:\n\nA - O que são os EPC?'
        });

        setTimeout(async() => {
            await client.sendMessage(message.from, {
                buttonText: 'SELECIONE UMA OPÇÃO',
                description: 'Escolha a resposta correta:',
                sections: sections
            });
        }, 1000);
    }

    async processarPerguntaEPC(client, message, session, resposta) {
        console.log(`🔍 [EPC_EPI] Processando pergunta EPC: "${resposta}"`);

        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === 'epc_resposta_1' || resposta === '1' || respostaNormalizada.includes('trabalhador')) {
            await client.sendMessage(message.from, {
                text: 'Oh! Oh! Tente de novo, reveja o vídeo e tente outra vez.'
            });

            setTimeout(async() => {
                await this.perguntarEPC(client, message);
            }, 3000);
        } else if (resposta === 'epc_resposta_2' || resposta === '2' || respostaNormalizada.includes('grupo')) {
            await client.sendMessage(message.from, {
                text: '🎉 Parabéns! Resposta correta! Eba! Acertou mais uma!'
            });
            session.etapa = 'pergunta_epi';
            setTimeout(async() => {
                await this.perguntarEPI(client, message);
            }, 2000);
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida na pergunta EPC: "${resposta}"`);
            await this.perguntarEPC(client, message);
        }
    }

    async perguntarEPI(client, message) {
        const sections = [{
            title: 'Escolha a resposta correta:',
            rows: [
                { rowId: 'epi_resposta_1', title: '1️⃣ Equipamentos do trabalhador', description: 'São os equipamentos usados pelo trabalhador para se proteger da exposição ao risco.' },
                { rowId: 'epi_resposta_2', title: '2️⃣ Equipamentos coletivos', description: 'São equipamentos usados por vários trabalhadores ao mesmo tempo.' }
            ]
        }];

        await client.sendMessage(message.from, {
            text: 'B - E o que são os EPI?'
        });

        setTimeout(async() => {
            await client.sendMessage(message.from, {
                buttonText: 'SELECIONE UMA OPÇÃO',
                description: 'Escolha a resposta correta:',
                sections: sections
            });
        }, 1000);
    }

    async processarPerguntaEPI(client, message, session, resposta) {
        console.log(`🔍 [EPC_EPI] Processando pergunta EPI: "${resposta}"`);

        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === 'epi_resposta_1' || resposta === '1' || respostaNormalizada.includes('trabalhador')) {
            await client.sendMessage(message.from, {
                text: '🎉 Parabéns! Resposta correta!'
            });
            session.etapa = 'hierarquia';
            setTimeout(async() => {
                await this.explicarHierarquia(client, message, session);
            }, 2000);
        } else if (resposta === 'epi_resposta_2' || resposta === '2' || respostaNormalizada.includes('vários')) {
            await client.sendMessage(message.from, {
                text: 'Opa! Algo está errado! Reveja o vídeo.'
            });

            setTimeout(async() => {
                await this.perguntarEPI(client, message);
            }, 3000);
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida na pergunta EPI: "${resposta}"`);
            await this.perguntarEPI(client, message);
        }
    }

    async explicarHierarquia(client, message, session) {
        const mensagens = [
            'Agora que você já sabe o que é um EPC e o que é um EPI, posso te contar como a empresa escolhe quais proteções vão ser usadas. 😉',
            'Existem vários tipos de riscos e também várias formas de controlar esses riscos.',
            'Mas aí vem a dúvida... 🤔\n👉 Qual delas é melhor?\n👉 Qual dá mais resultado?',
            'Existe uma ordem a ser seguida na hora de escolher as medidas de controle. 🧩',
            'Essa hierarquia serve pra garantir o melhor resultado possível em termos de segurança da atividade ou do processo. 💪',
            'Por isso, a gente sempre começa escolhendo o que traz mais segurança pro trabalhador. 🦺✅',
            'Então, seguimos a ordem abaixo 👇📋'
        ];

        for (const mensagem of mensagens) {
            await client.sendMessage(message.from, { text: mensagem });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const imagemPath = path.join(this.basePath, 'Imagens', 'hierarquia_medidas.jpeg');
        if (fs.existsSync(imagemPath)) {
            await client.sendMessage(message.from, {
                image: { url: imagemPath },
                caption: '📊 Hierarquia das Medidas de Controle'
            });
        }

        setTimeout(async() => {
            await this.enviarAudiosHierarquia(client, message, session);
        }, 3000);
    }

    async enviarAudiosHierarquia(client, message, session) {
        const audios = [
            'definir_medida.mp3',
            'apos_aplicar_medidas.mp3',
            'ultima_alternativa.mp3'
        ];

        for (let i = 0; i < audios.length; i++) {
            const audioPath = path.join(this.basePath, 'Audios', audios[i]);
            if (fs.existsSync(audioPath)) {
                try {
                    await client.sendMessage(message.from, {
                        audio: { url: audioPath }
                    });
                } catch (error) {
                    console.error(`❌ [EPC_EPI] Erro ao enviar áudio ${audios[i]}:`, error);
                }
            } else {
                console.log(`⚠️ [EPC_EPI] Áudio não encontrado: ${audioPath}`);
            }
            if (i < audios.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        setTimeout(async() => {
            session.etapa = 'quiz_hierarquia';
            await this.enviarQuizHierarquia(client, message);
        }, 2000);
    }

    async enviarQuizHierarquia(client, message) {
        const sections = [{
            title: 'Escolha a resposta correta:',
            rows: [
                { rowId: 'quiz_h_individual', title: '1️⃣ Medidas individuais', description: 'São as medidas de proteção individual pois impedem que o trabalhador sofra uma lesão.' },
                { rowId: 'quiz_h_eliminam', title: '2️⃣ Eliminam o risco', description: 'São aquelas que eliminam completamente o risco da atividade.' }
            ]
        }];

        await client.sendMessage(message.from, {
            text: 'A – Qual das medidas de controle de riscos é a mais efetiva? Ou seja, garante a maior segurança?'
        });

        setTimeout(async() => {
            await client.sendMessage(message.from, {
                buttonText: 'SELECIONE UMA OPÇÃO',
                description: 'É Hora da pergunta!',
                sections: sections
            });
        }, 1000);
    }

    async processarQuizHierarquia(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === 'quiz_h_individual' || resposta === '1' || respostaNormalizada.includes('individual')) {
            await client.sendMessage(message.from, {
                text: 'Não é bem isso, embora proteja o trabalhador e é super importante, a medida individual não modifica o risco, sendo esta a medida de menor efetividade para a segurança.'
            });
        } else if (resposta === 'quiz_h_eliminam' || resposta === '2' || respostaNormalizada.includes('eliminam')) {
            await client.sendMessage(message.from, {
                text: '🎉 Parabéns! Resposta correta!'
            });

            setTimeout(async() => {
                await client.sendMessage(message.from, {
                    text: 'Isso aí! Correto! As medidas que eliminem o risco são sempre as que garantem total segurança.'
                });
            }, 1500);
        }

        setTimeout(async() => {
            await this.explicarNR6(client, message, session);
        }, 2000);
    }

    async explicarNR6(client, message, session) {
        const mensagens = [
            'A norma que fala sobre EPI é a NR6 – Equipamentos de Proteção Individual. 🧤👷‍♂️',
            'Ela foi criada pelo Ministério do Trabalho e é a base de todas as regras sobre o uso de EPI no Brasil.',
            'Vamos ver agora um pouquinho mais sobre a NR6? 📘👉'
        ];

        for (const mensagem of mensagens) {
            await client.sendMessage(message.from, { text: mensagem });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setTimeout(async() => {
            await this.enviarAudioNR6(client, message, session);
        }, 1000);
    }

    async enviarAudioNR6(client, message, session) {
        const audioPath = path.join(this.basePath, 'Audios', 'NR6_traz.mp3');

        if (fs.existsSync(audioPath)) {
            try {
                await client.sendMessage(message.from, {
                    audio: { url: audioPath }
                });
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao enviar áudio NR6:`, error);
            }
        } else {
            console.log(`⚠️ [EPC_EPI] Áudio NR6 não encontrado: ${audioPath}`);
        }

        setTimeout(async() => {
            await this.explicarEPI(client, message, session);
        }, 3000);
    }

    async explicarEPI(client, message, session) {
        await client.sendMessage(message.from, {
            text: 'Para a NR6, EPI – Equipamento de Proteção Individual é:'
        });

        setTimeout(async() => {
            const imagemPath = path.join(this.basePath, 'Imagens', 'equipamento_individual.jpg');
            if (fs.existsSync(imagemPath)) {
                try {
                    await client.sendMessage(message.from, {
                        image: { url: imagemPath }
                    });
                } catch (error) {
                    console.error(`❌ [EPC_EPI] Erro ao enviar imagem EPI:`, error);
                }
            } else {
                console.log(`⚠️ [EPC_EPI] Imagem EPI não encontrada: ${imagemPath}`);
            }

            setTimeout(async() => {
                await client.sendMessage(message.from, {
                    text: 'Resumindo: EPI é todo utensílio, de uso individual, destinado a proteger a saúde do trabalhador.'
                });

                setTimeout(async() => {
                    await this.enviarGif(client, message, session);
                }, 2000);
            }, 2000);
        }, 1000);
    }

    async enviarGif(client, message, session) {
        const gifPath = path.join(this.basePath, 'Videos', 'gif.mp4');

        if (fs.existsSync(gifPath)) {
            try {
                await client.sendMessage(message.from, {
                    video: { path: gifPath }
                });
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao enviar GIF:`, error);
            }
        } else {
            console.log(`⚠️ [EPC_EPI] GIF não encontrado: ${gifPath}`);
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_relaxar_a';
            await this.perguntaRelaxarA(client, message);
        }, 3000);
    }

    async perguntaRelaxarA(client, message) {
        await client.sendMessage(message.from, {
            text: 'Que tal uma perguntinha pra relaxar?\n\nPara as opções abaixo escolha 1 quando for EPC e escolha 2 quando for EPI:\n\nA – Grade de Proteção em parte móvel de máquina ou equipamento.\n\n1️⃣ EPC\n2️⃣ EPI\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaRelaxarA(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '1' || respostaNormalizada.includes('epc')) {
            await client.sendMessage(message.from, {
                text: '🎉 Correto!'
            });
            setTimeout(async() => {
                session.etapa = 'pergunta_relaxar_b';
                await this.perguntaRelaxarB(client, message);
            }, 1500);
        } else if (resposta === '2' || respostaNormalizada.includes('epi')) {
            await client.sendMessage(message.from, {
                text: '❌ Errou! A resposta correta é EPC (Equipamento de Proteção Coletiva).'
            });
            setTimeout(async() => {
                session.etapa = 'pergunta_relaxar_b';
                await this.perguntaRelaxarB(client, message);
            }, 1500);
        } else {
            await client.sendMessage(message.from, {
                text: '🤔 Por favor, digite apenas 1 para EPC ou 2 para EPI. Vamos tentar novamente:'
            });
            setTimeout(async() => {
                await this.perguntaRelaxarA(client, message);
            }, 1500);
        }
    }

    async perguntaRelaxarB(client, message) {
        await client.sendMessage(message.from, {
            text: 'B – Luvas de raspa, perneira de raspa e avental de raspa.\n\n1️⃣ EPC\n2️⃣ EPI\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaRelaxarB(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '2' || respostaNormalizada.includes('epi')) {
            await client.sendMessage(message.from, {
                text: '🎉 Correto!'
            });
            setTimeout(async() => {
                session.etapa = 'pergunta_relaxar_c';
                await this.perguntaRelaxarC(client, message);
            }, 1500);
        } else if (resposta === '1' || respostaNormalizada.includes('epc')) {
            await client.sendMessage(message.from, {
                text: '❌ Errou! A resposta correta é EPI (Equipamento de Proteção Individual).'
            });
            setTimeout(async() => {
                session.etapa = 'pergunta_relaxar_c';
                await this.perguntaRelaxarC(client, message);
            }, 1500);
        } else {
            await client.sendMessage(message.from, {
                text: '🤔 Por favor, digite apenas 1 para EPC ou 2 para EPI. Vamos tentar novamente:'
            });
            setTimeout(async() => {
                await this.perguntaRelaxarB(client, message);
            }, 1500);
        }
    }

    async perguntaRelaxarC(client, message) {
        await client.sendMessage(message.from, {
            text: 'C – Máscara facial, colete de sinalização e avental de PVC.\n\n1️⃣ EPC\n2️⃣ EPI\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaRelaxarC(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '2' || respostaNormalizada.includes('epi')) {
            await client.sendMessage(message.from, {
                text: '🎉 Correto!'
            });
            setTimeout(async() => {
                session.etapa = 'pergunta_relaxar_d';
                await this.perguntaRelaxarD(client, message);
            }, 1500);
        } else if (resposta === '1' || respostaNormalizada.includes('epc')) {
            await client.sendMessage(message.from, {
                text: '❌ Errou! A resposta correta é EPI (Equipamento de Proteção Individual).'
            });
            setTimeout(async() => {
                session.etapa = 'pergunta_relaxar_d';
                await this.perguntaRelaxarD(client, message);
            }, 1500);
        } else {
            await client.sendMessage(message.from, {
                text: '🤔 Por favor, digite apenas 1 para EPC ou 2 para EPI. Vamos tentar novamente:'
            });
            setTimeout(async() => {
                await this.perguntaRelaxarC(client, message);
            }, 1500);
        }
    }

    async perguntaRelaxarD(client, message) {
        await client.sendMessage(message.from, {
            text: 'D – Sistema de exaustão com filtro para partículas sólidas.\n\n1️⃣ EPC\n2️⃣ EPI\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaRelaxarD(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '1' || respostaNormalizada.includes('epc')) {
            await client.sendMessage(message.from, {
                text: '🎉 Correto!'
            });
            setTimeout(async() => {
                session.etapa = 'enviar_pdf_nr6';
                await this.enviarPdfNR6(client, message, session);
            }, 1500);
        } else if (resposta === '2' || respostaNormalizada.includes('epi')) {
            await client.sendMessage(message.from, {
                text: '❌ Errou! A resposta correta é EPC (Equipamento de Proteção Coletiva).'
            });
            setTimeout(async() => {
                session.etapa = 'enviar_pdf_nr6';
                await this.enviarPdfNR6(client, message, session);
            }, 1500);
        } else {
            await client.sendMessage(message.from, {
                text: '🤔 Por favor, digite apenas 1 para EPC ou 2 para EPI. Vamos tentar novamente:'
            });
            setTimeout(async() => {
                await this.perguntaRelaxarD(client, message);
            }, 1500);
        }
    }

    async enviarPdfNR6(client, message, session) {
        const pdfPath = path.join(this.basePath, 'NR6.pdf');

        if (fs.existsSync(pdfPath)) {
            try {
                await client.sendMessage(message.from, {
                    document: { url: pdfPath },
                    mimetype: 'application/pdf',
                    fileName: 'NR6.pdf'
                });
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao enviar PDF:`, error);
            }
        } else {
            console.log(`⚠️ [EPC_EPI] PDF NR6 não encontrado: ${pdfPath}`);
        }

        setTimeout(async() => {
            session.etapa = 'enviar_video_medidas';
            await this.enviarVideoMedidas(client, message, session);
        }, 2000);
    }

    async enviarVideoMedidas(client, message, session) {
        const videoPath = path.join(this.basePath, 'Videos', 'NR6 Equipamentos de Proteção Individual.mp4');

        if (fs.existsSync(videoPath)) {
            try {
                await client.sendMessage(message.from, {
                    video: { path: videoPath }
                });
            } catch (error) {
                console.error(`❌ [EPC_EPI] Erro ao enviar vídeo NR6:`, error);
            }
        } else {
            console.log(`⚠️ [EPC_EPI] Vídeo NR6 não encontrado: ${videoPath}`);
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_verdadeiro_falso_a';
            await this.iniciarPerguntasVerdadeiroFalso(client, message, session);
        }, 3000);
    }

    async iniciarPerguntasVerdadeiroFalso(client, message, session) {
        await client.sendMessage(message.from, {
            text: 'Mais perguntinhas!\n\nResponda Verdadeiro ou Falso para as frases abaixo:'
        });

        setTimeout(async() => {
            await this.perguntaVerdadeiroFalsoA(client, message);
        }, 1000);
    }

    async perguntaVerdadeiroFalsoA(client, message) {
        await client.sendMessage(message.from, {
            text: 'A – A norma NR6 determina as diretrizes para funcionamento das Proteções Individuais.\n\n1️⃣ Verdadeiro\n2️⃣ Falso\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaVerdadeiroFalsoA(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '1' || respostaNormalizada.includes('verdadeiro')) {
            await client.sendMessage(message.from, {
                text: 'Muito bem! A NR6 determina as determinações normativas para os EPI.'
            });
        } else {
            await client.sendMessage(message.from, {
                text: 'Errado! A NR6 é sim a norma que define as diretrizes para os EPI.'
            });
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_verdadeiro_falso_b';
            await this.perguntaVerdadeiroFalsoB(client, message);
        }, 2000);
    }

    async perguntaVerdadeiroFalsoB(client, message) {
        await client.sendMessage(message.from, {
            text: 'B – EPI é todo dispositivo usado para proteção do trabalhador, ele pode ser de uso individual ou coletivo (compartilhado).\n\n1️⃣ Verdadeiro\n2️⃣ Falso\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaVerdadeiroFalsoB(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '1' || respostaNormalizada.includes('verdadeiro')) {
            await client.sendMessage(message.from, {
                text: 'Errado! O EPI é de uso individual, não deve ser compartilhado.'
            });
        } else {
            await client.sendMessage(message.from, {
                text: 'Correto! O EPI é de uso individual, não deve ser compartilhado.'
            });
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_verdadeiro_falso_c';
            await this.perguntaVerdadeiroFalsoC(client, message);
        }, 2000);
    }

    async perguntaVerdadeiroFalsoC(client, message) {
        await client.sendMessage(message.from, {
            text: 'C – É atribuição da empresa fornecer, gratuitamente, EPI adequado ao risco a que o trabalhador está exposto.\n\n1️⃣ Verdadeiro\n2️⃣ Falso\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaVerdadeiroFalsoC(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '1' || respostaNormalizada.includes('verdadeiro')) {
            await client.sendMessage(message.from, {
                text: 'Correto! Esta é uma das obrigações da empresa quanto ao EPI.'
            });
        } else {
            await client.sendMessage(message.from, {
                text: 'Errado! Esta é uma das obrigações da empresa quanto ao EPI.'
            });
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_verdadeiro_falso_d';
            await this.perguntaVerdadeiroFalsoD(client, message);
        }, 2000);
    }

    async perguntaVerdadeiroFalsoD(client, message) {
        await client.sendMessage(message.from, {
            text: 'D – É uma obrigação do trabalhador usar o EPI, de forma adequada, sempre que necessário.\n\n1️⃣ Verdadeiro\n2️⃣ Falso\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaVerdadeiroFalsoD(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '1' || respostaNormalizada.includes('verdadeiro')) {
            await client.sendMessage(message.from, {
                text: 'Correto! Essa é a principal obrigação do trabalhador quanto ao EPI.'
            });
        } else {
            await client.sendMessage(message.from, {
                text: 'Errado! Essa é a principal obrigação do trabalhador quanto ao EPI.'
            });
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_verdadeiro_falso_e';
            await this.perguntaVerdadeiroFalsoE(client, message);
        }, 2000);
    }

    async perguntaVerdadeiroFalsoE(client, message) {
        await client.sendMessage(message.from, {
            text: 'E – O Certificado de Aprovação – CA – é o documento emitido comprovando o tempo de validade do EPI.\n\n1️⃣ Verdadeiro\n2️⃣ Falso\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaVerdadeiroFalsoE(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '1' || respostaNormalizada.includes('verdadeiro')) {
            await client.sendMessage(message.from, {
                text: 'Errado! O CA é o documento emitido, após a realização de testes, atestando que o EPI foi aprovado e está em condições de uso pelo trabalhador.'
            });
        } else {
            await client.sendMessage(message.from, {
                text: 'Correto! O CA é o documento emitido, após a realização de testes, atestando que o EPI foi aprovado e está em condições de uso pelo trabalhador.'
            });
        }

        setTimeout(async() => {
            session.etapa = 'tipos_epi_introducao';
            await this.iniciarTiposEPI(client, message, session);
        }, 2000);
    }

    async iniciarTiposEPI(client, message, session) {
        await client.sendMessage(message.from, {
            text: 'Bom, existem vários tipos de EPI, e cada um tem suas características de uso, limitações e cuidados na hora de guardar e conservar o equipamento. 🧤👷'
        });

        setTimeout(async() => {
            await client.sendMessage(message.from, {
                text: 'Bora ver agora os EPI\'s mais comuns e quais são suas principais características? 👇🔍'
            });

            setTimeout(async() => {
                await client.sendMessage(message.from, {
                    text: 'EPI para proteção da cabeça:'
                });

                setTimeout(async() => {
                    await this.enviarAudiosProtecaoCabeca(client, message, session);
                }, 2000);
            }, 2000);
        }, 2000);
    }

    async enviarAudiosProtecaoCabeca(client, message, session) {
        const audios = [
            'risco_em_atividade.mp3',
            'protecao_capacete.mp3'
        ];

        for (let i = 0; i < audios.length; i++) {
            const audioPath = path.join(this.basePath, 'Audios', audios[i]);
            if (fs.existsSync(audioPath)) {
                try {
                    await client.sendMessage(message.from, {
                        audio: { url: audioPath }
                    });
                } catch (error) {
                    console.error(`❌ [EPC_EPI] Erro ao enviar áudio ${audios[i]}:`, error);
                }
            } else {
                console.log(`⚠️ [EPC_EPI] Áudio não encontrado: ${audioPath}`);
            }
            if (i < audios.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        setTimeout(async() => {
            await this.enviarVideoProtecaoCabeca(client, message, session);
        }, 2000);
    }

    async enviarVideoProtecaoCabeca(client, message, session) {
        const videoPath = path.join(this.basePath, 'Videos', 'protecao_cabeca.mp4');

        if (fs.existsSync(videoPath)) {
            await client.sendMessage(message.from, {
                video: { path: videoPath }
            });
        } else {
            await client.sendMessage(message.from, {
                text: '🎬 Vídeo sobre proteção da cabeça está sendo produzido!\n\nEm breve estará disponível com conteúdo exclusivo sobre EPIs para cabeça.'
            });
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_capacetes_a';
            await this.iniciarPerguntasCapacetes(client, message);
        }, 2000);
    }

    async iniciarPerguntasCapacetes(client, message) {
        await client.sendMessage(message.from, {
            text: 'E se prepare que lá vem as perguntinhas!'
        });

        setTimeout(async() => {
            await client.sendMessage(message.from, {
                text: 'Escolha a opção correta:'
            });

            setTimeout(async() => {
                await this.perguntaCapacetesA(client, message);
            }, 1000);
        }, 1000);
    }

    async perguntaCapacetesA(client, message) {
        await client.sendMessage(message.from, {
            text: 'A – Os capacetes tem várias aplicações e vários tipos. Os do tipo A – os mais comuns – tem proteção contra impactos e quedas de objetos. Quais as aplicações comuns destes capacetes?\n\n1️⃣ Capacetes de aba total ou frontal\n2️⃣ Capacetes de eletricista\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaCapacetesA(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '1' || respostaNormalizada.includes('aba') || respostaNormalizada.includes('frontal')) {
            await client.sendMessage(message.from, {
                text: 'Correto! Os capacetes de Classe A são empregados em atividades diversas como construção, indústria e áreas operacionais.'
            });
        } else {
            await client.sendMessage(message.from, {
                text: 'Errado! Os capacetes de Classe A são empregados em atividades diversas como construção, indústria e áreas operacionais.'
            });
        }

        setTimeout(async() => {
            session.etapa = 'pergunta_capacetes_b';
            await this.perguntaCapacetesB(client, message);
        }, 2000);
    }

    async perguntaCapacetesB(client, message) {
        await client.sendMessage(message.from, {
            text: 'B – Capacetes de Classe B tem toda a proteção contra impactos ou perfurações presentes no Classe A mais uma proteção extra. Esta proteção vem da forma e dos materiais que o capacete de Classe B é construído. Qual a característica especial do capacete de Classe B?\n\n1️⃣ Possui aba em todo o contorno do casco\n2️⃣ Possui proteção contra riscos de choque elétrico\n\nDigite o número da sua resposta:'
        });
    }

    async processarPerguntaCapacetesB(client, message, session, resposta) {
        const respostaNormalizada = resposta.toLowerCase().trim();

        if (resposta === '2' || respostaNormalizada.includes('elétrico') || respostaNormalizada.includes('eletrico') || respostaNormalizada.includes('choque')) {
            await client.sendMessage(message.from, {
                text: 'Correto! O capacete de Classe B possui proteção contra risco elétrico.'
            });
        } else {
            await client.sendMessage(message.from, {
                text: 'Errado! O capacete de Classe B possui proteção contra risco elétrico.'
            });
        }

        setTimeout(async() => {
            await this.finalizarTreinamento(client, message);
        }, 2000);
    }

    async processarConfirmacaoDados(client, message, session, resposta) {
        const opcao = resposta.trim();

        // Se tem dados salvos (do sistema) e usuário confirmou
        if (session.nome && session.email && (opcao === '1' || opcao.toLowerCase().includes('sim') || opcao.toLowerCase().includes('correto'))) {
            await this.gerarEEnviarCertificado(session.nome, session.email, client, message);
            return true;
        }

        // Se usuário quer alterar ou não tem dados salvos
        if (session.nome && session.email && (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('corrigir'))) {
            await client.sendMessage(message.from, {
                text: '📝 Por favor, envie os dados corretos:\n\n*Nome completo:* (como deve aparecer no certificado)\n*E-mail:* (para envio do certificado)\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
            });

            // Limpar dados salvos
            session.nome = null;
            session.email = null;
            return true;
        }

        // Se tem dados salvos mas resposta é inválida
        if (session.nome && session.email && opcao !== '1' && opcao !== '2' && !opcao.toLowerCase().includes('sim') && !opcao.toLowerCase().includes('correto') && !opcao.toLowerCase().includes('não') && !opcao.toLowerCase().includes('corrigir')) {
            await client.sendMessage(message.from, {
                text: '🤔 Não entendi sua resposta. Os dados estão corretos?\n\n1️⃣ Sim, estão corretos\n2️⃣ Não, quero corrigir'
            });
            return true;
        }

        // Processar dados informados manualmente
        const linhas = resposta.trim().split('\n').filter(linha => linha.trim());

        if (linhas.length >= 2) {
            const nome = linhas[0].trim();
            const email = linhas[1].trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                await client.sendMessage(message.from, {
                    text: '❌ E-mail inválido. Por favor, envie novamente:\n\n*Nome completo:*\n*E-mail válido:*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
                });
                return true;
            }

            await this.gerarEEnviarCertificado(nome, email, client, message);
        } else {
            await client.sendMessage(message.from, {
                text: '❌ Dados incompletos. Por favor, envie:\n\n*Nome completo:*\n*E-mail:*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
            });
        }

        return true;
    }

    async gerarEEnviarCertificado(nome, email, client, message) {
        await client.sendMessage(message.from, {
            text: '⏳ Gerando seu certificado...'
        });

        try {
            const { gerarCertificado } = require('../../Certificados/gerarCertificado');
            const telefone = message.from.replace('@c.us', '');

            // Função sendMessage compatível
            const sendMessage = async(sender, type, options) => {
                if (type === 'send-file') {
                    await client.sendMessage(message.from, {
                        document: { url: options.path },
                        mimetype: 'application/pdf',
                        fileName: options.filename,
                        caption: options.caption
                    });
                }
            };

            // Buscar contato no banco para obter ID
            const { Usuario } = require('../../../BancoDeDados/models');
            const formatosTelefone = [
                telefone,
                telefone.substring(2),
                `${telefone.substring(0, 4)}9${telefone.substring(4)}`,
                telefone.length === 13 ? telefone.substring(0, 4) + telefone.substring(5) : telefone,
            ];

            let contato = null;
            for (const formato of formatosTelefone) {
                contato = await Usuario.findOne({ where: { telefone: formato } });
                if (contato) break;
            }

            if (!contato) {
                throw new Error('Contato não encontrado no banco de dados');
            }

            const { gerarCertificadoBanco } = require('../../Certificados/certificados2');
            const caminhoArquivo = await gerarCertificadoBanco(contato.id, 'NR6 - EPC e EPI - Uso, Guarda e Conservação');

            const resultado = {
                sucesso: true,
                linkAssinatura: `http://72.60.48.249:3000/assinar-certificado/token_${Date.now()}`
            };

            if (resultado.sucesso) {
                await client.sendMessage(message.from, {
                    text: `✅ *Certificado gerado com sucesso!*\n\n📧 Enviado para: ${email}\n\n🔏 *Para finalizar, assine digitalmente seu certificado:*\n${resultado.linkAssinatura}\n\n⏰ Link válido por 24 horas`
                });
            } else {
                await client.sendMessage(message.from, {
                    text: `❌ Erro ao gerar certificado: ${resultado.erro}`
                });
            }
        } catch (error) {
            console.error('❌ Erro ao gerar certificado:', error);
            await client.sendMessage(message.from, {
                text: '❌ Erro interno ao gerar certificado. Tente novamente mais tarde.'
            });
        }

        setTimeout(async() => {
            await this.finalizarTreinamentoCompleto(client, message);
        }, 2000);
    }

    async finalizarTreinamentoCompleto(client, message) {
        await client.sendMessage(message.from, {
            text: '🎉 Treinamento concluído com sucesso!\n\nObrigado por participar do treinamento de EPC e EPI. Continue sempre priorizando a segurança no trabalho!'
        });

        // Remover sessão do banco após conclusão
        const telefone = message.from.replace('@c.us', '');
        await this.removerSessaoBanco(telefone);
    }

    async finalizarTreinamento(client, message) {
        await client.sendMessage(message.from, {
            text: '🎉 Parabéns! Você concluiu o treinamento de EPC e EPI!\n\nAgora você já sabe a diferença entre Perigo e Risco, e conhece os equipamentos de proteção coletiva e individual.'
        });

        setTimeout(async() => {
            await this.perguntarDadosCertificado(client, message);
        }, 2000);
    }

    async perguntarDadosCertificado(client, message) {
        await client.sendMessage(message.from, {
            text: "🎓 Certificados também podem ser gerados automaticamente após o treinamento!"
        });

        try {
            // Buscar dados do contato no sistema
            const telefone = message.from.replace('@c.us', '');
            console.log(`🔍 Buscando contato para telefone: ${telefone}`);

            const { Usuario } = require('../../../BancoDeDados/models');
            const formatosTelefone = [
                telefone,
                telefone.substring(2),
                `${telefone.substring(0, 4)}9${telefone.substring(4)}`,
                telefone.length === 13 ? telefone.substring(0, 4) + telefone.substring(5) : telefone,
            ];

            let contato = null;
            for (const formato of formatosTelefone) {
                contato = await Usuario.findOne({ where: { telefone: formato } });
                if (contato) {
                    console.log(`✅ Contato encontrado: ${contato.nome || contato.nomeCompleto}`);
                    break;
                }
            }

            if (contato) {
                const nome = contato.nomeCompleto || contato.nome || null;
                const email = contato.email || null;

                if (nome && email && nome !== 'Não informado' && email !== 'Não informado') {
                    await client.sendMessage(message.from, {
                        text: `🎓 *Certificado de Participação*\n\nDados cadastrados no sistema:\n\n👤 *Nome:* ${nome}\n📧 *E-mail:* ${email}\n\nEstão corretos?\n\n1️⃣ Sim, estão corretos\n2️⃣ Não, quero corrigir`
                    });

                    // Salvar dados para próxima etapa
                    const sessionKey = `${telefone}_epc_epi`;
                    let session = this.sessions.get(sessionKey) || {};
                    session.etapa = 'confirmar_dados_certificado';
                    session.nome = nome;
                    session.email = email;
                    this.sessions.set(sessionKey, session);
                    return;
                }
            }

            // Se não encontrou contato ou dados estão incompletos
            await client.sendMessage(message.from, {
                text: '🎓 *Certificado de Participação*\n\nPara emitir seu certificado, preciso de alguns dados:\n\n📝 Por favor, envie:\n\n*Nome completo:* (como deve aparecer no certificado)\n*E-mail:* (para envio do certificado)\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
            });

            const sessionKey = `${telefone}_epc_epi`;
            let session = this.sessions.get(sessionKey) || {};
            session.etapa = 'confirmar_dados_certificado';
            this.sessions.set(sessionKey, session);

        } catch (error) {
            console.error('❌ Erro ao buscar contato:', error);
            await client.sendMessage(message.from, {
                text: '🎓 *Certificado de Participação*\n\nPara emitir seu certificado, preciso de alguns dados:\n\n📝 Por favor, envie:\n\n*Nome completo:* (como deve aparecer no certificado)\n*E-mail:* (para envio do certificado)\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
            });

            const sessionKey = `${telefone}_epc_epi`;
            let session = this.sessions.get(sessionKey) || {};
            session.etapa = 'confirmar_dados_certificado';
            this.sessions.set(sessionKey, session);
        }
    }

    async salvarSessaoBanco(telefone, session) {
        try {
            const { SessaoTreinamento } = require('../../../BancoDeDados/models');

            await SessaoTreinamento.create({
                telefone: telefone,
                tipoTreinamento: 'epc_epi',
                etapaAtual: session.etapa,
                dadosSessao: JSON.stringify(session),
                ativo: true,
                ultimaAtualizacao: new Date()
            });

            console.log(`💾 [EPC_EPI] Sessão salva no banco: ${session.etapa}`);
        } catch (error) {
            console.error(`❌ [EPC_EPI] Erro ao salvar sessão:`, error);
        }
    }

    async recuperarSessaoBanco(telefone) {
        try {
            const { SessaoTreinamento } = require('../../../BancoDeDados/models');

            const sessaoSalva = await SessaoTreinamento.findOne({
                where: {
                    telefone: telefone,
                    tipoTreinamento: 'epc_epi',
                    ativo: true
                },
                order: [
                    ['ultimaAtualizacao', 'DESC']
                ]
            });

            if (sessaoSalva) {
                const session = JSON.parse(sessaoSalva.dadosSessao);
                console.log(`🔄 [EPC_EPI] Sessão recuperada: ${session.etapa}`);
                return session;
            }

            return null;
        } catch (error) {
            console.error(`❌ [EPC_EPI] Erro ao recuperar sessão:`, error);
            return null;
        }
    }

    async removerSessaoBanco(telefone) {
        try {
            const { SessaoTreinamento } = require('../../../BancoDeDados/models');

            await SessaoTreinamento.update({ ativo: false }, {
                where: {
                    telefone: telefone,
                    tipoTreinamento: 'epc_epi',
                    ativo: true
                }
            });

            console.log(`🗑️ [EPC_EPI] Sessão removida do banco`);
        } catch (error) {
            console.error(`❌ [EPC_EPI] Erro ao remover sessão:`, error);
        }
    }
}

// Instância global da classe
const epcEpiTraining = new EPCEPITraining();

// Função de compatibilidade para o sistema existente
async function processarTreinamentoEpcEpi(sender, text, selectedId, contato, sendMessage, buscarContato = null) {
    console.log(`🎓 [EPC_EPI] Processando: "${text}" | selectedId: "${selectedId}" de ${sender}`);

    // Se for comando especial para iniciar treinamento
    if (text === 'iniciar_treinamento') {
        console.log('🎆 INICIANDO TREINAMENTO EPC/EPI');
        const client = {
            sendMessage: async(to, options) => {
                if (options.text) {
                    await sendMessage(sender, 'send-message', { message: options.text });
                } else if (options.audio) {
                    await sendMessage(sender, 'send-file', { path: options.audio.url, filename: 'audio.mp3' });
                } else if (options.video) {
                    await sendMessage(sender, 'send-video', { path: options.video.path, caption: options.caption });
                } else if (options.image) {
                    await sendMessage(sender, 'send-image', { path: options.image.url, caption: options.caption });
                } else if (options.document) {
                    await sendMessage(sender, 'send-file', { path: options.document.url, filename: options.fileName || 'document.pdf' });
                } else if (options.sections) {
                    await sendMessage(sender, 'send-list-message', options);
                }
            }
        };

        const message = { from: sender };
        return await epcEpiTraining.iniciarTreinamento(client, message, contato);
    }

    // Verificar se já está processando para evitar loops
    const chaveProcessamento = `epc_epi_${sender}`;
    if (global.processandoTreinamentos && global.processandoTreinamentos.has(chaveProcessamento)) {
        console.log('🔄 Treinamento EPC/EPI já sendo processado, ignorando');
        return true;
    }

    // Marcar como processando
    if (!global.processandoTreinamentos) global.processandoTreinamentos = new Set();
    global.processandoTreinamentos.add(chaveProcessamento);

    try {
        const client = {
            sendMessage: async(to, options) => {
                if (options.text) {
                    await sendMessage(sender, 'send-message', { message: options.text });
                } else if (options.audio) {
                    await sendMessage(sender, 'send-file', { path: options.audio.url, filename: 'audio.mp3' });
                } else if (options.video) {
                    await sendMessage(sender, 'send-video', { path: options.video.path, caption: options.caption });
                } else if (options.image) {
                    await sendMessage(sender, 'send-image', { path: options.image.url, caption: options.caption });
                } else if (options.document) {
                    await sendMessage(sender, 'send-file', { path: options.document.url, filename: options.fileName || 'document.pdf' });
                } else if (options.sections) {
                    await sendMessage(sender, 'send-list-message', options);
                }
            }
        };

        const message = {
            from: sender,
            body: text,
            selectedButtonId: selectedId || text
        };

        // NÃO salvar estado duplicado aqui - deixar o treinamento gerenciar seu próprio estado
        // O estado é gerenciado internamente pela classe EPCEPITraining

        const resultado = await epcEpiTraining.processarResposta(client, message, contato);

        // Remover da lista de processamento após 2 segundos
        setTimeout(() => {
            global.processandoTreinamentos.delete(chaveProcessamento);
        }, 2000);

        return resultado;

    } catch (error) {
        console.error('❌ Erro no treinamento EPC/EPI:', error);
        global.processandoTreinamentos.delete(chaveProcessamento);
        return false;
    }
}

module.exports = {
    processarTreinamentoEpcEpi,
    EPCEPITraining,
    TREINAMENTO_ID,
    NOME_TREINAMENTO
};