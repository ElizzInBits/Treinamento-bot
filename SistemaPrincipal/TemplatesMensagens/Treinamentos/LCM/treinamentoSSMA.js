//Script de Treinamento SSMA
//ID do Treinamento: 14

// sendMessage will be passed as parameter to avoid circular dependency
const { Treinamento, Contato } = require('../../../BancoDeDados/models/index.js');
const { Interacao, Empresa } = require('../../../BancoDeDados/models/index.js');
const { gerarCertificadoBanco, enviarEmail } = require('../../Certificados/certificados2.js');
const { Op } = require('sequelize');

// Respostas aceitas para verificação - EXPANDIDAS
const RESPOSTAS_POSITIVAS = ['sim', 'vamos', 'pode mandar', 'começar', 'iniciar', 'pronto', 'ok', 'vamos nessa', 'vamos começar', 'sim - vamos começar', 'confirmar', 'dados corretos', 'estou pronto', 'bora', 'beleza', 'certo', 'perfeito'];
const RESPOSTAS_NEGATIVAS = ['não', 'nao', 'ainda não', 'ainda nao', 'depois', 'mais tarde', 'preciso me preparar', 'dados incorretos', 'corrigir', 'cancelar', 'parar', 'sair', 'depois faço', 'não - depois faço'];

// Função universal para verificar respostas
function verificarRespostaSSMA(texto, tipo = 'positiva') {
    const textoLimpo = texto.toLowerCase().trim();
    const respostas = tipo === 'positiva' ? RESPOSTAS_POSITIVAS : RESPOSTAS_NEGATIVAS;
    
    return respostas.some(resposta => 
        textoLimpo.includes(resposta) || 
        textoLimpo === resposta ||
        textoLimpo.startsWith(resposta) ||
        textoLimpo.endsWith(resposta)
    );
}

// Quiz Módulo 1 - Fundamentos e Prevenção
const QUIZ_MODULO1_CONFIG = {
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
            explicacao: '✅ Correto! SSMA significa Saúde, Segurança e Meio Ambiente!'
        },
        {
            pergunta: '2. Segundo as premissas básicas da segurança, a responsabilidade pela segurança é:',
            alternativas: {
                a: 'Transferível para o supervisor',
                b: 'Individual e intransferível',
                c: 'Compartilhada com a equipe',
                d: 'Responsabilidade apenas da empresa'
            },
            respostaCorreta: 'b',
            explicacao: '✅ Correto! A responsabilidade pela segurança é de cada um e é INTRANSFERÍVEL!'
        },
        {
            pergunta: '3. Uma ferramenta cai ao lado de um trabalhador, sem atingi-lo. Isso é:',
            alternativas: {
                a: 'Acidente pessoal',
                b: 'Acidente material',
                c: 'Quase acidente',
                d: 'Não é acidente'
            },
            respostaCorreta: 'c',
            explicacao: '✅ Correto! É um quase acidente - evento que poderia ter causado lesão mas não causou.'
        },
        {
            pergunta: '4. Todo acidente deve ser comunicado:',
            alternativas: {
                a: 'Apenas se houver ferimento',
                b: 'Só os graves',
                c: 'Imediatamente ao SESMT',
                d: 'Apenas no final do dia'
            },
            respostaCorreta: 'c',
            explicacao: '✅ Correto! Todo acidente deve ser comunicado imediatamente ao SESMT!'
        },
        {
            pergunta: '5. Com que frequência são feitos os exames periódicos?',
            alternativas: {
                a: '6 meses',
                b: '12 meses',
                c: '18 meses',
                d: '24 meses'
            },
            respostaCorreta: 'b',
            explicacao: '✅ Correto! Os exames periódicos são feitos a cada 12 meses.'
        },
        {
            pergunta: '6. Qual exame é obrigatório antes de iniciar o trabalho?',
            alternativas: {
                a: 'Exame admissional',
                b: 'Exame periódico',
                c: 'Exame demissional',
                d: 'Exame de retorno'
            },
            respostaCorreta: 'a',
            explicacao: '✅ Correto! O exame admissional deve ser feito antes de começar a trabalhar!'
        }
    ]
};

// Quiz Módulo 2 - Controles e Equipamentos
const QUIZ_MODULO2_CONFIG = {
    perguntas: [
        {
            pergunta: '1. Qual é o principal objetivo do Mapa de Riscos?',
            alternativas: {
                a: 'Decorar o ambiente',
                b: 'Diagnóstico de segurança',
                c: 'Cumprir legislação',
                d: 'Impressionar clientes'
            },
            respostaCorreta: 'b',
            explicacao: '✅ Correto! O principal objetivo é fazer diagnóstico de segurança e saúde.'
        },
        {
            pergunta: '2. Qual é a diferença entre perigo e risco?',
            alternativas: {
                a: 'Não há diferença',
                b: 'Perigo é potencial, risco é probabilidade',
                c: 'Risco é mais grave',
                d: 'Perigo só existe na construção'
            },
            respostaCorreta: 'b',
            explicacao: '✅ Correto! Perigo é o potencial para causar danos, risco é a probabilidade de ocorrer.'
        },
        {
            pergunta: '3. Na hierarquia de controles, qual deve ser tentado PRIMEIRO?',
            alternativas: {
                a: 'EPI',
                b: 'Treinamento',
                c: 'Eliminação',
                d: 'Substituição'
            },
            respostaCorreta: 'c',
            explicacao: '✅ Correto! A eliminação do perigo deve ser sempre a primeira opção.'
        },
        {
            pergunta: '4. O que tem prioridade: EPC ou EPI?',
            alternativas: {
                a: 'EPI',
                b: 'EPC',
                c: 'Tanto faz',
                d: 'Depende da situação'
            },
            respostaCorreta: 'b',
            explicacao: '✅ Correto! EPC (Equipamento de Proteção Coletiva) tem prioridade sobre EPI.'
        },
        {
            pergunta: '5. Todo EPI deve ter:',
            alternativas: {
                a: 'Cor bonita',
                b: 'Certificado de Aprovação',
                c: 'Preço baixo',
                d: 'Marca famosa'
            },
            respostaCorreta: 'b',
            explicacao: '✅ Correto! Todo EPI deve ter Certificado de Aprovação (CA).'
        },
        {
            pergunta: '6. Verdadeiro ou Falso: A pressa é aliada da segurança.',
            alternativas: {
                a: 'Verdadeiro - mais rápido é melhor',
                b: 'Falso - pressa é inimiga da segurança',
                c: 'Verdadeiro - economiza tempo',
                d: 'Falso - só em emergências'
            },
            respostaCorreta: 'b',
            explicacao: '✅ Correto! A pressa é inimiga da segurança. "Quanto mais rápido trabalhar, melhor" é uma atitude perigosa.'
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
    await new Promise(resolve => setTimeout(resolve, 300));

    await sendMessage(sender, 'send-message', {
        message: '🎯 *OBJETIVOS DO TREINAMENTO*\n\n📋 *Objetivo Geral:*\nCapacitar os colaboradores nos princípios básicos de SSMA, desenvolvendo consciência sobre segurança, saúde e meio ambiente.\n\n🎯 *Objetivos Específicos:*\n• Conhecer os conceitos de SSMA\n• Identificar tipos de acidentes\n• Compreender programas de segurança\n• Utilizar EPIs corretamente',
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await sendMessage(sender, 'send-message', {
        message: '💡 *DICA IMPORTANTE:*\n\nA qualquer momento durante o treinamento, você pode digitar *MENU* para ver opções de:\n• Reiniciar treinamento completo\n• Reiniciar módulos específicos\n• Continuar normalmente\n\n📱 Use essa função sempre que precisar!',
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const iniciarMsg = {
        title: '',
        description: '📚 Você está pronto para começar o treinamento?',
        buttonText: 'Escolher opção',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'iniciar_ssma', title: 'SIM - Vamos começar! 🚀', description: '' },
                { id: 'nao_iniciar_ssma', title: 'NÃO - Preciso me preparar 📖', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', iniciarMsg);
    await salvarInteracao(sender, 'aguardando_confirmacao', 'treinamento_ssma');
}

/**
 * Processa resposta do usuário durante o treinamento
 */
async function processarResposta(sender, message, sendMessage) {
    const ultimaInteracao = await obterUltimaInteracao(sender);
    if (!ultimaInteracao) return false;

    const mensagem = message.toLowerCase().trim();

    // Aguardando confirmação para iniciar
    if (ultimaInteracao.tipo === 'aguardando_confirmacao') {
        if (RESPOSTAS_POSITIVAS.some(resp => mensagem.includes(resp)) || mensagem.includes('iniciar_ssma')) {
            await iniciarModulo1(sender, sendMessage);
            return true;
        }
        if (RESPOSTAS_NEGATIVAS.some(resp => mensagem.includes(resp)) || mensagem.includes('nao_iniciar_ssma')) {
            await sendMessage(sender, 'send-message', {
                message: '⏰ Sem problemas! Quando estiver pronto, digite *SSMA* para retomar o treinamento.',
            });
            return true;
        }
    }

    // Processando quiz módulo 1
    if (ultimaInteracao.tipo.startsWith('quiz_modulo1_')) {
        return await processarQuizModulo1(sender, mensagem, ultimaInteracao, sendMessage);
    }

    // Processando quiz módulo 2
    if (ultimaInteracao.tipo.startsWith('quiz_modulo2_')) {
        return await processarQuizModulo2(sender, mensagem, ultimaInteracao, sendMessage);
    }

    return false;
}

/**
 * Inicia o Módulo 1 do treinamento
 */
async function iniciarModulo1(sender, sendMessage) {
    const path = require('path');
    const fs = require('fs');

    // Enviar imagem NR 06
    const imagemNR06Path = path.join(__dirname, 'Imagens', 'NR 06.png');
    if (fs.existsSync(imagemNR06Path)) {
        try {
            await sendMessage(sender, 'send-image', {
                path: imagemNR06Path,
                filename: 'NR 06.png',
                caption: ''
            });
        } catch (error) {
            console.error('❌ Erro ao enviar imagem NR 06:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Enviar imagem SSMA
    const imagemSSMAPath = path.join(__dirname, 'Imagens', 'SSMA.png');
    if (fs.existsSync(imagemSSMAPath)) {
        try {
            await sendMessage(sender, 'send-image', {
                path: imagemSSMAPath,
                filename: 'SSMA.png',
                caption: ''
            });
        } catch (error) {
            console.error('❌ Erro ao enviar imagem SSMA:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Enviar imagem SST
    const imagemSSTPath = path.join(__dirname, 'Imagens', 'SST.png');
    if (fs.existsSync(imagemSSTPath)) {
        try {
            await sendMessage(sender, 'send-image', {
                path: imagemSSTPath,
                filename: 'SST.png',
                caption: ''
            });
        } catch (error) {
            console.error('❌ Erro ao enviar imagem SST:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Conteúdo completo do Módulo 1 - Fundamentos e Prevenção
    await sendMessage(sender, 'send-message', {
        message: '📖 *MÓDULO 1: FUNDAMENTOS E PREVENÇÃO*\n\n🎯 *O que é SSMA?*\nSaúde, Segurança e Meio Ambiente - conjunto de normas e procedimentos para proteger você, seus colegas e o planeta.\n\n🏥 *Segurança e Saúde no Trabalho (SST)*\nSST são normas e procedimentos legalmente exigidas que visam:\n• Prevenir doenças ocupacionais\n• Evitar acidentes de trabalho\n• Proteger sua integridade física\n• Garantir ambiente de trabalho saudável',
    });
    await new Promise(resolve => setTimeout(resolve, 5000));
    

    await sendMessage(sender, 'send-message', {
        message: '⚡ *Premissas Básicas da Segurança*\n\n🔴 A Segurança é IMPRESCINDÍVEL - não é opcional!\n🔴 A responsabilidade é de cada um e é INTRANSFERÍVEL\n🔴 Consciência em segurança é vital\n🔴 O único prejudicado pela falta de segurança será VOCÊ MESMO\n\n🎯 Nossa meta é ZERO acidentes! Acidentes causam sofrimento, afastamentos, problemas familiares e até morte.\n\n🚨 *REGRA FUNDAMENTAL: Nenhum colaborador pode trabalhar sem treinamento adequado!*',
    });
    await new Promise(resolve => setTimeout(resolve, 5000));


        
    //Envia imagem LEI
    const imagemLEIPath = path.join(__dirname, 'Imagens', 'LEI.png');
    if (fs.existsSync(imagemLEIPath)) {
        try {
            await sendMessage(sender, 'send-image', {
                path: imagemLEIPath,
                filename: 'LEI.png',
                caption: 'Lei 8.213/91'
            });
        } catch (error) {
            console.error('❌ Erro ao enviar imagem LEI:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));


    await sendMessage(sender, 'send-message', {
        message: '📖 *TIPOS DE ACIDENTES - CONHECER PARA PREVENIR*\n\n🚨 *TODO acidente do trabalho deve ser comunicado ao Setor da Segurança do Trabalho IMEDIATAMENTE!*',
    });
    await new Promise(resolve => setTimeout(resolve, 5000));


    //Enviar imagem CIPA
    const imagemCIPAPath = path.join(__dirname, 'Imagens', 'CIPA.png');
    if (fs.existsSync(imagemCIPAPath)) {
        try {
            await sendMessage(sender, 'send-image', {
                path: imagemCIPAPath,
                filename: 'CIPA.png',
                caption: ''
            });
        } catch (error) {
            console.error('❌ Erro ao enviar imagem CIPA:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));



    await sendMessage(sender, 'send-message', {
        message: '📋 *Classificação por Tipo de Dano:*\n\n🩹 *ACIDENTE PESSOAL*\n• Gera lesão física e/ou doença no colaborador\n• Pode causar morte, invalidez permanente\n• Exemplos: cortes, fraturas, queimaduras\n\n🌍 *ACIDENTE AMBIENTAL*\n• Danos ao meio ambiente, saúde pública\n• Exemplos: vazamentos, contaminação\n\n🔧 *ACIDENTE MATERIAL*\n• Danos em máquinas, equipamentos, veículos\n• Pode gerar paralisação de atividades\n\n⚠️ *QUASE ACIDENTE*\n• Evento que PODERIA ter sido acidente, mas não foi\n• Exemplo: Ferramenta pesada cai ao lado de trabalhador\n• Importante: São alertas para prevenção!',
    });
    await new Promise(resolve => setTimeout(resolve, 5000));

    await sendMessage(sender, 'send-message', {
        message: '🏥 *CUIDANDO DA SUA SAÚDE*\n\n🏥 *PCMSO - Programa de Controle Médico e Saúde Ocupacional*\n\nTodos devem realizar exames médicos conforme NR-7:\n\n🔹 *ADMISSIONAL* - Antes de começar\n🔹 *PERIÓDICO* - A cada 12 meses\n🔹 *MUDANÇA DE RISCO* - Ao trocar de função\n🔹 *RETORNO AO TRABALHO* - Após afastamento > 30 dias\n🔹 *DEMISSIONAL* - Na saída da empresa',
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    //Enviar imagem PCMSO
    const imagemPCMSOPath = path.join(__dirname, 'Imagens', 'PCMSO.png');
    if (fs.existsSync(imagemPCMSOPath)) {
        try {
            await sendMessage(sender, 'send-image', {
                path: imagemPCMSOPath,
                filename: 'PCMSO.png',
                caption: ''
            });
        } catch (error) {
            console.error('❌ Erro ao enviar imagem PCMSO:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    

    await sendMessage(sender, 'send-message', {
        message: '📝 *QUIZ MÓDULO 1*\n\nVamos testar seus conhecimentos sobre fundamentos e prevenção!',
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Perguntar se quer iniciar o quiz
    const quizMsg = {
        title: '',
        description: 'Deseja iniciar o quiz agora?',
        buttonText: 'Escolher opção',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'iniciar_quiz_modulo1', title: 'SIM - Iniciar quiz agora! 📝', description: '' },
                { id: 'nao_iniciar_quiz_modulo1', title: 'NÃO - Depois faço ⏰', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', quizMsg);
    await salvarInteracao(sender, 'aguardando_inicio_quiz_modulo1', JSON.stringify(quizMsg));
}

/**
 * Envia uma pergunta do quiz com lista de seleção
 */
async function enviarPergunta(sender, indicePergunta, config, tipoQuiz, sendMessage) {
    const pergunta = config.perguntas[indicePergunta];
    
    // Criar lista de alternativas
    const listMsg = {
        title: '',
        description: pergunta.pergunta,
        buttonText: 'Selecionar resposta',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: `${tipoQuiz}_${indicePergunta}_a`, title: `a) ${pergunta.alternativas.a}`, description: '' },
                { id: `${tipoQuiz}_${indicePergunta}_b`, title: `b) ${pergunta.alternativas.b}`, description: '' },
                { id: `${tipoQuiz}_${indicePergunta}_c`, title: `c) ${pergunta.alternativas.c}`, description: '' },
                { id: `${tipoQuiz}_${indicePergunta}_d`, title: `d) ${pergunta.alternativas.d}`, description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    
    // SEMPRE salvar dados completos da interação
    const dadosInteracao = { 
        perguntaAtual: indicePergunta,
        acertos: indicePergunta === 0 ? 0 : undefined // Apenas primeira pergunta inicia com 0
    };
    
    // Se não é primeira pergunta, buscar acertos da interação anterior
    if (indicePergunta > 0) {
        const ultimaInteracao = await obterUltimaInteracao(sender);
        if (ultimaInteracao) {
            try {
                const dadosAnteriores = JSON.parse(ultimaInteracao.mensagem || '{}');
                if (typeof dadosAnteriores.acertos === 'number') {
                    dadosInteracao.acertos = dadosAnteriores.acertos;
                }
            } catch (error) {
                console.error('Erro ao recuperar acertos anteriores:', error);
                dadosInteracao.acertos = 0; // Fallback seguro
            }
        }
    }
    
    console.log(`💾 Enviando pergunta ${indicePergunta + 1} com dados:`, dadosInteracao);
    await salvarInteracao(sender, `${tipoQuiz}_pergunta_${indicePergunta}`, JSON.stringify(dadosInteracao));
}

/**
 * Processa resposta do quiz módulo 1
 */
async function processarQuizModulo1(sender, resposta, ultimaInteracao, sendMessage) {
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const perguntaAtual = dados.perguntaAtual || 0;
    
    // Buscar acertos acumulados com fallback robusto
    let acertos = typeof dados.acertos === 'number' ? dados.acertos : 0;
    
    // Fallback: buscar acertos da última resposta válida se não existir no JSON atual
    if (typeof dados.acertos !== 'number') {
        const interacoesRecentes = await Interacao.findAll({
            where: { telefone: sender, tipo: { [Op.like]: 'quiz_modulo1_pergunta_%' } },
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        const ultimaComAcerto = interacoesRecentes.find(i => {
            try {
                const d = JSON.parse(i.mensagem || '{}');
                return typeof d.acertos === 'number';
            } catch { return false; }
        });
        if (ultimaComAcerto) {
            const dadosAnteriores = JSON.parse(ultimaComAcerto.mensagem);
            acertos = dadosAnteriores.acertos;
            console.log(`🔄 Acertos recuperados do fallback: ${acertos}`);
        }
    }
    
    const respostaLimpa = extrairResposta(resposta);
    const pergunta = QUIZ_MODULO1_CONFIG.perguntas[perguntaAtual];
    const respostaCorreta = respostaLimpa === pergunta.respostaCorreta;
    
    console.log(`📊 Quiz Módulo 1 - Pergunta ${perguntaAtual + 1}: Resposta="${respostaLimpa}", Correta="${pergunta.respostaCorreta}", Acerto=${respostaCorreta}, Acertos Antes=${acertos}`);
    
    // Atualizar acertos se resposta estiver correta
    if (respostaCorreta) {
        acertos += 1;
    }
    
    console.log(`📊 Acertos após pergunta ${perguntaAtual + 1}: ${acertos}/${QUIZ_MODULO1_CONFIG.perguntas.length}`);
    
    // Feedback da resposta
    await sendMessage(sender, 'send-message', {
        message: respostaCorreta ? pergunta.explicacao : `❌ Incorreto. A resposta correta é "${pergunta.respostaCorreta.toUpperCase()}".`,
    });
    
    const proximaPergunta = perguntaAtual + 1;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Verifica se terminou o módulo 1
    if (proximaPergunta >= QUIZ_MODULO1_CONFIG.perguntas.length) {
        console.log(`🏁 Finalizando Módulo 1 com ${acertos} acertos`);
        await finalizarModulo1(sender, acertos, sendMessage);
        return true;
    }
    
    // Próxima pergunta - SEMPRE salvar acertos atualizados
    const dadosProximaPergunta = { acertos: acertos, perguntaAtual: proximaPergunta };
    await salvarInteracao(sender, `quiz_modulo1_pergunta_${proximaPergunta}`, JSON.stringify(dadosProximaPergunta));
    console.log(`💾 Salvando estado: ${JSON.stringify(dadosProximaPergunta)}`);
    await enviarPergunta(sender, proximaPergunta, QUIZ_MODULO1_CONFIG, 'quiz_modulo1', sendMessage);
    return true;
}

/**
 * Finaliza o módulo 1 e inicia módulo 2
 */
async function finalizarModulo1(sender, acertos, sendMessage) {
    const total = QUIZ_MODULO1_CONFIG.perguntas.length;
    const percentual = Math.round((acertos / total) * 100);
    
    await sendMessage(sender, 'send-message', {
        message: `🎯 *MÓDULO 1 CONCLUÍDO!*\n\n📊 Resultado: ${acertos}/${total} (${percentual}%)`,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await iniciarModulo2(sender, sendMessage);
}

/**
 * Inicia o Módulo 2 do treinamento
 */
async function iniciarModulo2(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '📖 *MÓDULO 2: CONTROLES E EQUIPAMENTOS*\n\n🗺️ *MAPAS DE RISCOS - VISUALIZANDO PERIGOS*\n\n🎯 *Objetivos:*\n• Diagnóstico de segurança e saúde\n• Troca de informações entre trabalhadores\n• Estimular participação na prevenção\n• Conscientizar sobre riscos existentes\n\n🔧 *Como Funcionam:*\n• Representação gráfica dos ambientes\n• Cores diferentes para tipos de riscos\n• Tamanhos diferentes para intensidade\n• Símbolos específicos para cada situação\n\n👥 *Sua participação é fundamental! Você conhece melhor os riscos da sua atividade.*',
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    //Enviar imagem MAPARISCO   
    const path = require('path');
    const fs = require('fs');
    const imagemMapaRiscoPath = path.join(__dirname, 'Imagens', 'MAPARISCO.png');
    if (fs.existsSync(imagemMapaRiscoPath)) {
        try {
            await sendMessage(sender, 'send-image', {
                path: imagemMapaRiscoPath,
                filename: 'MAPARISCO.png',
                caption: 'MAPA DE RISCOS',
            });
        } catch (error) {
            console.error('Erro ao enviar imagem:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));

    await sendMessage(sender, 'send-message', {
        message: '📖 *PERIGOS, RISCOS E CONTROLES*\n\n🔍 *Diferença Fundamental:*\n\n⚠️ *PERIGO:* Fonte/situação com potencial para causar danos\n📊 *RISCO:* Possibilidade de que uma perda ou dano ocorra\n\n📐 *Fórmula: RISCO = Probabilidade × Consequência*\n\n🏆 *HIERARQUIA DE CONTROLES (seguir esta ordem!)*\n\n1️⃣ *ELIMINAÇÃO* - Remover completamente o perigo (mais eficaz!)\n2️⃣ *SUBSTITUIÇÃO* - Trocar por algo menos perigoso\n3️⃣ *CONTROLES DE ENGENHARIA* - Barreiras físicas, proteções coletivas\n4️⃣ *CONTROLES ADMINISTRATIVOS* - Procedimentos, treinamentos, sinalização\n5️⃣ *EPI* - ÚLTIMA opção, não a primeira!',
    });
    await new Promise(resolve => setTimeout(resolve, 5000));

    await sendMessage(sender, 'send-message', {
        message: '📖 *EQUIPAMENTOS DE PROTEÇÃO* 🛡️\n\n🔄 *EPC vs EPI*\n\n👥 *EQUIPAMENTOS DE PROTEÇÃO COLETIVA (EPC)*\n• Protegem TODOS os trabalhadores\n• Exemplos: guarda-corpos, ventilação, sinalização\n• PRIORIDADE sobre EPI\n\n👤 *EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL (EPI)*\n• Dispositivos de uso pessoal\n• USO OBRIGATÓRIO por norma\n• Todo EPI precisa de Certificado de Aprovação - CA\n• Aprenda como usar, guardar e conservar seu EPI\n• Se danificado, comunique para substituição\n• Use de forma adequada e sempre que necessário!\n\n🛡️ *EPI protege apenas quem usa. Controles coletivos protegem todos!*',
    });
    await new Promise(resolve => setTimeout(resolve, 5000));

    await sendMessage(sender, 'send-message', {
        message: '⚠️ *4 Atitudes Perigosas a Evitar:*\n\n🚫 "Nunca irá acontecer comigo"\n🚫 "Sou ótimo profissional, não preciso de EPI"\n🚫 "EPIs são desconfortáveis"\n🚫 "Quanto mais rápido trabalhar, melhor"\n\n💡 *Lembre-se: A pressa é inimiga da segurança!*',
    });
    await new Promise(resolve => setTimeout(resolve, 5000));

    await sendMessage(sender, 'send-message', {
        message: '📝 *QUIZ MÓDULO 2*\n\nVamos testar seus conhecimentos sobre controles e equipamentos!',
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Perguntar se quer iniciar o quiz
    const quizMsg = {
        title: '',
        description: 'Deseja iniciar o quiz agora?',
        buttonText: 'Escolher opção',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'iniciar_quiz_modulo2', title: 'SIM - Iniciar quiz agora! 📝', description: '' },
                { id: 'nao_iniciar_quiz_modulo2', title: 'NÃO - Depois faço ⏰', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', quizMsg);
    await salvarInteracao(sender, 'aguardando_inicio_quiz_modulo2', JSON.stringify(quizMsg));
}

/**
 * Função universal para processar respostas de quiz
 */
function extrairResposta(resposta) {
    let respostaLimpa = resposta.toLowerCase().trim();
    
    if (respostaLimpa.includes('_')) {
        // Se é selectedId (ex: quiz_modulo1_0_a), pegar a última parte
        respostaLimpa = respostaLimpa.split('_').pop();
    } else {
        // Se é texto digitado, extrair a letra da alternativa
        // Procurar por padrões como "a)", "b)", "c)", "d)" ou apenas "a", "b", "c", "d"
        const match = respostaLimpa.match(/^([abcd])\)|\b([abcd])\)|^([abcd])$|\b([abcd])\b/);
        if (match) {
            // Pegar o primeiro grupo que não é undefined
            respostaLimpa = match[1] || match[2] || match[3] || match[4];
        } else {
            // Fallback: pegar primeiro caractere se for a, b, c ou d
            const primeiroChar = respostaLimpa.charAt(0);
            if (['a', 'b', 'c', 'd'].includes(primeiroChar)) {
                respostaLimpa = primeiroChar;
            }
        }
    }
    
    console.log(`🔍 Resposta extraída: "${resposta}" -> "${respostaLimpa}"`);
    return respostaLimpa;
}

/**
 * Processa resposta do quiz módulo 2
 */
async function processarQuizModulo2(sender, resposta, ultimaInteracao, sendMessage) {
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const perguntaAtual = dados.perguntaAtual || 0;
    
    // Buscar acertos acumulados com fallback robusto
    let acertos = typeof dados.acertos === 'number' ? dados.acertos : 0;
    
    // Fallback: buscar acertos da última resposta válida se não existir no JSON atual
    if (typeof dados.acertos !== 'number') {
        const interacoesRecentes = await Interacao.findAll({
            where: { telefone: sender, tipo: { [Op.like]: 'quiz_modulo2_pergunta_%' } },
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        const ultimaComAcerto = interacoesRecentes.find(i => {
            try {
                const d = JSON.parse(i.mensagem || '{}');
                return typeof d.acertos === 'number';
            } catch { return false; }
        });
        if (ultimaComAcerto) {
            const dadosAnteriores = JSON.parse(ultimaComAcerto.mensagem);
            acertos = dadosAnteriores.acertos;
            console.log(`🔄 Módulo 2 - Acertos recuperados do fallback: ${acertos}`);
        }
    }
    
    const respostaLimpa = extrairResposta(resposta);
    const pergunta = QUIZ_MODULO2_CONFIG.perguntas[perguntaAtual];
    const respostaCorreta = respostaLimpa === pergunta.respostaCorreta;
    
    console.log(`📊 Quiz Módulo 2 - Pergunta ${perguntaAtual + 1}: Resposta="${respostaLimpa}", Correta="${pergunta.respostaCorreta}", Acerto=${respostaCorreta}, Acertos Antes=${acertos}`);
    
    // Atualizar acertos se resposta estiver correta
    if (respostaCorreta) {
        acertos += 1;
    }
    
    console.log(`📊 Acertos após pergunta ${perguntaAtual + 1}: ${acertos}/${QUIZ_MODULO2_CONFIG.perguntas.length}`);
    
    await sendMessage(sender, 'send-message', {
        message: respostaCorreta ? pergunta.explicacao : `❌ Incorreto. A resposta correta é "${pergunta.respostaCorreta.toUpperCase()}".`,
    });
    
    const proximaPergunta = perguntaAtual + 1;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (proximaPergunta >= QUIZ_MODULO2_CONFIG.perguntas.length) {
        await finalizarModulo2(sender, acertos, sendMessage);
        return true;
    }
    
    // Salvar acertos atualizados para próxima pergunta
    const dadosProximaPergunta = { acertos: acertos, perguntaAtual: proximaPergunta };
    await salvarInteracao(sender, `quiz_modulo2_pergunta_${proximaPergunta}`, JSON.stringify(dadosProximaPergunta));
    console.log(`💾 Módulo 2 - Salvando estado: ${JSON.stringify(dadosProximaPergunta)}`);
    await enviarPergunta(sender, proximaPergunta, QUIZ_MODULO2_CONFIG, 'quiz_modulo2', sendMessage);
    return true;
}

/**
 * Finaliza módulo 2 e finaliza treinamento
 */
async function finalizarModulo2(sender, acertos, sendMessage) {
    const total = QUIZ_MODULO2_CONFIG.perguntas.length;
    const percentual = Math.round((acertos / total) * 100);
    
    await sendMessage(sender, 'send-message', {
        message: `🎯 *MÓDULO 2 CONCLUÍDO!*\n\n📊 Resultado: ${acertos}/${total} (${percentual}%)`,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await finalizarTreinamento(sender, acertos, sendMessage);
}



/**
 * Finaliza o treinamento completo
 */
async function finalizarTreinamento(sender, acertosModulo2, sendMessage) {
    // Considerações finais

    // Enviar imagem SEGURANCA
    const path = require('path');
    const fs = require('fs');
    const imagemSegurancaPath = path.join(__dirname, 'Imagens', 'SEGURANCA.png');
    if (fs.existsSync(imagemSegurancaPath)) {
        try {
            await sendMessage(sender, 'send-image', {        
                path: imagemSegurancaPath,      
                filename: 'SEGURANCA.png',
                caption: '',
            });
        } catch (error) {
            console.error('Erro ao enviar imagem SEGURANCA:', error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));


    await sendMessage(sender, 'send-message', {
        message: '🎆 *CONSIDERAÇÕES FINAIS*\n\n🛡️ *Sua Segurança Depende de Você*\n• A Responsabilidade é individual e intransferível\n• O Conhecimento salva vidas\n• A Prevenção é sempre melhor que correção\n• Sua família conta com você voltando seguro para casa\n\n📞 *Contatos Importantes*\n• SESMT: Sempre disponível para dúvidas e orientações\n• CIPA: Seus representantes na prevenção\n• Emergência: Comunicar IMEDIATAMENTE qualquer acidente',
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));


    
    await sendMessage(sender, 'send-message', {
        message: '🎉 *TREINAMENTO CONCLUÍDO COM SUCESSO!*\n\n🏆 Parabéns! Você completou os 2 módulos do treinamento SSMA.\n\n📚 *Lembre-se: SSMA não é apenas um conjunto de regras, é um modo de vida que protege você, seus colegas e o meio ambiente. Pratique sempre!*',
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

     // Mensagem final do treinamento
     await sendMessage(sender, 'send-message', {
        message: '🎉 *PARABÉNS! TREINAMENTO CONCLUÍDO COM SUCESSO!*\n\n🔧 *CERTIFICADO EM MANUTENÇÃO*\n\nNosso sistema de geração de certificados está temporariamente em manutenção pela equipe de desenvolvimento.\n\n✅ *Seu treinamento foi registrado com sucesso!*\n\n📬 *Em breve você receberá:*\n• Certificado digital aqui no chat\n• Certificado por e-mail no endereço cadastrado\n\n⏰ Sistema será normalizado em breve.\n\n🙏 Agradecemos sua compreensão e parabenizamos pela dedicação!',
    });
    
    // Enviar mensagem de manutenção diretamente
    try {
        const contato = await Contato.findOne({ where: { telefone: sender } });
        if (contato) {
            // Chamar diretamente a função de geração de certificado (que agora envia mensagem de manutenção)
            await gerarCertificadoSSMA(sender, contato, sendMessage);
        }
    } catch (error) {
        console.error('Erro ao finalizar treinamento:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro ao finalizar treinamento. Entre em contato com o suporte.',
        });
    }
}

/**
 * Detecta se usuário teve treinamento interrompido por restart e oferece recuperação
 */
async function detectarTreinamentoInterrompido(sender, contato, sendMessage) {
    if (contato.statusTreinamento !== 'em andamento') return false;
    
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    // Se não tem interação ou é muito antiga (mais de 1 hora), considerar interrompido
    const agora = new Date();
    const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000);
    
    if (!ultimaInteracao || ultimaInteracao.createdAt < umaHoraAtras) {
        await sendMessage(sender, 'send-message', {
            message: '🔄 *TREINAMENTO INTERROMPIDO DETECTADO*\n\nParece que seu treinamento foi interrompido. Não se preocupe!\n\n📱 Digite *MENU* para ver suas opções ou escolha abaixo:'
        });
        
        const recuperacaoMsg = {
            title: '',
            description: 'Como deseja continuar?',
            buttonText: 'Escolher opção',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'continuar_de_onde_parou', title: '▶️ Continuar de onde parei', description: 'Tentar recuperar progresso' },
                    { id: 'reiniciar_treinamento_completo', title: '🔄 Reiniciar do início', description: 'Começar novamente' },
                    { id: 'ver_menu_opcoes', title: '📋 Ver todas as opções', description: 'Menu completo' },
                ],
            }],
        };
        
        await sendMessage(sender, 'send-list-message', recuperacaoMsg);
        await salvarInteracao(sender, 'recuperacao_treinamento', JSON.stringify(recuperacaoMsg));
        return true;
    }
    
    return false;
}

/**
 * Exibe menu de opções para reiniciar treinamento ou módulos
 */
async function exibirMenuOpcoes(sender, sendMessage) {
    const menuMsg = {
        title: '',
        description: '📋 *MENU DE OPÇÕES*\n\nEscolha o que deseja fazer:',
        buttonText: 'Selecionar opção',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'reiniciar_treinamento_completo', title: '🔄 Reiniciar treinamento completo', description: 'Começar do início' },
                { id: 'reiniciar_modulo1', title: '📖 Reiniciar Módulo 1', description: 'Fundamentos e Prevenção' },
                { id: 'reiniciar_modulo2', title: '🛡️ Reiniciar Módulo 2', description: 'Controles e Equipamentos' },
                { id: 'continuar_normal', title: '▶️ Continuar normalmente', description: 'Voltar ao treinamento' },
            ],
        }],
    };
    
    await sendMessage(sender, 'send-list-message', menuMsg);
    await salvarInteracao(sender, 'menu_opcoes', JSON.stringify(menuMsg));
}

/**
 * Processa as respostas do treinamento SSMA - VERSÃO COMPLETA
 */
async function processarRespostaSSMA(sender, text, selectedId, contato, sendMessage) {
    console.log(`🔍 processarRespostaSSMA chamado: text="${text}", selectedId="${selectedId}"`);
    
    // Verificar se usuário digitou 'menu'
    if (text.toLowerCase().includes('menu')) {
        await exibirMenuOpcoes(sender, sendMessage);
        return true;
    }
    
    // Comando continuar para retomar treinamento
    if (text.toLowerCase() === 'continuar') {
        console.log('🔄 Comando continuar detectado');
        
        // Verificar progresso atual do usuário
        if (contato.statusTreinamento === 'em_andamento') {
            // Se tem interação de quiz pendente, continuar quiz
            if (ultimaInteracao?.tipo?.startsWith('quiz_modulo1_')) {
                await sendMessage(sender, 'send-message', {
                    message: '📝 Continuando quiz do Módulo 1...'
                });
                return true;
            } else if (ultimaInteracao?.tipo?.startsWith('quiz_modulo2_')) {
                await sendMessage(sender, 'send-message', {
                    message: '📝 Continuando quiz do Módulo 2...'
                });
                return true;
            } else {
                // Oferecer quiz do módulo 1 se não tem progresso específico
                const quizMsg = {
                    title: '',
                    description: 'Deseja iniciar o quiz do Módulo 1?',
                    buttonText: 'Escolher opção',
                    listType: 'SINGLE_SELECT',
                    sections: [{
                        title: '',
                        rows: [
                            { id: 'iniciar_quiz_modulo1', title: 'SIM - Iniciar quiz agora! 📝', description: '' },
                            { id: 'nao_iniciar_quiz_modulo1', title: 'NÃO - Depois faço ⏰', description: '' },
                        ],
                    }],
                };
                await sendMessage(sender, 'send-list-message', quizMsg);
                await salvarInteracao(sender, 'aguardando_inicio_quiz_modulo1', JSON.stringify(quizMsg));
                return true;
            }
        } else {
            // Se não está em andamento, iniciar do começo
            await iniciarModulo1(sender, sendMessage);
            return true;
        }
    }
    
    const ultimaInteracao = await obterUltimaInteracao(sender);
    console.log(`🔍 Última interação: ${ultimaInteracao?.tipo}`);
    
    // Processar opções de recuperação
    if (ultimaInteracao?.tipo === 'recuperacao_treinamento') {
        if (selectedId === 'continuar_de_onde_parou') {
            await sendMessage(sender, 'send-message', {
                message: '🔍 Tentando recuperar seu progresso...'
            });
            
            // Buscar última interação relevante antes da interrupção
            const interacoesAnteriores = await Interacao.findAll({
                where: { telefone: sender },
                order: [['createdAt', 'DESC']],
                limit: 20
            });
            
            const ultimaRelevante = interacoesAnteriores.find(i => 
                i.tipo !== 'recuperacao_treinamento' && 
                i.tipo !== 'opcoes_continuidade' &&
                i.mensagem && i.mensagem.trim() !== ''
            );
            
            if (ultimaRelevante && ultimaRelevante.tipo.includes('modulo2')) {
                await sendMessage(sender, 'send-message', {
                    message: '✅ Progresso recuperado! Você estava no Módulo 2.'
                });
                await iniciarModulo2(sender, sendMessage);
            } else if (ultimaRelevante && ultimaRelevante.tipo.includes('modulo1')) {
                await sendMessage(sender, 'send-message', {
                    message: '✅ Progresso recuperado! Você estava no Módulo 1.'
                });
                await iniciarModulo1(sender, sendMessage);
            } else {
                await sendMessage(sender, 'send-message', {
                    message: '🔄 Não foi possível recuperar o progresso. Reiniciando do início...'
                });
                await executarTreinamento(sender, contato, sendMessage);
            }
            return true;
        }
        
        if (selectedId === 'ver_menu_opcoes') {
            await exibirMenuOpcoes(sender, sendMessage);
            return true;
        }
    }
    
    // Processar opções do menu - CORRIGIDO
    if (ultimaInteracao?.tipo === 'menu_opcoes' || ultimaInteracao?.tipo === 'recuperacao_treinamento' || 
        text.toLowerCase().includes('reiniciar treinamento completo') || 
        text.toLowerCase().includes('reiniciar módulo')) {
        
        if (selectedId === 'reiniciar_treinamento_completo' || text.toLowerCase().includes('reiniciar treinamento completo')) {
            await sendMessage(sender, 'send-message', {
                message: '🔄 Reiniciando treinamento completo...'
            });
            await executarTreinamento(sender, contato, sendMessage);
            return true;
        }
        
        if (selectedId === 'reiniciar_modulo1' || text.toLowerCase().includes('reiniciar módulo 1')) {
            await sendMessage(sender, 'send-message', {
                message: '📖 Reiniciando Módulo 1...'
            });
            await iniciarModulo1(sender, sendMessage);
            return true;
        }
        
        if (selectedId === 'reiniciar_modulo2' || text.toLowerCase().includes('reiniciar módulo 2')) {
            await sendMessage(sender, 'send-message', {
                message: '🛡️ Reiniciando Módulo 2...'
            });
            await iniciarModulo2(sender, sendMessage);
            return true;
        }
        
        if (selectedId === 'continuar_normal' || text.toLowerCase().includes('continuar normalmente')) {
            await sendMessage(sender, 'send-message', {
                message: '▶️ Continuando treinamento normalmente...'
            });
            
            // Verificar progresso atual do usuário baseado no status
            if (contato.statusTreinamento === 'em_andamento') {
                // Buscar última interação de quiz para determinar onde estava
                const interacoesQuiz = await Interacao.findAll({
                    where: { 
                        telefone: sender,
                        tipo: { [Op.like]: '%quiz%' }
                    },
                    order: [['createdAt', 'DESC']],
                    limit: 5
                });
                
                const ultimoQuiz = interacoesQuiz[0];
                
                if (ultimoQuiz && ultimoQuiz.tipo.includes('modulo2')) {
                    // Estava no módulo 2, oferecer quiz módulo 2
                    const quizMsg = {
                        title: '',
                        description: 'Deseja continuar com o quiz do Módulo 2?',
                        buttonText: 'Escolher opção',
                        listType: 'SINGLE_SELECT',
                        sections: [{
                            title: '',
                            rows: [
                                { id: 'iniciar_quiz_modulo2', title: 'SIM - Continuar quiz Módulo 2! 📝', description: '' },
                                { id: 'nao_iniciar_quiz_modulo2', title: 'NÃO - Depois faço ⏰', description: '' },
                            ],
                        }],
                    };
                    await sendMessage(sender, 'send-list-message', quizMsg);
                    await salvarInteracao(sender, 'aguardando_inicio_quiz_modulo2', JSON.stringify(quizMsg));
                } else {
                    // Padrão: oferecer quiz módulo 1
                    const quizMsg = {
                        title: '',
                        description: 'Deseja iniciar o quiz do Módulo 1?',
                        buttonText: 'Escolher opção',
                        listType: 'SINGLE_SELECT',
                        sections: [{
                            title: '',
                            rows: [
                                { id: 'iniciar_quiz_modulo1', title: 'SIM - Iniciar quiz agora! 📝', description: '' },
                                { id: 'nao_iniciar_quiz_modulo1', title: 'NÃO - Depois faço ⏰', description: '' },
                            ],
                        }],
                    };
                    await sendMessage(sender, 'send-list-message', quizMsg);
                    await salvarInteracao(sender, 'aguardando_inicio_quiz_modulo1', JSON.stringify(quizMsg));
                }
            } else {
                // Se não está em andamento, iniciar do começo
                await executarTreinamento(sender, contato, sendMessage);
            }
            return true;
        }
    }
    
    // Aguardando confirmação para iniciar
    if (selectedId === 'iniciar_ssma' || (ultimaInteracao?.tipo === 'aguardando_confirmacao' && verificarRespostaSSMA(text, 'positiva'))) {
        console.log('✅ Iniciando módulo 1');
        await iniciarModulo1(sender, sendMessage);
        return true;
    }
    
    // Aguardando confirmação para iniciar quiz módulo 1
    if (selectedId === 'iniciar_quiz_modulo1' || 
        (ultimaInteracao?.tipo === 'aguardando_inicio_quiz_modulo1' && verificarRespostaSSMA(text, 'positiva')) ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_quiz_modulo1' && text.toLowerCase().includes('sim - iniciar quiz agora'))) {
        console.log('✅ Iniciando quiz módulo 1');
        await salvarInteracao(sender, 'quiz_modulo1_pergunta_0', JSON.stringify({ acertos: 0, perguntaAtual: 0 }));
        await enviarPergunta(sender, 0, QUIZ_MODULO1_CONFIG, 'quiz_modulo1', sendMessage);
        return true;
    }
    
    if (selectedId === 'nao_iniciar_quiz_modulo1' || 
        (ultimaInteracao?.tipo === 'aguardando_inicio_quiz_modulo1' && verificarRespostaSSMA(text, 'negativa')) ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_quiz_modulo1' && text.toLowerCase().includes('não - depois faço'))) {
        await sendMessage(sender, 'send-message', {
            message: '⏰ Sem problemas! Quando estiver pronto para o quiz, me avise.',
        });
        return true;
    }
    
    // Aguardando confirmação para iniciar quiz módulo 2
    if (selectedId === 'iniciar_quiz_modulo2' || 
        (ultimaInteracao?.tipo === 'aguardando_inicio_quiz_modulo2' && verificarRespostaSSMA(text, 'positiva')) ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_quiz_modulo2' && text.toLowerCase().includes('sim - iniciar quiz agora'))) {
        console.log('✅ Iniciando quiz módulo 2');
        await salvarInteracao(sender, 'quiz_modulo2_pergunta_0', JSON.stringify({ acertos: 0, perguntaAtual: 0 }));
        await enviarPergunta(sender, 0, QUIZ_MODULO2_CONFIG, 'quiz_modulo2', sendMessage);
        return true;
    }
    
    // Tratar respostas inesperadas durante quiz
    if (ultimaInteracao?.tipo?.startsWith('quiz_modulo1_pergunta_') || ultimaInteracao?.tipo?.startsWith('quiz_modulo2_pergunta_')) {
        // Se não é selectedId válido e não contém a, b, c, d, orientar usuário
        if (!selectedId && !text.toLowerCase().match(/[abcd]/)) {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ Por favor, selecione uma das alternativas (a, b, c ou d) ou use os botões da lista para responder à pergunta.'
            });
            return true;
        }
    }
    
    if (selectedId === 'nao_iniciar_quiz_modulo2' || 
        (ultimaInteracao?.tipo === 'aguardando_inicio_quiz_modulo2' && verificarRespostaSSMA(text, 'negativa')) ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_quiz_modulo2' && text.toLowerCase().includes('não - depois faço'))) {
        await sendMessage(sender, 'send-message', {
            message: '⏰ Sem problemas! Quando estiver pronto para o quiz, me avise.',
        });
        return true;
    }
    
    // Processar respostas de quiz por selectedId
    if (selectedId && selectedId.includes('_')) {
        const partes = selectedId.split('_');
        if (partes.length >= 3) {
            const tipoQuiz = partes[0] + '_' + partes[1]; // quiz_modulo1, quiz_modulo2, etc.
            const perguntaNum = parseInt(partes[2]);
            const resposta = partes[3]; // a, b, c, d
            
            console.log(`🔍 Processando resposta de quiz: ${tipoQuiz}, pergunta ${perguntaNum}, resposta ${resposta}`);
            
            // Processar baseado no tipo de quiz
            if (tipoQuiz === 'quiz_modulo1') {
                return await processarQuizModulo1(sender, resposta, ultimaInteracao, sendMessage);
            } else if (tipoQuiz === 'quiz_modulo2') {
                return await processarQuizModulo2(sender, resposta, ultimaInteracao, sendMessage);
            }
        }
    }
    
    if (selectedId === 'nao_iniciar_ssma' || (ultimaInteracao?.tipo === 'aguardando_confirmacao' && verificarRespostaSSMA(text, 'negativa'))) {
        await sendMessage(sender, 'send-message', {
            message: '⏰ Sem problemas! Quando estiver pronto, digite *SSMA* para retomar o treinamento.',
        });
        return true;
    }
    
    // Processando quiz módulo 1
    if (ultimaInteracao?.tipo?.startsWith('quiz_modulo1_')) {
        console.log('🔍 Processando quiz módulo 1');
        return await processarQuizModulo1(sender, text, ultimaInteracao, sendMessage);
    }
    
    // Processando quiz módulo 2
    if (ultimaInteracao?.tipo?.startsWith('quiz_modulo2_')) {
        console.log('🔍 Processando quiz módulo 2');
        return await processarQuizModulo2(sender, text, ultimaInteracao, sendMessage);
    }
    

    
    // Confirmação de dados para certificado
    if (selectedId === 'dados_corretos_ssma' || text.toLowerCase().includes('dados estão corretos')) {
        console.log('✅ Gerando certificado');
        await gerarCertificadoSSMA(sender, contato, sendMessage);
        return true;
    }
    
    // Verificar se treinamento já foi concluído para evitar reprocessamento
    if (ultimaInteracao?.tipo === 'treinamento_concluido_final') {
        console.log('⚠️ Treinamento já concluído - ignorando mensagem');
        return true;
    }
    
    console.log('❌ Nenhuma condição atendida');
    return false;
}

/**
 * Gera certificado SSMA
 */
async function gerarCertificadoSSMA(sender, contato, sendMessage) {
    try {
        // Atualizar status do contato
        await contato.update({
            statusTreinamento: 'concluído'
        });
        
        // Salvar interação final para parar processamento
        await salvarInteracao(sender, 'treinamento_concluido_final', 'ssma_completo_parar');
        
    } catch (error) {
        console.error('❌ Erro ao finalizar treinamento:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro ao finalizar treinamento. Entre em contato com o suporte.',
        });
    }
}

/**
 * Processa seleção de treinamentos pendentes
 */
async function processarTreinamentosPendentes(sender, selectedId, contato, sendMessage, text = '') {
    if (selectedId === 'nao_ver_treinamentos') {
        await sendMessage(sender, 'send-message', {
            message: '🙏 Sem problemas! Quando quiser ver seus treinamentos, digite "treinamentos".',
        });
        await salvarInteracao(sender, 'conversa_finalizada', 'nao_ver_treinamentos');
        return true;
    }
    return false;
}

module.exports = {
    executarTreinamento,
    processarResposta,
    processarRespostaSSMA,
    processarTreinamentosPendentes,
    gerarCertificadoSSMA,
    iniciarModulo1,
    iniciarModulo2,
    exibirMenuOpcoes,
    detectarTreinamentoInterrompido
};

console.log('📝 treinamentoSSMA.js COMPLETO carregado');