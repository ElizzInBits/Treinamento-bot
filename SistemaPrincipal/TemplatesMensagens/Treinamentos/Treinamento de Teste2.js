// Script de treinamento: Treinamento de Teste2
// ID do treinamento: 38
// Gerado automaticamente em: 05/08/2025, 11:40:00

const { sendMessage } = require('../conexao/wppConnectTemplate');
const { Treinamento } = require('../../BancoDeDados/models');
const { Interacao, Empresa } = require('../../BancoDeDados/models');
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
    pergunta: 'Qual é o principal objetivo da prevenção de acidentes no trabalho?',
    alternativas: {
        a: 'Reduzir custos da empresa',
        b: 'Proteger a vida e saúde dos trabalhadores',
        c: 'Cumprir apenas as leis trabalhistas',
        d: 'Evitar multas dos órgãos fiscalizadores'
    },
    respostaCorreta: 'b_teste2',
    explicacao: 'O principal objetivo é proteger a vida e saúde dos trabalhadores!'
};

/**
 * Executa o treinamento: Treinamento de Teste2
 */
async function executarTreinamento(sender, contato) {
    const treinamento = await Treinamento.findByPk(38);
    
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
        message: '🛡️ Objetivos do treinamento:\n\n• Conhecer os princípios de prevenção\n• Identificar riscos no ambiente de trabalho\n• Aplicar medidas preventivas\n• Desenvolver consciência de segurança',
    });

    await sendMessage(sender, 'send-file', {
        path: '../../media/SSMA.webp',
        filename: 'SSMA.webp',
        caption: '',
    });

    const listMsg = {
        title: '',
        description: '*Está preparado para iniciar?* \nSelecione uma opção:',
        buttonText: 'Escolher',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'começar_teste2', title: 'Vamos lá! 🚀 💪', description: '' },
                { id: 'não_começar_teste2', title: 'Preciso me preparar melhor 🤔', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarInteracao(sender, 'aguardando_inicio_teste2', JSON.stringify(listMsg));
}

/**
 * Processa as respostas do treinamento de teste2
 */
async function processarRespostaTeste(sender, text, selectedId, contato) {
    console.log(`📝 [TREINAMENTO TESTE2] Processando resposta - text: '${text}', selectedId: '${selectedId}'`);
    const ultimaInteracao = await obterUltimaInteracao(sender);
    console.log(`📝 [TREINAMENTO TESTE2] Última interação:`, ultimaInteracao?.tipo);
    
    const textLower = text.toLowerCase();
    console.log(`🔍 [DEBUG] textLower: '${textLower}'`);
    console.log(`🔍 [DEBUG] ultimaInteracao.tipo: '${ultimaInteracao?.tipo}'`);
    
    // PRIMEIRO: Confirmação de dados - por selectedId OU por texto
    if (selectedId === 'dados_corretos_teste2' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_teste2' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase()))) ||
        (contato.statusTreinamento === 'concluído' && RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        console.log(`✅ Confirmando dados para certificado`);
        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados! Gerando seu certificado...',
        });
        await gerarEEnviarCertificadoTeste2(contato, sender);
        return true;
    }
    
    // Dados incorretos
    if (selectedId === 'dados_incorretos_teste2' || 
        (ultimaInteracao?.tipo === 'confirmacao_dados_teste2' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase()))) ||
        (contato.statusTreinamento === 'concluído' && RESPOSTAS_NEGATIVAS.some(resp => textLower.includes(resp.toLowerCase())))) {
        console.log(`❌ Dados incorretos, solicitando correção`);
        await sendMessage(sender, 'send-message', {
            message: '📝 Para corrigir seus dados, por favor, entre em contato com o suporte.',
        });
        return true;
    }
    
    // SEGUNDO: Início do treinamento - detectar por selectedId OU por texto
    const contemComecaAgora = textLower.includes('vamos lá') || textLower.includes('começar');
    const contemRespositaPositiva = RESPOSTAS_POSITIVAS.some(resp => textLower.includes(resp.toLowerCase()));
    
    console.log(`🔍 [DEBUG] contemComecaAgora: ${contemComecaAgora}`);
    console.log(`🔍 [DEBUG] contemRespositaPositiva: ${contemRespositaPositiva}`);
    
    if ((selectedId === 'começar_teste2' || selectedId === 'pronto_teste2' || contemComecaAgora) ||
        (ultimaInteracao?.tipo === 'aguardando_inicio_teste2' && contemRespositaPositiva)) {
        console.log(`✅ [TREINAMENTO TESTE2] Iniciando treinamento com selectedId: '${selectedId}' ou text: '${text}'`);
        await sendMessage(sender, 'send-message', {
            message: '🎯 Excelente! Vamos iniciar o treinamento de Prevenção de Acidentes! 💪',
        });

        await sendMessage(sender, 'send-message', {
            message: `📋 Módulo 1️ - 🛡️ *Fundamentos da Prevenção* \n\n🔸 Cultura de Segurança \nDesenvolver mentalidade preventiva em todas as atividades. \n\n🔸 Identificação de Riscos \n• Reconhecer perigos no ambiente \n• Avaliar probabilidade de acidentes\n• Implementar medidas de controle`,
        });

        await sendMessage(sender, 'send-message', {
            message: '*Para prosseguir, digite o número 2️⃣*',
        });

        await salvarInteracao(sender, 'aguardando_numero_teste2', '*Para prosseguir, digite o número 2️⃣*');
        return true;
    }

    // Não começar agora - detectar por selectedId OU por texto
    if (selectedId === 'não_começar_teste2' || textLower.includes('preciso me preparar') || 
        textLower.includes('depois') || RESPOSTAS_NEGATIVAS.includes(textLower)) {
        console.log(`⏸️ Adiando treinamento com selectedId: '${selectedId}' ou text: '${text}'`);
        const listMsg = {
            title: '',
            description: 'Quando estiver pronto:',
            buttonText: 'Estou preparado',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [{ id: 'pronto_teste2', title: 'Vamos lá! 🚀 💪', description: '' }],
            }],
        };

        await sendMessage(sender, 'send-message', {
            message: '👍 Sem pressa! Quando se sentir preparado, é só me avisar. Estaremos aqui! 🤝',
        });
        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_inicio_teste2', JSON.stringify(listMsg));
        return true;
    }

    // Continuar para o quiz
    console.log(`🔍 [DEBUG] Verificando número 2 - text: '${text}', ultimaInteracao.tipo: '${ultimaInteracao?.tipo}'`);
    if (text === '2' && ultimaInteracao?.tipo === 'aguardando_numero_teste2') {
        console.log(`➡️ Continuando para o quiz`);
        await sendMessage(sender, 'send-message', {
            message: 'Perfeito!🎯🎯🎯 \n\nAgora vamos testar seus conhecimentos! 🧠 💡',
        });

        const quizList = {
            title: '',
            description: `${QUIZ_CONFIG.pergunta}\n\nA) ${QUIZ_CONFIG.alternativas.a}\n\nB) ${QUIZ_CONFIG.alternativas.b}\n\nC) ${QUIZ_CONFIG.alternativas.c}\n\nD) ${QUIZ_CONFIG.alternativas.d}`,
            buttonText: 'Responder',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_teste2', title: 'A', description: '' },
                    { id: 'b_teste2', title: 'B', description: '' },
                    { id: 'c_teste2', title: 'C', description: '' },
                    { id: 'd_teste2', title: 'D', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizList);
        await salvarInteracao(sender, 'quiz_teste2', JSON.stringify(quizList));
        return true;
    }

    // Processar respostas do quiz - por selectedId OU por texto
    if (ultimaInteracao?.tipo === 'quiz_teste2') {
        let respostaSelecionada = null;
        
        // Detectar resposta por selectedId
        if (['a_teste2', 'b_teste2', 'c_teste2', 'd_teste2'].includes(selectedId)) {
            respostaSelecionada = selectedId;
        }
        // Detectar resposta por texto
        else if (['a', 'b', 'c', 'd'].includes(textLower)) {
            respostaSelecionada = textLower + '_teste2';
        }
        
        if (respostaSelecionada) {
            console.log(`📝 Resposta do quiz: ${respostaSelecionada}`);
            
            if (respostaSelecionada === QUIZ_CONFIG.respostaCorreta) {
                await sendMessage(sender, 'send-message', {
                    message: `🎉 Parabéns! Resposta correta! \n\n${QUIZ_CONFIG.explicacao}`,
                });
                
                await sendMessage(sender, 'send-message', {
                    message: '✅ Treinamento concluído com sucesso! 🎓\n\nVamos confirmar seus dados para gerar o certificado:',
                });
                
                await confirmarDadosCertificado(sender, contato);
            } else {
                await sendMessage(sender, 'send-message', {
                    message: `❌ Resposta incorreta. A resposta correta é: ${QUIZ_CONFIG.alternativas.b}\n\n${QUIZ_CONFIG.explicacao}`,
                });
                
                await sendMessage(sender, 'send-message', {
                    message: '📚 Mas não se preocupe! O importante é aprender. Treinamento concluído! 🎓',
                });
                
                await confirmarDadosCertificado(sender, contato);
            }
            return true;
        }
    }
    
    return false;
}

/**
 * Confirma dados do contato para certificado
 */
async function confirmarDadosCertificado(sender, contato) {
    const empresa = await Empresa.findByPk(contato.empresaId);
    const nomeEmpresa = empresa ? empresa.razao_social : 'Empresa não encontrada';
    
    const confirmacaoMsg = {
        title: '',
        description: `📋 *Confirme seus dados:*\n\n👤 Nome: ${contato.nome}\n🏢 Empresa: ${nomeEmpresa}\n\nOs dados estão corretos?`,
        buttonText: 'Confirmar',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'dados_corretos_teste2', title: '✅ Sim, estão corretos', description: '' },
                { id: 'dados_incorretos_teste2', title: '❌ Não, preciso corrigir', description: '' },
            ],
        }],
    };
    
    await sendMessage(sender, 'send-list-message', confirmacaoMsg);
    await salvarInteracao(sender, 'confirmacao_dados_teste2', JSON.stringify(confirmacaoMsg));
}

/**
 * Gera e envia certificado para o teste2
 */
async function gerarEEnviarCertificadoTeste2(contato, sender) {
    try {
        const treinamento = await Treinamento.findByPk(38);
        const empresa = await Empresa.findByPk(contato.empresaId);
        
        if (!treinamento || !empresa) {
            await sendMessage(sender, 'send-message', {
                message: '❌ Erro ao gerar certificado. Dados não encontrados.',
            });
            return;
        }
        
        const certificadoPath = await gerarCertificadoBanco({
            nome: contato.nome,
            treinamento: treinamento.nome,
            empresa: empresa.razao_social,
            cargaHoraria: treinamento.cargaHoraria || '20',
            instrutor: treinamento.instrutor || 'Instrutor Certificado',
            registroInstrutor: treinamento.registroInstrutor || 'REG-001'
        });
        
        if (certificadoPath) {
            await sendMessage(sender, 'send-file', {
                path: certificadoPath,
                filename: `Certificado_${contato.nome.replace(/\s+/g, '_')}.pdf`,
                caption: '🎓 Seu certificado foi gerado com sucesso!',
            });
            
            // Enviar por email se disponível
            if (contato.email) {
                await enviarEmail(contato.email, certificadoPath, {
                    nome: contato.nome,
                    treinamento: treinamento.nome
                });
            }
            
            await sendMessage(sender, 'send-message', {
                message: '🎉 Parabéns por concluir o treinamento! Seu certificado foi enviado. 🏆',
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: '❌ Erro ao gerar certificado. Tente novamente mais tarde.',
            });
        }
    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro interno ao gerar certificado.',
        });
    }
}

/**
 * Salva interação no banco
 */
async function salvarInteracao(sender, tipo, conteudo) {
    try {
        await Interacao.create({
            telefone: sender,
            tipo: tipo,
            conteudo: conteudo,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Erro ao salvar interação:', error);
    }
}

/**
 * Obtém última interação do usuário
 */
async function obterUltimaInteracao(sender) {
    try {
        return await Interacao.findOne({
            where: { telefone: sender },
            order: [['timestamp', 'DESC']]
        });
    } catch (error) {
        console.error('Erro ao obter interação:', error);
        return null;
    }
}

module.exports = {
    executarTreinamento,
    processarRespostaTeste
};