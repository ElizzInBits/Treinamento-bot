// Script de treinamento: Treinamento de Teste
// ID do treinamento: 39
// Gerado automaticamente em: 04/08/2025, 10:35:32

const { sendMessage } = require('../conexao/wppConnectTemplate');
const Treinamento = require('../../BancoDeDados/models/treinamento');
const { Interacao } = require('../../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('../Certificados/certificados2.js');

/**
 * Executa o treinamento: Treinamento de Teste
 */
async function executarTreinamento(sender, contato) {
    const treinamento = await Treinamento.findByPk(39);
    
    if (!treinamento) {
        await sendMessage(sender, 'send-message', {
            message: '❌ Treinamento não encontrado.',
        });
        return;
    }

    await sendMessage(sender, 'send-message', {
        message: `Teste simples`,
    });

    await sendMessage(sender, 'send-file', {
        path: '../../media/foto.jpg',
        filename: 'SSMA.webp',
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
                { id: 'começar_teste', title: 'Começar agora!! 😎 🔥🔥🔥', description: '' },
                { id: 'não_começar_teste', title: 'Não, começo assim que possível 👀 😅', description: '' },
            ],
        }],
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarInteracao(sender, 'aguardando_inicio_teste', JSON.stringify(listMsg));
}

/**
 * Processa as respostas do treinamento de teste
 */
async function processarRespostaTeste(sender, text, selectedId, contato) {
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    // Início do treinamento
    if (selectedId === 'começar_teste' || selectedId === 'pronto_teste') {
        await sendMessage(sender, 'send-message', {
            message: 'Iniciando teste',
        });

        await sendMessage(sender, 'send-message', {
            message: 'Digite 1 para continuar',
        });

        await salvarInteracao(sender, 'aguardando_numero_teste', 'Digite 1 para continuar');
        return true;
    }

    // Não começar agora
    if (selectedId === 'não_começar_teste') {
        const listMsg = {
            title: '',
            description: 'Escolha uma opção:',
            buttonText: 'Estou pronto(a)',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [{ id: 'pronto_teste', title: 'Começar agora!! 😎 🔥🔥🔥', description: '' }],
            }],
        };

        await sendMessage(sender, 'send-message', {
            message: 'Ok, avise quando estiver pronto',
        });
        await sendMessage(sender, 'send-list-message', listMsg);
        await salvarInteracao(sender, 'aguardando_inicio_teste', JSON.stringify(listMsg));
        return true;
    }

    // Continuar para o quiz
    if (text === '1' && ultimaInteracao?.tipo === 'aguardando_numero_teste') {
        await sendMessage(sender, 'send-message', {
            message: 'Agora responda a pergunta:',
        });

        const quizList = {
            title: '',
            description: 'Isso é um teste?\n\nA) Não\n\nB) Sim',
            buttonText: 'Responder',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'a_teste', title: 'A', description: '' },
                    { id: 'b_teste', title: 'B', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', quizList);
        await salvarInteracao(sender, 'quiz_teste', JSON.stringify(quizList));
        return true;
    }

    // Processar respostas do quiz
    if (['a_teste', 'b_teste', 'c_teste', 'd_teste'].includes(selectedId)) {
        const respostaCorreta = 'b_teste';
        
        if (selectedId !== respostaCorreta) {
            await sendMessage(sender, 'send-message', {
                message: 'Incorreto. Resposta: B) Sim',
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: 'Correto!',
            });
        }

        await sendMessage(sender, 'send-message', {
            message: 'Teste concluído'
        });

        await sendMessage(sender, 'send-sticker-gif', {
            path: '../../media/palmas.gif',
            filename: 'palmas.gif',
            //caption: '👏 Parabéns!'
        });

        // Confirmação de dados para certificado
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
                    { id: 'dados_corretos_teste', title: 'Sim, os dados estão corretos', description: '' },
                    { id: 'dados_incorretos_teste', title: 'Não, preciso corrigir', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', confirmacaoList);
        await salvarInteracao(sender, 'confirmacao_dados_teste', JSON.stringify(confirmacaoList));
        await contato.update({ statusTreinamento: 'concluído' });
        return true;
    }

    // Confirmação de dados
    if (selectedId === 'dados_corretos_teste') {
        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados! Gerando seu certificado...',
        });
        await gerarEEnviarCertificadoTeste(contato, sender);
        return true;
    }

    return false;
}

/**
 * Gera e envia certificado do Treinamento de Teste
 */
async function gerarEEnviarCertificadoTeste(contato, sender) {
    try {
        console.log('📝 Gerando certificado para:', contato.nomeCompleto || contato.nome);
        const certificadoPath = await gerarCertificadoBanco(contato.id);
        
        console.log('📧 Enviando e-mail para:', contato.email);
        const treinamento = await Treinamento.findByPk(39);
        await enviarEmail(contato.email, certificadoPath, treinamento);

        await sendMessage(sender, 'send-message', {
            message: `🎉 Seu certificado foi gerado com sucesso! \n\n📧 Ele foi enviado para: ${contato.email}\n\n📄 Também está disponível aqui:`,
        });

        await sendMessage(sender, 'send-file', {
            path: certificadoPath,
            filename: 'Certificado_Treinamento_de_Teste.pdf',
            caption: '🎓 Seu certificado de conclusão do Treinamento de Teste'
        });

        const finalizarList = {
            title: '',
            description: 'Clique na opção abaixo para finalizar seu treinamento:',
            buttonText: 'Finalizar',
            listType: 'SINGLE_SELECT',
            sections: [{
                title: '',
                rows: [
                    { id: 'finalizar_treinamento_teste', title: '✅ Treinamento finalizado', description: '' },
                ],
            }],
        };

        await sendMessage(sender, 'send-list-message', finalizarList);
        await salvarInteracao(sender, 'finalizacao_teste', JSON.stringify(finalizarList));

    } catch (err) {
        console.error('❌ Erro ao gerar certificado:', err);
        await sendMessage(sender, 'send-message', {
            message: `❌ Ocorreu um erro ao gerar seu certificado:\n\n${err.message}\n\nPor favor, entre em contato com o suporte.`,
        });
    }
}

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

module.exports = { executarTreinamento, processarRespostaTeste };
