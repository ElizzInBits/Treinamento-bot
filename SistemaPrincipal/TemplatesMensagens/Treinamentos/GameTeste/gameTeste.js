const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { SessaoTreinamento, Interacao, Usuario, Treinamento } = require('../../../BancoDeDados/models');

// ID do treinamento
const TREINAMENTO_ID = 24;
const NOME_TREINAMENTO = 'Game Teste - Quiz Gamificado';

// Questões do quiz
const QUESTOES_QUIZ = [
    {
        pergunta: "Qual é a principal vantagem de um sistema de treinamento gamificado?",
        opcoes: [
            "Aumentar o engajamento e motivação dos participantes",
            "Reduzir o tempo de treinamento pela metade",
            "Eliminar a necessidade de instrutores",
            "Tornar o conteúdo mais fácil automaticamente"
        ],
        resposta_correta: 0,
        explicacao: "A gamificação aumenta o engajamento através de elementos como pontos, rankings e desafios, tornando o aprendizado mais motivador e divertido."
    },
    {
        pergunta: "No sistema de ranking, o que significa 'dias consecutivos'?",
        opcoes: [
            "Total de dias que o usuário está cadastrado",
            "Quantidade de dias seguidos participando do quiz",
            "Número de vezes que acertou todas as questões",
            "Tempo médio de resposta em dias"
        ],
        resposta_correta: 1,
        explicacao: "Dias consecutivos contam quantos dias seguidos você participou do quiz, incentivando a consistência e criando o hábito de aprendizado diário."
    },
    {
        pergunta: "Como funciona o bônus por velocidade no quiz?",
        opcoes: [
            "Ganha pontos extras se responder em menos de 30 segundos",
            "Perde pontos se demorar mais de 1 minuto",
            "Quanto mais rápido, menos pontos você ganha",
            "O tempo não influencia na pontuação"
        ],
        resposta_correta: 0,
        explicacao: "Respostas rápidas (menos de 30 segundos) ganham 50% de bônus na pontuação, recompensando conhecimento sólido e agilidade."
    },
    {
        pergunta: "Qual é o objetivo do sistema de pontuação diária?",
        opcoes: [
            "Punir quem não participa todos os dias",
            "Criar competição desleal entre participantes",
            "Incentivar prática regular e medir progresso",
            "Dificultar o acesso ao certificado"
        ],
        resposta_correta: 2,
        explicacao: "O sistema de pontuação diária incentiva a prática regular, permite acompanhar o progresso e torna o aprendizado mais consistente e efetivo."
    },
    {
        pergunta: "Qual estratégia é mais eficaz para subir no ranking?",
        opcoes: [
            "Participar apenas quando tiver tempo livre",
            "Manter consistência diária e responder com atenção",
            "Responder o mais rápido possível sem ler as questões",
            "Esperar acumular várias questões para responder de uma vez"
        ],
        resposta_correta: 1,
        explicacao: "A consistência diária combinada com atenção às respostas maximiza pontos, dias consecutivos e aprendizado real, sendo a melhor estratégia."
    },
    {
        pergunta: "O que acontece se você perder um dia de participação no quiz?",
        opcoes: [
            "Perde todos os pontos acumulados",
            "A sequência de dias consecutivos é zerada",
            "É banido do sistema por 7 dias",
            "Nada acontece, continua normalmente"
        ],
        resposta_correta: 1,
        explicacao: "Ao perder um dia, sua sequência de dias consecutivos volta a zero, mas seus pontos totais são mantidos. Por isso é importante participar diariamente!"
    },
    {
        pergunta: "Qual é o benefício de manter uma longa sequência de dias consecutivos?",
        opcoes: [
            "Demonstra comprometimento e cria hábito de aprendizado",
            "Dobra automaticamente seus pontos",
            "Permite pular perguntas difíceis",
            "Reduz o número de questões diárias"
        ],
        resposta_correta: 0,
        explicacao: "Manter dias consecutivos demonstra disciplina, cria hábito de estudo e é um indicador importante no ranking, mostrando seu comprometimento."
    },
    {
        pergunta: "Como o ranking é calculado?",
        opcoes: [
            "Apenas pelo total de pontos acumulados",
            "Apenas pelos dias consecutivos",
            "Por pontos totais, com destaque para dias consecutivos",
            "Aleatoriamente a cada semana"
        ],
        resposta_correta: 2,
        explicacao: "O ranking prioriza o total de pontos, mas dias consecutivos são um diferencial importante que demonstra consistência e dedicação ao aprendizado."
    },
    {
        pergunta: "Qual é a melhor forma de usar o sistema de quiz?",
        opcoes: [
            "Fazer apenas quando lembrar",
            "Participar diariamente no mesmo horário",
            "Acumular vários dias e fazer tudo de uma vez",
            "Pedir para outra pessoa responder por você"
        ],
        resposta_correta: 1,
        explicacao: "Participar diariamente no mesmo horário cria uma rotina, facilita a formação do hábito e maximiza o aprendizado através da repetição espaçada."
    },
    {
        pergunta: "O que você deve fazer se errar uma questão?",
        opcoes: [
            "Desistir do quiz",
            "Ler a explicação e aprender com o erro",
            "Reclamar que a questão estava difícil",
            "Ignorar e seguir para a próxima"
        ],
        resposta_correta: 1,
        explicacao: "Erros são oportunidades de aprendizado! Sempre leia a explicação para entender o conceito correto e melhorar seu desempenho futuro."
    }
];

class GameTesteTraining {
    constructor() {
        this.sessions = new Map();
        this.basePath = path.join(__dirname, 'material_treinamento');
    }

    async iniciarTreinamento(client, message, contato) {
        const sessionKey = `${contato.numero}_game_teste`;

        // Buscar configuração do treinamento
        const treinamento = await Treinamento.findByPk(TREINAMENTO_ID);
        const config_quiz = treinamento.config_quiz 
            ? (typeof treinamento.config_quiz === 'string' ? JSON.parse(treinamento.config_quiz) : treinamento.config_quiz)
            : {
                pontos_por_acerto: 10,
                questoes_por_dia: 5,
                max_tempo_segundos: 60,
                bonus_tempo: true
            };

        this.sessions.set(sessionKey, {
            etapa: 'introducao',
            modo_quiz: true,
            config_quiz: config_quiz,
            pontuacao_diaria: 0,
            acertos_hoje: 0,
            total_questoes: 0,
            pergunta_atual: 0,
            tempo_inicio_quiz: null,
            tempo_inicio_pergunta: null,
            inicioTreinamento: new Date()
        });

        // Salvar no banco de dados
        await SessaoTreinamento.create({
            telefone: message.from,
            tipo_treinamento: 'game_teste',
            etapa_atual: 'game_teste_introducao',
            dados_sessao: JSON.stringify({
                etapa: 'game_teste_introducao',
                contato_id: contato.id
            }),
            ativo: true,
            ultima_atualizacao: new Date()
        });

        await Interacao.create({
            telefone: message.from,
            tipo: 'game_teste_introducao',
            mensagem: JSON.stringify({
                etapa: 'game_teste_introducao',
                contato_id: contato.id,
                nome: contato.nome || 'Usuário',
                empresa_id: contato.empresaId || 'N/A'
            })
        });

        await this.enviarIntroducao(client, message);
    }

    async enviarIntroducao(client, message) {
        await client.sendMessage(message.from, {
            text: '🎮 *BEM-VINDO AO QUIZ GAMIFICADO!*\n\n' +
                  '🏆 Prepare-se para testar seus conhecimentos!\n\n' +
                  '📋 *Como funciona:*\n' +
                  '• 5 perguntas por dia\n' +
                  '• 10 pontos por acerto\n' +
                  '• Bônus por velocidade\n' +
                  '• Ranking em tempo real\n\n' +
                  '🔥 Participe todos os dias e suba no ranking!\n\n' +
                  'Pronto para começar?\n\n' +
                  '1️⃣ Sim, vamos lá!\n' +
                  '2️⃣ Ver meu ranking atual'
        });
    }

    async processarResposta(client, message, contato) {
        if (!contato.numero) {
            contato.numero = message.from.replace('@c.us', '');
        }
        
        const sessionKey = `${contato.numero}_game_teste`;
        let session = this.sessions.get(sessionKey);

        if (!session) {
            session = await this.recuperarSessaoBanco(contato.numero);
            if (session) {
                this.sessions.set(sessionKey, session);
                console.log(`🔄 [GAME_TESTE] Sessão recuperada: ${session.etapa}`);
            } else {
                await this.iniciarTreinamento(client, message, contato);
                return;
            }
        }

        const resposta = message.selectedButtonId || message.body;
        console.log(`🔍 [GAME_TESTE] Etapa: ${session.etapa} | Resposta: "${resposta}"`);

        switch (session.etapa) {
            case 'introducao':
                await this.processarIntroducao(client, message, session, resposta, contato);
                break;
            case 'quiz_ativo':
                await this.processarRespostaQuiz(client, message, session, resposta, contato);
                break;
            case 'ver_ranking':
                await this.processarVerRanking(client, message, session, resposta, contato);
                break;
            case 'finalizado':
                await this.processarFinalizado(client, message, session, resposta, contato);
                break;
            default:
                console.log(`⚠️ [GAME_TESTE] Etapa desconhecida: ${session.etapa}`);
                break;
        }
    }

    async processarIntroducao(client, message, session, resposta, contato) {
        const respostaNormalizada = resposta.toLowerCase().trim();
        
        if (resposta === '1' || respostaNormalizada.includes('sim') || respostaNormalizada.includes('vamos')) {
            session.etapa = 'quiz_ativo';
            session.pergunta_atual = 0;
            session.acertos_hoje = 0;
            session.pontuacao_diaria = 0;
            session.tempo_inicio_quiz = Date.now();
            
            // Shuffle de perguntas para garantir unicidade
            session.questoes_shuffled = [...QUESTOES_QUIZ]
                .sort(() => Math.random() - 0.5)
                .slice(0, session.config_quiz.questoes_por_dia);
            
            await this.salvarSessaoBanco(contato.numero, session);
            await this.iniciarQuizDiario(client, message, session, contato);
        } else if (resposta === '2' || respostaNormalizada.includes('ranking')) {
            await this.mostrarRankingAtual(client, message, contato);
        } else {
            await client.sendMessage(message.from, {
                text: '🤔 Não entendi. Escolha uma opção:\n\n1️⃣ Sim, vamos lá!\n2️⃣ Ver meu ranking atual'
            });
        }
    }

    async iniciarQuizDiario(client, message, session, contato) {
        const config = session.config_quiz;
        
        await client.sendMessage(message.from, {
            text: `🎮 *QUIZ DIÁRIO INICIADO!*\n\n` +
                  `📝 ${config.questoes_por_dia} perguntas\n` +
                  `⏱️ ${config.max_tempo_segundos}s por pergunta\n` +
                  `⭐ ${config.pontos_por_acerto} pontos por acerto\n` +
                  `⚡ Bônus por velocidade ativado!\n\n` +
                  `🚀 Vamos começar!`
        });

        setTimeout(async () => {
            await this.enviarProximaPergunta(client, message, session, contato);
        }, 2000);
    }

    async enviarProximaPergunta(client, message, session, contato) {
        session.pergunta_atual++;
        
        if (session.pergunta_atual > session.config_quiz.questoes_por_dia) {
            await this.finalizarQuizDiario(client, message, session, contato);
            return;
        }

        // Pegar próxima pergunta do shuffle (sem repetição)
        const pergunta = session.questoes_shuffled[session.pergunta_atual - 1];
        session.pergunta_atual_obj = pergunta;
        session.tempo_inicio_pergunta = Date.now();

        let texto = `❓ *Pergunta ${session.pergunta_atual}/${session.config_quiz.questoes_por_dia}*\n\n`;
        texto += `${pergunta.pergunta}\n\n`;
        
        pergunta.opcoes.forEach((opcao, index) => {
            texto += `${index + 1}️⃣ ${opcao}\n`;
        });
        
        texto += `\n⏱️ Você tem ${session.config_quiz.max_tempo_segundos} segundos!`;

        await client.sendMessage(message.from, { text: texto });
    }

    async processarRespostaQuiz(client, message, session, resposta, contato) {
        const tempo_resposta = Math.floor((Date.now() - session.tempo_inicio_pergunta) / 1000);
        const config = session.config_quiz;
        const pergunta = session.pergunta_atual_obj;
        
        // Converter resposta para índice (1-4 -> 0-3)
        const respostaIndex = parseInt(resposta) - 1;
        
        if (isNaN(respostaIndex) || respostaIndex < 0 || respostaIndex >= pergunta.opcoes.length) {
            await client.sendMessage(message.from, {
                text: '🤔 Resposta inválida. Digite o número da opção (1, 2, 3 ou 4).'
            });
            return;
        }

        const acertou = respostaIndex === pergunta.resposta_correta;
        session.total_questoes++;
        
        if (acertou) {
            let pontos = config.pontos_por_acerto;
            let mensagemBonus = '';
            
            // Bônus por tempo
            if (config.bonus_tempo && tempo_resposta < config.max_tempo_segundos / 2) {
                const bonus = 5;
                pontos += bonus;
                mensagemBonus = `\n⚡ *BÔNUS DE VELOCIDADE:* +${bonus} pontos!`;
            }
            
            session.acertos_hoje++;
            session.pontuacao_diaria += pontos;
            
            await client.sendMessage(message.from, {
                text: `✅ *CORRETO!* +${pontos} pontos${mensagemBonus}\n\n` +
                      `💡 ${pergunta.explicacao}\n\n` +
                      `📊 Pontuação atual: ${session.pontuacao_diaria} pontos`
            });
        } else {
            await client.sendMessage(message.from, {
                text: `❌ *INCORRETO!*\n\n` +
                      `✔️ Resposta correta: ${pergunta.opcoes[pergunta.resposta_correta]}\n\n` +
                      `💡 ${pergunta.explicacao}`
            });
        }

        await this.salvarSessaoBanco(contato.numero, session);

        setTimeout(async () => {
            await this.enviarProximaPergunta(client, message, session, contato);
        }, 3000);
    }

    async finalizarQuizDiario(client, message, session, contato) {
        const tempo_total = Math.floor((Date.now() - session.tempo_inicio_quiz) / 1000);
        
        await client.sendMessage(message.from, {
            text: '⏳ Calculando sua pontuação e atualizando ranking...'
        });

        // Usar contato.id diretamente
        if (!contato || !contato.id) {
            await client.sendMessage(message.from, {
                text: '❌ Erro ao identificar usuário. Tente novamente.'
            });
            return;
        }

        try {
            // Salvar pontuação na API
            const response = await axios.post('http://127.0.0.1:3000/api/quiz/score', {
                usuario_id: contato.id,
                treinamento_id: TREINAMENTO_ID,
                acertos: session.acertos_hoje,
                total_questoes: session.total_questoes,
                tempo_resposta: tempo_total
            }, {
                headers: {
                    'Authorization': 'Bearer internal-bot-token-2024'
                }
            });

            console.log('✅ Pontuação salva:', response.data);

            // Buscar ranking atualizado
            const rankingResponse = await axios.get(
                `http://127.0.0.1:3000/api/quiz/ranking/${TREINAMENTO_ID}?limit=10`,
                {
                    headers: {
                        'Authorization': 'Bearer internal-bot-token-2024'
                    }
                }
            );

            const ranking = rankingResponse.data;
            const minhaPosicao = ranking.findIndex(r => r.usuario_id === contato.id) + 1;
            const meusDados = ranking[minhaPosicao - 1];

            let mensagem = `🎮 *QUIZ FINALIZADO!*\n\n`;
            mensagem += `📊 *Resultado de Hoje:*\n`;
            mensagem += `✅ Acertos: ${session.acertos_hoje}/${session.total_questoes}\n`;
            mensagem += `⭐ Pontos ganhos: ${session.pontuacao_diaria}\n`;
            mensagem += `⏱️ Tempo total: ${tempo_total}s\n\n`;
            
            if (minhaPosicao > 0) {
                mensagem += `🏆 *Seu Ranking:*\n`;
                mensagem += `📍 Posição: ${minhaPosicao}º lugar\n`;
                mensagem += `💰 Total de pontos: ${meusDados.total_pontos}\n`;
                mensagem += `🔥 Dias consecutivos: ${meusDados.dias_consecutivos}\n`;
                mensagem += `🏅 Melhor sequência: ${meusDados.melhor_sequencia} dias\n\n`;
            }

            mensagem += `🎯 Volte amanhã para mais perguntas!\n\n`;
            mensagem += `O que deseja fazer?\n\n`;
            mensagem += `1️⃣ Ver ranking completo\n`;
            mensagem += `2️⃣ Ver meu histórico\n`;
            mensagem += `3️⃣ Finalizar`;

            await client.sendMessage(message.from, { text: mensagem });

            session.etapa = 'finalizado';
            const telefone = message.from.replace('@c.us', '');
            await this.salvarSessaoBanco(telefone, session);

        } catch (error) {
            console.error('❌ Erro ao salvar pontuação:', error);
            await client.sendMessage(message.from, {
                text: '❌ Erro ao processar resultado. Tente novamente mais tarde.'
            });
        }
    }

    async processarFinalizado(client, message, session, resposta, contato) {
        const respostaNormalizada = resposta.toLowerCase().trim();
        
        if (resposta === '1' || respostaNormalizada.includes('ranking')) {
            await this.mostrarRankingCompleto(client, message, contato);
        } else if (resposta === '2' || respostaNormalizada.includes('histórico') || respostaNormalizada.includes('historico')) {
            await this.mostrarHistorico(client, message, contato);
        } else if (resposta === '3' || respostaNormalizada.includes('finalizar')) {
            await this.finalizarTreinamento(client, message, contato);
        } else {
            await client.sendMessage(message.from, {
                text: '🤔 Escolha uma opção:\n\n1️⃣ Ver ranking completo\n2️⃣ Ver meu histórico\n3️⃣ Finalizar'
            });
        }
    }

    async mostrarRankingAtual(client, message, contato) {
        await this.mostrarRankingCompleto(client, message, contato);
    }

    async mostrarRankingCompleto(client, message, contato) {
        try {
            const response = await axios.get(
                `http://127.0.0.1:3000/api/quiz/ranking/${TREINAMENTO_ID}?limit=10`,
                {
                    headers: {
                        'Authorization': 'Bearer internal-bot-token-2024'
                    }
                }
            );

            const ranking = response.data;

            if (ranking.length === 0) {
                await client.sendMessage(message.from, {
                    text: '📊 Ainda não há participantes no ranking. Seja o primeiro!'
                });
                return;
            }

            let mensagem = `🏆 *TOP 10 RANKING*\n\n`;
            
            ranking.forEach((participante, index) => {
                const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
                mensagem += `${emoji} ${participante.usuario?.nome || 'Anônimo'}\n`;
                mensagem += `   💰 ${participante.total_pontos} pontos | 🔥 ${participante.dias_consecutivos} dias\n\n`;
            });

            await client.sendMessage(message.from, { text: mensagem });

        } catch (error) {
            console.error('❌ Erro ao buscar ranking:', error);
            await client.sendMessage(message.from, {
                text: '❌ Erro ao carregar ranking.'
            });
        }
    }

    async mostrarHistorico(client, message, contato) {
        try {
            const telefone = message.from.replace('@c.us', '');
            const usuario = await Usuario.findOne({ where: { telefone } });

            if (!usuario) return;

            const response = await axios.get(
                `http://127.0.0.1:3000/api/quiz/historico/${usuario.id}/${TREINAMENTO_ID}?dias=7`,
                {
                    headers: {
                        'Authorization': 'Bearer internal-bot-token-2024'
                    }
                }
            );

            const { historico, ranking } = response.data;

            if (historico.length === 0) {
                await client.sendMessage(message.from, {
                    text: '📊 Você ainda não tem histórico de participações.'
                });
                return;
            }

            let mensagem = `📊 *SEU HISTÓRICO (Últimos 7 dias)*\n\n`;
            
            historico.forEach(registro => {
                const data = new Date(registro.data_quiz).toLocaleDateString('pt-BR');
                mensagem += `📅 ${data}\n`;
                mensagem += `   ✅ ${registro.acertos}/${registro.total_questoes} acertos\n`;
                mensagem += `   ⭐ ${registro.pontuacao} pontos\n\n`;
            });

            if (ranking) {
                mensagem += `\n🏆 *Estatísticas Gerais:*\n`;
                mensagem += `💰 Total: ${ranking.total_pontos} pontos\n`;
                mensagem += `🔥 Sequência atual: ${ranking.dias_consecutivos} dias\n`;
                mensagem += `🏅 Melhor sequência: ${ranking.melhor_sequencia} dias\n`;
            }

            await client.sendMessage(message.from, { text: mensagem });

        } catch (error) {
            console.error('❌ Erro ao buscar histórico:', error);
            await client.sendMessage(message.from, {
                text: '❌ Erro ao carregar histórico.'
            });
        }
    }

    async finalizarTreinamento(client, message, contato) {
        await client.sendMessage(message.from, {
            text: '🎉 *Obrigado por participar!*\n\n' +
                  '🔥 Continue participando todos os dias para manter sua sequência!\n\n' +
                  '🏆 Quanto mais você joga, mais pontos acumula!\n\n' +
                  '📱 Até amanhã!'
        });

        const telefone = message.from.replace('@c.us', '');
        await this.removerSessaoBanco(telefone);
    }

    async salvarSessaoBanco(telefone, session) {
        try {
            await SessaoTreinamento.create({
                telefone: telefone,
                tipo_treinamento: 'game_teste',
                etapa_atual: session.etapa,
                dados_sessao: JSON.stringify(session),
                ativo: true,
                ultima_atualizacao: new Date()
            });
        } catch (error) {
            console.error('❌ Erro ao salvar sessão:', error);
        }
    }

    async recuperarSessaoBanco(telefone) {
        try {
            const sessaoSalva = await SessaoTreinamento.findOne({
                where: {
                    telefone: telefone,
                    tipo_treinamento: 'game_teste',
                    ativo: true
                },
                order: [['ultima_atualizacao', 'DESC']]
            });

            if (sessaoSalva && sessaoSalva.dadosSessao) {
                return JSON.parse(sessaoSalva.dadosSessao);
            }
            return null;
        } catch (error) {
            console.error('❌ Erro ao recuperar sessão:', error);
            return null;
        }
    }

    async removerSessaoBanco(telefone) {
        try {
            await SessaoTreinamento.update({ ativo: false }, {
                where: {
                    telefone: telefone,
                    tipo_treinamento: 'game_teste',
                    ativo: true
                }
            });
        } catch (error) {
            console.error('❌ Erro ao remover sessão:', error);
        }
    }
}

// Instância global
const gameTesteTraining = new GameTesteTraining();

// Função de compatibilidade
async function processarTreinamentoGameTeste(sender, text, selectedId, contato, sendMessage, buscarContato = null) {
    console.log(`🎮 [GAME_TESTE] Processando: "${text}" de ${sender}`);

    if (text === 'iniciar_treinamento') {
        const client = {
            sendMessage: async (to, options) => {
                if (options.text) {
                    await sendMessage(sender, 'send-message', { message: options.text });
                }
            }
        };
        const message = { from: sender };
        return await gameTesteTraining.iniciarTreinamento(client, message, contato);
    }

    const chaveProcessamento = `game_teste_${sender}`;
    if (global.processandoTreinamentos && global.processandoTreinamentos.has(chaveProcessamento)) {
        console.log('🔄 Game Teste já sendo processado');
        return true;
    }

    if (!global.processandoTreinamentos) global.processandoTreinamentos = new Set();
    global.processandoTreinamentos.add(chaveProcessamento);

    try {
        const client = {
            sendMessage: async (to, options) => {
                if (options.text) {
                    await sendMessage(sender, 'send-message', { message: options.text });
                }
            }
        };

        const message = {
            from: sender,
            body: text,
            selectedButtonId: selectedId || text
        };

        await gameTesteTraining.processarResposta(client, message, contato);

        setTimeout(() => {
            global.processandoTreinamentos.delete(chaveProcessamento);
        }, 2000);

        return true;
    } catch (error) {
        console.error('❌ Erro no Game Teste:', error);
        global.processandoTreinamentos.delete(chaveProcessamento);
        return false;
    }
}

module.exports = {
    processarTreinamentoGameTeste,
    GameTesteTraining,
    TREINAMENTO_ID,
    NOME_TREINAMENTO
};
