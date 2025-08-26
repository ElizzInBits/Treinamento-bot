// treinamentoSSMA.js RESUMIDO (2 módulos, 4 perguntas cada)
// ----------------------------

// Imports
const { Interacao } = require('../../../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('../../Certificados/certificados2.js');
const { Op } = require('sequelize');

// Respostas aceitas
const RESPOSTAS_POSITIVAS = ['sim', 'vamos', 'pode mandar', 'começar', 'iniciar', 'pronto', 'ok', 'bora', 'beleza', 'certo', 'perfeito'];
const RESPOSTAS_NEGATIVAS = ['não', 'nao', 'ainda não', 'ainda nao', 'depois', 'mais tarde', 'preciso me preparar', 'cancelar', 'parar', 'sair'];

function verificarRespostaSSMA(texto, tipo = 'positiva') {
    const textoLimpo = texto.toLowerCase().trim();
    const respostas = tipo === 'positiva' ? RESPOSTAS_POSITIVAS : RESPOSTAS_NEGATIVAS;
    return respostas.some(r => textoLimpo.includes(r));
}

// QUIZ CONFIG - módulo 1
const QUIZ_MODULO1 = {
    perguntas: [
        {
            pergunta: "1. O que significa SSMA?",
            alternativas: {
                a: "Sistema de Segurança e Meio Ambiente",
                b: "Saúde, Segurança e Meio Ambiente",
                c: "Serviço de Segurança e Medicina Ambiental",
                d: "Setor de Segurança"
            },
            respostaCorreta: "b",
            explicacao: "SSMA significa Saúde, Segurança e Meio Ambiente."
        },
        {
            pergunta: "2. Uma ferramenta caiu perto de um trabalhador, sem atingi-lo. Isso é:",
            alternativas: {
                a: "Acidente pessoal",
                b: "Acidente ambiental",
                c: "Quase acidente",
                d: "Acidente material"
            },
            respostaCorreta: "c",
            explicacao: "É considerado um quase acidente."
        },
        {
            pergunta: "3. Verdadeiro ou Falso: A responsabilidade pela segurança pode ser transferida.",
            alternativas: {
                a: "Verdadeiro",
                b: "Falso",
                c: "Depende",
                d: "Só com autorização"
            },
            respostaCorreta: "b",
            explicacao: "Falso. A responsabilidade pela segurança é intransferível."
        },
        {
            pergunta: "4. Qual é a meta da empresa em segurança?",
            alternativas: {
                a: "Reduzir custos",
                b: "Evitar multas",
                c: "Agradar fiscais",
                d: "Zero Acidentes"
            },
            respostaCorreta: "d",
            explicacao: "A meta principal da empresa em segurança é Zero Acidentes."
        }
    ]
};

// QUIZ CONFIG - módulo 2
const QUIZ_MODULO2 = {
    perguntas: [
        {
            pergunta: "1. Exames médicos periódicos devem ser feitos a cada:",
            alternativas: {
                a: "6 meses",
                b: "12 meses",
                c: "18 meses",
                d: "24 meses"
            },
            respostaCorreta: "b",
            explicacao: "O exame periódico deve ser feito a cada 12 meses."
        },
        {
            pergunta: "2. Na hierarquia de controles, a primeira medida é:",
            alternativas: {
                a: "Administração",
                b: "EPI",
                c: "Eliminação",
                d: "Substituição"
            },
            respostaCorreta: "c",
            explicacao: "A primeira medida é tentar eliminar o perigo."
        },
        {
            pergunta: "3. Verdadeiro ou Falso: EPI deve ser a primeira opção de proteção.",
            alternativas: {
                a: "Verdadeiro",
                b: "Falso",
                c: "Depende",
                d: "Somente em emergências"
            },
            respostaCorreta: "b",
            explicacao: "Falso. O EPI é sempre a última opção na hierarquia de controles."
        },
        {
            pergunta: "4. O que tem prioridade?",
            alternativas: {
                a: "EPI",
                b: "EPC",
                c: "Depende da função",
                d: "Tanto faz"
            },
            respostaCorreta: "b",
            explicacao: "EPC (Equipamento de Proteção Coletiva) sempre tem prioridade sobre EPI."
        }
    ]
};

// -------------------------------------------
// Funções de suporte
async function salvarInteracao(sender, tipo, dados = "") {
    try {
        await Interacao.create({
            telefone: sender, tipo, mensagem: dados, timestamp: new Date()
        });
    } catch (e) { console.error("Erro salvarInteracao", e); }
}
async function obterUltimaInteracao(sender) {
    try {
        return await Interacao.findOne({ where: { telefone: sender }, order: [['createdAt', 'DESC']] });
    } catch (e) { 
        console.error("Erro obterUltimaInteracao", e); 
        return null; 
    }
}

// -------------------------------------------
// Fluxo principal
async function executarTreinamento(sender, contato, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: `📘 Bem-vindo ao Treinamento Básico de SSMA – Saúde, Segurança e Meio Ambiente!`
    });

    await sendMessage(sender, 'send-message', {
        message: `🎯 OBJETIVOS:
- Conscientizar sobre a importância da segurança
- Ensinar prevenção de acidentes
- Utilizar EPIs corretamente
- Desenvolver atitudes seguras`
    });

    await sendMessage(sender, 'send-message', { message: "👉 Você está pronto para começar o Módulo 1?" });
    await salvarInteracao(sender, "aguardando_inicio", "");
}

// -------------------------------------------
// Enviar perguntas simplificado
async function enviarPergunta(sender, index, config, tipoQuiz, sendMessage, acertos = 0) {
    const pergunta = config.perguntas[index];
    const msg = `${pergunta.pergunta}\n\na) ${pergunta.alternativas.a}\nb) ${pergunta.alternativas.b}\nc) ${pergunta.alternativas.c}\nd) ${pergunta.alternativas.d}\n\nResponda com a letra da alternativa.`;
    await sendMessage(sender, 'send-message', { message: msg });
    await salvarInteracao(sender, `${tipoQuiz}_${index}`, JSON.stringify({ perguntaAtual: index, acertos }));
}

// -------------------------------------------
// Quiz módulo 1
async function processarQuizModulo(sender, resposta, ultimaInteracao, sendMessage, config, tipoQuiz, proxModuloCallback) {
    let dados = {};
    try {
        dados = JSON.parse(ultimaInteracao.mensagem || "{}");
    } catch (e) {
        console.error("Erro ao parsear dados da interação:", e);
        dados = { perguntaAtual: 0, acertos: 0 };
    }
    const perguntaAtual = dados.perguntaAtual;
    const acertos = dados.acertos || 0;

    const perg = config.perguntas[perguntaAtual];
    const correta = resposta.trim().toLowerCase() === perg.respostaCorreta;

    await sendMessage(sender, 'send-message', { message: correta ? `✅ Correto! ${perg.explicacao}` : `❌ Incorreto. ${perg.explicacao}` });

    const novoAcertos = acertos + (correta ? 1 : 0);
    const proxima = perguntaAtual + 1;

    if (proxima >= config.perguntas.length) {
        const total = config.perguntas.length;
        const perc = Math.round((novoAcertos / total) * 100);
        await sendMessage(sender, 'send-message', {
            message: `📊 Resultado do módulo: ${novoAcertos}/${total} (${perc}%)`
        });
        await proxModuloCallback(sender, sendMessage);
        return true;
    } else {
        await enviarPergunta(sender, proxima, config, tipoQuiz, sendMessage, novoAcertos);
        return true;
    }
}

// -------------------------------------------
// Início módulos
async function iniciarModulo1(sender, sendMessage) {
    await sendMessage(sender, 'send-message', { message: "📖 MÓDULO 1 – Fundamentos de SSMA e Acidentes" });
    await enviarPergunta(sender, 0, QUIZ_MODULO1, "quiz1", sendMessage);
}
async function iniciarModulo2(sender, sendMessage) {
    await sendMessage(sender, 'send-message', { message: "📖 MÓDULO 2 – Saúde, Riscos e Proteção" });
    await enviarPergunta(sender, 0, QUIZ_MODULO2, "quiz2", sendMessage);
}
async function finalizarTreinamento(sender, sendMessage) {
    await sendMessage(sender, 'send-message', { message: "🎉 Treinamento concluído com sucesso! Parabéns pelo aprendizado em SSMA." });
}

// -------------------------------------------
// Processamento principal
async function processarResposta(sender, message, sendMessage) {
    const ultima = await obterUltimaInteracao(sender);
    if (!ultima) return false;

    const resp = message.toLowerCase().trim();

    if (ultima.tipo === "aguardando_inicio" && verificarRespostaSSMA(resp, 'positiva')) {
        await iniciarModulo1(sender, sendMessage);
        return true;
    }

    if (ultima.tipo.startsWith("quiz1_")) {
        return await processarQuizModulo(sender, resp, ultima, sendMessage, QUIZ_MODULO1, "quiz1", iniciarModulo2);
    }

    if (ultima.tipo.startsWith("quiz2_")) {
        return await processarQuizModulo(sender, resp, ultima, sendMessage, QUIZ_MODULO2, "quiz2", finalizarTreinamento);
    }

    return false;
}

// -------------------------------------------
// Função compatível com Template2.js
async function processarRespostaSSMA(sender, text, selectedId, contato, sendMessage) {
    console.log(`🔍 SSMA processarRespostaSSMA chamada: sender=${sender}, text="${text}", selectedId="${selectedId}"`);
    const resultado = await processarResposta(sender, text, sendMessage);
    console.log(`🔍 SSMA resultado: ${resultado}`);
    return resultado;
}

// Função para treinamentos pendentes (compatibilidade)
async function processarTreinamentosPendentes(sender, selectedId, contato, sendMessage, text = '') {
    // Implementação básica - pode ser expandida depois
    if (selectedId === 'nao_ver_treinamentos') {
        await sendMessage(sender, 'send-message', {
            message: '🙏 Sem problemas! Quando quiser ver seus treinamentos, digite "treinamentos".',
        });
        return true;
    }
    return false;
}

// -------------------------------------------
module.exports = { 
    executarTreinamento, 
    processarResposta, 
    processarRespostaSSMA,
    processarTreinamentosPendentes 
};
console.log("📝 treinamentoSSMA.js RESUMIDO carregado");