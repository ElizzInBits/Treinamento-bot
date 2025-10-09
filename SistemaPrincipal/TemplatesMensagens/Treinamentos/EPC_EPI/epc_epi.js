const fs = require('fs');
const path = require('path');

// ID do treinamento EPC/EPI no sistema
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

        await this.enviarIntroducao(client, message);
    }

    async enviarIntroducao(client, message) {
        await client.sendMessage(message.from, {
            text: 'Show! Aqui o treinamento acontece como uma conversa rápida:\n\nHoje vamos falar sobre EPC e EPI. Você já ouviu falar deles?\n\n1️⃣ Sim, já sei.\n2️⃣ Não, mas gostaria de saber mais.\n\nDigite o número da sua resposta:'
        });
    }

    async processarResposta(client, message, contato) {
        const sessionKey = `${contato.numero}_epc_epi`;
        const session = this.sessions.get(sessionKey);
        
        if (!session) {
            await this.iniciarTreinamento(client, message, contato);
            return;
        }

        const resposta = message.selectedButtonId || message.body;
        console.log(`🔍 [EPC_EPI] Etapa: ${session.etapa} | Resposta: "${resposta}"`);

        switch (session.etapa) {
            case 'introducao':
                await this.processarIntroducao(client, message, session, resposta);
                break;
            case 'audio_confirmacao':
                await this.processarAudioConfirmacao(client, message, session, resposta);
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
        }
    }

    async processarIntroducao(client, message, session, resposta) {
        console.log(`🔍 [EPC_EPI] Processando introdução: "${resposta}"`);
        const respostaNormalizada = resposta.toLowerCase().trim();
        if (resposta === 'epc_epi_sim_sei' || resposta === 'epc_epi_nao_sei' || resposta === '1' || resposta === '2' || respostaNormalizada.includes('sim') || respostaNormalizada.includes('não') || respostaNormalizada.includes('nao')) {
            console.log(`✅ [EPC_EPI] Avançando para áudio`);
            session.etapa = 'audio_confirmacao';
            await this.enviarAudio(client, message);
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida na introdução: "${resposta}"`);
            await this.enviarIntroducao(client, message);
        }
    }

    async enviarAudio(client, message) {
        const audioPath = path.join(this.basePath, 'Audios', 'entendendo_epc-epi.mp3');
        
        if (fs.existsSync(audioPath)) {
            console.log(`🎧 [EPC_EPI] Enviando áudio: ${audioPath}`);
            await client.sendMessage(message.from, {
                audio: { url: audioPath }
            });
        } else {
            console.log(`⚠️ [EPC_EPI] Áudio não encontrado: ${audioPath}`);
            await client.sendMessage(message.from, {
                text: '🎧 Áudio: Entendendo EPC e EPI\n\nExplicação sobre equipamentos de proteção coletiva e individual.'
            });
        }

        setTimeout(async () => {
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
        const texto = `Ok. Ótimo! Vamos prosseguir. Mas antes vamos a diferença entre Perigo e Risco.\n\n` +
            `De forma simples e direta:\n\n` +
            `• *Perigo* 👉 é a fonte de dano. Algo que tem potencial de causar acidente ou doença.\n` +
            `Exemplo: eletricidade, produto químico, altura.\n\n` +
            `• *Risco* 👉 é a probabilidade e a gravidade de esse dano realmente acontecer quando há exposição ao perigo.\n` +
            `Exemplo: trabalhar com eletricidade sem EPI aumenta o risco de choque.\n\n` +
            `🔑 *Resumindo:*\n` +
            `➡️ Perigo = o que pode causar dano.\n` +
            `➡️ Risco = a chance de o dano acontecer quando se é exposto ao perigo.`;

        await client.sendMessage(message.from, { text: texto });

        setTimeout(async () => {
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
                await client.sendMessage(message.from, {
                    image: { url: imagemPath }
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        setTimeout(async () => {
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
        
        setTimeout(async () => {
            await client.sendMessage(message.from, {
                buttonText: 'SELECIONE UMA OPÇÃO',
                description: 'VERDADRO ou FALSO?',
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
            setTimeout(async () => {
                await this.enviarPerguntaB(client, message);
            }, 1500);
        } else if (resposta === 'pergunta_a_falso' || resposta === '2' || respostaNormalizada.includes('falso')) {
            await client.sendMessage(message.from, {
                text: 'Não é bem isso! Quer dar mais uma olhada nas imagens? Vá lá, olhe! Depois pode tentar responder novamente.'
            });
            
            setTimeout(async () => {
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
        
        setTimeout(async () => {
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
            setTimeout(async () => {
                await this.enviarVideo(client, message, session);
            }, 1500);
        } else if (resposta === 'pergunta_b_falso' || resposta === '2' || respostaNormalizada.includes('falso')) {
            await client.sendMessage(message.from, {
                text: 'Não é bem isso! Quer dar mais uma olhada nas imagens? Vá lá, olhe! Depois pode tentar responder novamente.'
            });
            
            setTimeout(async () => {
                await this.enviarPerguntaB(client, message);
            }, 3000);
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida na pergunta B: "${resposta}"`);
            await this.enviarPerguntaB(client, message);
        }
    }

    async enviarVideo(client, message, session) {
        const videoPath = path.join(this.basePath, 'Videos', 'Medidas de Controle EPC e EPI — Trabalhar com.mp4');
        
        console.log(`🎥 [EPC_EPI] Tentando enviar vídeo: ${videoPath}`);
        
        if (fs.existsSync(videoPath)) {
            console.log(`✅ [EPC_EPI] Arquivo de vídeo encontrado, enviando...`);
            try {
                await client.sendMessage(message.from, {
                    video: { path: videoPath },
                    caption: 'Roteiro de Vídeo Curto'
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

        setTimeout(async () => {
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
        
        setTimeout(async () => {
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
            
            setTimeout(async () => {
                await this.perguntarEPC(client, message);
            }, 3000);
        } else if (resposta === 'epc_resposta_2' || resposta === '2' || respostaNormalizada.includes('grupo')) {
            await client.sendMessage(message.from, {
                text: '🎉 Parabéns! Resposta correta! Eba! Acertou mais uma!'
            });
            session.etapa = 'pergunta_epi';
            setTimeout(async () => {
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
        
        setTimeout(async () => {
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
                text: '🎉 Parabéns! Resposta correta! Muito Bem! Certa Resposta!'
            });
            session.etapa = 'hierarquia';
            setTimeout(async () => {
                await this.explicarHierarquia(client, message);
            }, 2000);
        } else if (resposta === 'epi_resposta_2' || resposta === '2' || respostaNormalizada.includes('vários')) {
            await client.sendMessage(message.from, {
                text: 'Opa! Algo está errado! Reveja o vídeo.'
            });
            
            setTimeout(async () => {
                await this.perguntarEPI(client, message);
            }, 3000);
        } else {
            console.log(`⚠️ [EPC_EPI] Resposta não reconhecida na pergunta EPI: "${resposta}"`);
            await this.perguntarEPI(client, message);
        }
    }

    async explicarHierarquia(client, message) {
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

        setTimeout(async () => {
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
                await client.sendMessage(message.from, {
                    audio: { url: audioPath }
                });
            }
            if (i < audios.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        setTimeout(async () => {
            session.etapa = 'quiz_hierarquia';
            await this.enviarQuizHierarquia(client, message);
        }, 2000);
    }

    async enviarQuizHierarquia(client, message) {
        const sections = [{
            title: 'É Hora da pergunta!',
            rows: [
                { rowId: 'quiz_h_individual', title: '1️⃣ Medidas individuais', description: 'São as medidas de proteção individual pois impedem que o trabalhador sofra uma lesão.' },
                { rowId: 'quiz_h_eliminam', title: '2️⃣ Eliminam o risco', description: 'São aquelas que eliminam completamente o risco da atividade.' }
            ]
        }];

        await client.sendMessage(message.from, {
            text: 'A – Qual das medidas de controle de riscos é a mais efetiva? Ou seja, garante a maior segurança?'
        });
        
        setTimeout(async () => {
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
                text: 'Não é bem isso, embora proteja o trabalhador e é super importante, a medida individual não modifica o risco, sendo esta a medida de menor efetividade para a segurança. Ouça os áudios novamente.'
            });
            
            setTimeout(async () => {
                await this.enviarAudiosHierarquia(client, message, session);
            }, 3000);
        } else if (resposta === 'quiz_h_eliminam' || resposta === '2' || respostaNormalizada.includes('eliminam')) {
            await client.sendMessage(message.from, {
                text: '🎉 Parabéns! Resposta correta!'
            });
            
            setTimeout(async () => {
                await client.sendMessage(message.from, {
                    text: 'Isso aí! Correto! As medidas que eliminem o risco são sempre as que garantem total segurança.'
                });
                
                setTimeout(async () => {
                    await this.explicarNR6(client, message, session);
                }, 2000);
            }, 1500);
        } else {
            await this.enviarQuizHierarquia(client, message);
        }
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

        setTimeout(async () => {
            await this.enviarAudioNR6(client, message, session);
        }, 1000);
    }

    async enviarAudioNR6(client, message, session) {
        const audioPath = path.join(this.basePath, 'Audios', 'NR6_traz.mpeg');
        
        if (fs.existsSync(audioPath)) {
            await client.sendMessage(message.from, {
                audio: { url: audioPath }
            });
        }

        setTimeout(async () => {
            await this.explicarEPI(client, message, session);
        }, 3000);
    }

    async explicarEPI(client, message, session) {
        await client.sendMessage(message.from, {
            text: 'Para a NR6, EPI – Equipamento de Proteção Individual é:'
        });

        setTimeout(async () => {
            const imagemPath = path.join(this.basePath, 'Imagens', 'equipamento_individual.jpg');
            if (fs.existsSync(imagemPath)) {
                await client.sendMessage(message.from, {
                    image: { url: imagemPath }
                });
            }

            setTimeout(async () => {
                await client.sendMessage(message.from, {
                    text: 'Resumindo: EPI é todo utensílio, de uso individual, destinado a proteger a saúde do trabalhador.'
                });

                setTimeout(async () => {
                    await this.enviarGif(client, message, session);
                }, 2000);
            }, 2000);
        }, 1000);
    }

    async enviarGif(client, message, session) {
        const gifPath = path.join(this.basePath, 'Videos', 'gif.mp4');
        
        if (fs.existsSync(gifPath)) {
            await client.sendMessage(message.from, {
                video: { path: gifPath }
            });
        }

        setTimeout(async () => {
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
        } else {
            await client.sendMessage(message.from, {
                text: '❌ Errou!'
            });
        }

        setTimeout(async () => {
            session.etapa = 'pergunta_relaxar_b';
            await this.perguntaRelaxarB(client, message);
        }, 1500);
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
        } else {
            await client.sendMessage(message.from, {
                text: '❌ Errou!'
            });
        }

        setTimeout(async () => {
            session.etapa = 'pergunta_relaxar_c';
            await this.perguntaRelaxarC(client, message);
        }, 1500);
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
        } else {
            await client.sendMessage(message.from, {
                text: '❌ Errou!'
            });
        }

        setTimeout(async () => {
            session.etapa = 'pergunta_relaxar_d';
            await this.perguntaRelaxarD(client, message);
        }, 1500);
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
        } else {
            await client.sendMessage(message.from, {
                text: '❌ Errou!'
            });
        }

        setTimeout(async () => {
            session.etapa = 'enviar_pdf_nr6';
            await this.enviarPdfNR6(client, message, session);
        }, 1500);
    }

    async enviarPdfNR6(client, message, session) {
        const pdfPath = path.join(this.basePath, 'material_treinamento', 'NR6.pdf');
        
        if (fs.existsSync(pdfPath)) {
            await client.sendMessage(message.from, {
                document: { url: pdfPath },
                mimetype: 'application/pdf',
                fileName: 'NR6.pdf'
            });
        }

        setTimeout(async () => {
            session.etapa = 'enviar_video_medidas';
            await this.enviarVideoMedidas(client, message, session);
        }, 2000);
    }

    async enviarVideoMedidas(client, message, session) {
        const videoPath = path.join(this.basePath, 'material_treinamento', 'Videos', 'Medidas de Controle EPC e EPI — Trabalhar com.mp4');
        
        if (fs.existsSync(videoPath)) {
            await client.sendMessage(message.from, {
                video: { path: videoPath }
            });
        }

        setTimeout(async () => {
            session.etapa = 'pergunta_verdadeiro_falso_a';
            await this.iniciarPerguntasVerdadeiroFalso(client, message, session);
        }, 3000);
    }

    async iniciarPerguntasVerdadeiroFalso(client, message, session) {
        await client.sendMessage(message.from, {
            text: 'Mais perguntas, por favor!\n\nResponda Verdadeiro ou Falso para as frases abaixo:'
        });

        setTimeout(async () => {
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
                text: 'Muito bem a NR6 determina as determinações normativas para os EPI.'
            });
        } else {
            await client.sendMessage(message.from, {
                text: 'Errado! A NR6 é sim a norma que define as diretrizes para os EPI.'
            });
        }

        setTimeout(async () => {
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

        setTimeout(async () => {
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

        setTimeout(async () => {
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

        setTimeout(async () => {
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

        setTimeout(async () => {
            session.etapa = 'tipos_epi_introducao';
            await this.iniciarTiposEPI(client, message, session);
        }, 2000);
    }

    async iniciarTiposEPI(client, message, session) {
        await client.sendMessage(message.from, {
            text: 'Bom, existem vários tipos de EPI, e cada um tem suas características de uso, limitações e cuidados na hora de guardar e conservar o equipamento. 🧤👷♀️'
        });

        setTimeout(async () => {
            await client.sendMessage(message.from, {
                text: 'Bora ver agora os EPI\'s mais comuns e quais são suas principais características? 👇🔍'
            });

            setTimeout(async () => {
                await client.sendMessage(message.from, {
                    text: 'EPI para proteção da cabeça:'
                });

                setTimeout(async () => {
                    await this.enviarAudiosProtecaoCabeca(client, message, session);
                }, 2000);
            }, 2000);
        }, 2000);
    }

    async enviarAudiosProtecaoCabeca(client, message, session) {
        const audios = [
            'risco_em_atividade.mp3',
            'risco_em_atividade.mp3'
        ];

        for (let i = 0; i < audios.length; i++) {
            const audioPath = path.join(this.basePath, 'Audios', audios[i]);
            if (fs.existsSync(audioPath)) {
                await client.sendMessage(message.from, {
                    audio: { url: audioPath }
                });
            }
            if (i < audios.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        setTimeout(async () => {
            await this.finalizarTreinamento(client, message);
        }, 2000);
    }

    async finalizarTreinamento(client, message) {
        await client.sendMessage(message.from, {
            text: '🎉 Parabéns! Você concluiu o treinamento de EPC e EPI!\n\nAgora você já sabe a diferença entre Perigo e Risco, e conhece os equipamentos de proteção coletiva e individual.'
        });
    }
}

// Instância global da classe
const epcEpiTraining = new EPCEPITraining();

// Função de compatibilidade para o sistema existente
async function processarTreinamentoEpcEpi(sender, text, selectedId, contato, sendMessage, buscarContato = null) {
    console.log(`🎓 [EPC_EPI] Processando: "${text}" | selectedId: "${selectedId}" de ${sender}`);
    
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
            sendMessage: async (to, options) => {
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
                } else if (options.buttons) {
                    await sendMessage(sender, 'send-buttons', {
                        message: options.text,
                        buttons: options.buttons.map(btn => ({
                            id: btn.buttonId,
                            text: btn.buttonText.displayText
                        }))
                    });
                }
            }
        };
        
        const message = {
            from: sender,
            body: text,
            selectedButtonId: selectedId || text
        };
        
        // Salvar estado no banco apenas se não existir sessão
        const sessionKey = `${contato.numero}_epc_epi`;
        if (!epcEpiTraining.sessions.has(sessionKey)) {
            const { Interacao } = require('../../../BancoDeDados/models');
            await Interacao.create({
                telefone: sender,
                tipo: 'epc_epi_introducao',
                mensagem: JSON.stringify({ 
                    etapa: 'epc_epi_introducao',
                    contato_id: contato.id,
                    treinamento_id: TREINAMENTO_ID
                })
            });
        }
        
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