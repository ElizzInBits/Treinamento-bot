// Script de treinamento: nr10 Curso Basico Atualizacao
// Gerado automaticamente

const { sendMessage } = require('../conexao/wppConnectTemplate');
const { Treinamento, Interacao, Empresa } = require('../../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('../Certificados/certificados2.js');

// ========================================
// CONFIGURAÇÕES ESPECÍFICAS DO TREINAMENTO
// ========================================
const TEMPO_LEMBRETE = 0.3 * 60 * 1000; // 18 segundos

// Respostas válidas para este treinamento
const RESPOSTAS_POSITIVAS = [
    'sim',
    'sim, os dados estão corretos',
    'os dados estão corretos',
    'dados corretos',
    'confirmar',
    'sim estão corretos',
    'começar agora',
    'pronto',
    'vamos lá'
];

const RESPOSTAS_NEGATIVAS = [
    'não',
    'não, preciso corrigir',
    'não, os dados não são corretos',
    'os dados não são corretos',
    'dados incorretos',
    'não estão corretos',
    'não começar',
    'depois',
    'mais tarde'
];

// Configurações do quiz
const QUIZ_CONFIG = {
    pergunta: 'Qual é a principal finalidade da NR-10?',
    alternativas: {
        a: 'Reduzir custos de energia elétrica',
        b: 'Garantir a segurança em instalações e serviços em eletricidade',
        c: 'Aumentar a produtividade dos eletricistas',
        d: 'Padronizar equipamentos elétricos'
    },
    respostaCorreta: 'b_nr10',
    explicacao: 'A NR-10 tem como principal finalidade garantir a segurança e a saúde dos trabalhadores que interagem com instalações e serviços em eletricidade!'
};

/**
 * Salva interação no banco
 */
async function salvarInteracao(sender, tipo, mensagem) {
    await Interacao.upsert({ telefone: sender, tipo, mensagem });
}

/**
 * Obtém última interação
 */
async function obterUltimaInteracao(sender) {
    return await Interacao.findOne({
        where: { telefone: sender },
        order: [['updatedAt', 'DESC']],
    });
}

/**
 * Executa o treinamento: nr10 Curso Basico Atualizacao
 */
async function executarTreinamento(sender, contato) {
    const treinamento = await Treinamento.findOne({
        where: { nome: { [require('sequelize').Op.like]: '%NR10%BASICO%ATUALIZACAO%' } }
    }) || await Treinamento.findOne({
        where: { nome: 'NR10 CURSO BASICO ATUALIZACAO' }
    });
    
    if (!treinamento) {
        await sendMessage(sender, 'send-message', {
            message: '❌ Treinamento não encontrado.',
        });
        return;
    }

    await sendMessage(sender, 'send-message', {
        message: `👋 Olá, ${contato.nome}! Seja bem-vindo(a) ao treinamento: ${treinamento.nome}! 💼`,
    });

    await sendMessage(sender, 'send-message', {
        message: '⚡ Objetivos do treinamento:\n\n• Conhecer os riscos elétricos\n• Aplicar medidas de controle\n• Utilizar EPIs adequados\n• Procedimentos de segurança',
    });

    const listMsg = {
        title: '',
        description: '*Está preparado para iniciar?* \nSelecione uma opção:',
        buttonText: 'Escolher',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'começar_nr10', title: 'Vamos lá! 🚀 💪', description: '' },
                { id: 'não_começar_nr10', title: 'Preciso me preparar melhor 🤔', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarInteracao(sender, 'aguardando_inicio_nr10', JSON.stringify(listMsg));
}

/**
 * Processa as respostas do treinamento NR-10
 */
async function processarRespostaTeste(sender, text, selectedId, contato) {
    console.log(`📝 [TREINAMENTO NR-10] Processando resposta - text: '${text}', selectedId: '${selectedId}'`);
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    const textLower = text.toLowerCase();
    
    // Confirmação de dados
    if (selectedId === 'dados_corretos_nr10' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_nr10' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados! Gerando seu certificado...',
        });
        await gerarEEnviarCertificadoNR10(contato, sender);
        return true;
    }

    if (selectedId === 'dados_incorretos_nr10' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_nr10' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        await sendMessage(sender, 'send-message', {
            message: '📝 Para corrigir seus dados, me envie seu nome completo correto:',
        });
        await salvarInteracao(sender, 'corrigir_nome_nr10', 'Por favor, me envie seu nome completo correto.');
        return true;
    }

    // Correção de nome
    if (ultimaInteracao?.tipo === 'corrigir_nome_nr10') {
        contato.nomeCompleto = text.trim();
        await contato.save();

        await sendMessage(sender, 'send-message', {
            message: '👍 Nome atualizado! Agora, me envie seu e-mail correto:',
        });
        await salvarInteracao(sender, 'corrigir_email_nr10', 'Por favor, me envie seu e-mail correto.');
        return true;
    }

    // Correção de email
    if (ultimaInteracao?.tipo === 'corrigir_email_nr10') {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(text.trim())) {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ E-mail inválido! Por favor, insira um e-mail válido:',
            });
            await salvarInteracao(sender, 'corrigir_email_nr10', 'Por favor, me envie seu e-mail correto.');
            return true;
        }

        contato.email = text.trim();
        await contato.save();

        await sendMessage(sender, 'send-message', {
            message: '✅ E-mail atualizado! Gerando seu certificado...',
        });
        await gerarEEnviarCertificadoNR10(contato, sender);
        return true;
    }
    
    // Início do treinamento
    if (selectedId === 'começar_nr10' || textLower.includes('vamos lá')) {
        await sendMessage(sender, 'send-message', {
            message: '🎯 Excelente! Vamos iniciar o treinamento de NR-10! ⚡',
        });

        await sendMessage(sender, 'send-message', {
            message: '📋 *MÓDULO 1 - INTRODUÇÃO À NR-10*\n\n⚡ A Norma Regulamentadora NR-10 estabelece os requisitos e condições mínimas para garantir a segurança dos trabalhadores que interagem com instalações e serviços em eletricidade.',
        });

        await sendMessage(sender, 'send-message', {
            message: '🎯 *OBJETIVOS DO TREINAMENTO:*\n\n• Prevenir acidentes com eletricidade\n• Conhecer os riscos elétricos\n• Aplicar medidas de segurança\n• Utilizar EPIs adequados\n• Procedimentos de emergência',
        });

        await sendMessage(sender, 'send-message', {
            message: '*Para continuar, digite o número 1️⃣*',
        });

        await salvarInteracao(sender, 'aguardando_numero_nr10', '*Para continuar, digite o número 1️⃣*');
        return true;
    }

    // Não começar agora
    if (selectedId === 'não_começar_nr10' || textLower.includes('preciso me preparar')) {
        const listMsg = {
            title: '',
            description: 'Quando estiver pronto:',
            buttonText: 'Estou preparado',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [{ id: 'pronto_nr10', title: 'Vamos lá! 🚀 💪', description: '' }],
            }],
        };

        await sendMessage(sender, 'send-message', {
            message: '👍 Sem pressa! Quando se sentir preparado, é só me avisar. Estaremos aqui! 🤝',
        });
        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_inicio_nr10', JSON.stringify(listMsg));
        return true;
    }

    // Continuar com módulo 2
    if ((text === '1' || textLower === '1') && ultimaInteracao?.tipo === 'aguardando_numero_nr10') {
        await sendMessage(sender, 'send-message', {
            message: '📋 *MÓDULO 2 - RISCOS ELÉTRICOS*\n\n⚡ *CHOQUE ELÉTRICO:*\n• Passagem de corrente pelo corpo\n• Pode causar parada cardíaca\n• Queimaduras internas e externas',
        });

        await sendMessage(sender, 'send-message', {
            message: '🔥 *ARCO ELÉTRICO:*\n• Descarga elétrica no ar\n• Temperatura até 20.000°C\n• Queimaduras graves\n• Explosão de equipamentos',
        });

        await sendMessage(sender, 'send-message', {
            message: '💥 *EXPLOSÃO E INCÊNDIO:*\n• Gases inflamáveis + faísca\n• Sobrecarga de equipamentos\n• Curto-circuito\n• Instalações inadequadas',
        });

        await sendMessage(sender, 'send-message', {
            message: '*Para continuar, digite o número 2️⃣*',
        });

        await salvarInteracao(sender, 'aguardando_numero2_nr10', '*Para continuar, digite o número 2️⃣*');
        return true;
    }

    // Continuar com módulo 3
    if ((text === '2' || textLower === '2') && ultimaInteracao?.tipo === 'aguardando_numero2_nr10') {
        await sendMessage(sender, 'send-message', {
            message: '📋 *MÓDULO 3 - MEDIDAS DE CONTROLE*\n\n🔌 *DESENERGIZAÇÃO:*\n• Desligar a fonte de energia\n• Constatação da ausência de tensão\n• Instalação de aterramento temporário\n• Proteção dos elementos energizados',
        });

        await sendMessage(sender, 'send-message', {
            message: '🌍 *ATERRAMENTO:*\n• Ligação à terra\n• Proteção contra choques\n• Escoamento de correntes de falta\n• Estabilização do potencial',
        });

        await sendMessage(sender, 'send-message', {
            message: '🛡️ *EQUIPAMENTOS DE PROTEÇÃO:*\n\n*EPIs Obrigatórios:*\n• Capacete com jugular\n• Óculos de segurança\n• Luvas isolantes\n• Calçado de segurança\n• Vestimenta adequada',
        });

        await sendMessage(sender, 'send-message', {
            message: '*Para continuar, digite o número 3️⃣*',
        });

        await salvarInteracao(sender, 'aguardando_numero3_nr10', '*Para continuar, digite o número 3️⃣*');
        return true;
    }

    // Continuar para procedimentos
    if ((text === '3' || textLower === '3') && ultimaInteracao?.tipo === 'aguardando_numero3_nr10') {
        await sendMessage(sender, 'send-message', {
            message: '📋 *MÓDULO 4 - PROCEDIMENTOS DE SEGURANÇA*\n\n📝 *ANTES DO TRABALHO:*\n• Análise de risco\n• Planejamento da atividade\n• Verificação de EPIs\n• Comunicação da equipe',
        });

        await sendMessage(sender, 'send-message', {
            message: '⚠️ *DURANTE O TRABALHO:*\n• Manter atenção constante\n• Usar EPIs adequados\n• Seguir procedimentos\n• Comunicar anomalias\n• Trabalhar em equipe',
        });

        await sendMessage(sender, 'send-message', {
            message: '🚨 *PRIMEIROS SOCORROS:*\n\n*Em caso de choque:*\n• NÃO toque na vítima\n• Desligue a energia\n• Chame o resgate (192)\n• Inicie RCP se necessário\n• Mantenha a vítima aquecida',
        });

        await sendMessage(sender, 'send-message', {
            message: 'Perfeito! 🎯\n\nAgora vamos testar seus conhecimentos! 🧠 💡',
        });

        const quizList = {
            title: '',
            description: `${QUIZ_CONFIG.pergunta}\n\nA) ${QUIZ_CONFIG.alternativas.a}\n\nB) ${QUIZ_CONFIG.alternativas.b}\n\nC) ${QUIZ_CONFIG.alternativas.c}\n\nD) ${QUIZ_CONFIG.alternativas.d}`,
            buttonText: 'Responder',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_nr10', title: 'A', description: '' },
                    { id: 'b_nr10', title: 'B', description: '' },
                    { id: 'c_nr10', title: 'C', description: '' },
                    { id: 'd_nr10', title: 'D', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizList);
        await salvarInteracao(sender, 'quiz_nr10', JSON.stringify(quizList));
        return true;
    }

    // Processar respostas do quiz
    if (ultimaInteracao?.tipo === 'quiz_nr10' && (selectedId.includes('_nr10') || ['a', 'b', 'c', 'd'].includes(textLower))) {
        const respostaCorreta = selectedId === QUIZ_CONFIG.respostaCorreta || textLower === 'b';
        
        if (respostaCorreta) {
            await sendMessage(sender, 'send-message', {
                message: `🎉 Parabéns! Resposta correta!\n\n${QUIZ_CONFIG.explicacao}`,
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: `❌ Resposta incorreta.\n\n${QUIZ_CONFIG.explicacao}`,
            });
        }

        await sendMessage(sender, 'send-message', {
            message: '🎓 Treinamento concluído com sucesso!\n\nVamos gerar seu certificado...',
        });

        await contato.update({ statusTreinamento: 'concluído' });

        const nomeCompleto = contato.nomeCompleto || contato.nome;
        const emailCadastrado = contato.email;

        if (!nomeCompleto || !emailCadastrado) {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ Para gerar o certificado, preciso confirmar seus dados.',
            });
            return true;
        }

        const confirmacaoMsg = {
            title: '',
            description: `🎓 *Confirmação dos dados para o certificado:*\n\n👤 *Nome:* ${nomeCompleto}\n📧 *E-mail:* ${emailCadastrado}\n\nOs dados estão corretos?`,
            buttonText: 'Confirmar',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'dados_corretos_nr10', title: 'Sim, os dados estão corretos', description: '' },
                    { id: 'dados_incorretos_nr10', title: 'Não, preciso corrigir', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', confirmacaoMsg);
        await salvarInteracao(sender, 'confirmacao_dados_nr10', JSON.stringify(confirmacaoMsg));
        return true;
    }

    return false;
}

/**
 * Gera e envia certificado NR-10
 */
async function gerarEEnviarCertificadoNR10(contato, sender) {
    try {
        await sendMessage(sender, 'send-message', {
            message: '📧 Gerando seu certificado...',
        });

        const certificadoPath = await gerarCertificadoBanco(contato.id);
        const treinamento = await Treinamento.findOne({
            where: { nome: { [require('sequelize').Op.like]: '%NR10%BASICO%ATUALIZACAO%' } }
        }) || await Treinamento.findOne({
            where: { nome: 'NR10 CURSO BASICO ATUALIZACAO' }
        });
        
        await enviarEmail(contato.email, certificadoPath, treinamento);

        await sendMessage(sender, 'send-message', {
            message: `🎉 Certificado gerado com sucesso!\n\n📧 Enviado para: ${contato.email}`,
        });

        await sendMessage(sender, 'send-file', {
            path: certificadoPath,
            filename: 'Certificado_NR10.pdf',
            caption: '🎓 Seu certificado de conclusão do NR-10 Curso Básico Atualização'
        });

    } catch (error) {
        console.error('Erro ao gerar certificado NR-10:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro ao gerar certificado. Entre em contato com o suporte.',
        });
    }
}

module.exports = {
    executarTreinamento,
    processarRespostaTeste
};