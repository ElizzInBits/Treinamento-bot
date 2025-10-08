const { Interacao } = require('../BancoDeDados/models/index');
const { encurtarNome } = require('./utils/formatarNome');

// ==================== SISTEMA DE IDENTIFICAÇÃO ====================

async function processarMensagemInicial(sender, text, sendMessage, buscarContato) {
    console.log(`🎯 [SistemaIdentificacao] Processando: "${text}" de ${sender}`);
    
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    // Verificar se é primeira mensagem ou conversa finalizada
    if (!ultimaInteracao || (ultimaInteracao && JSON.parse(ultimaInteracao.mensagem || '{}').etapa === 'finalizado')) {
        console.log('🆕 Primeira interação ou conversa finalizada - Enviando saudação');
        return await enviarSaudacaoInicial(sender, sendMessage);
    }
    
    // Processar baseado no estado atual
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const etapa = dados.etapa;
    
    console.log(`📍 Etapa atual: ${etapa}`);
    
    switch (etapa) {
        case 'saudacao_inicial':
            return await processarRespostaSaudacao(sender, text, sendMessage, buscarContato);
        case 'usuario_cadastrado_opcoes':
            return await processarOpcaoUsuarioCadastrado(sender, text, sendMessage, buscarContato);
        case 'aguardando_cadastro':
            return await processarAposCadastro(sender, text, sendMessage, buscarContato);
        case 'mostrar_recursos_apresentacao':
            return await processarRecursosApresentacao(sender, text, sendMessage);
        case 'mostrar_recursos':
        case 'testes_avaliacoes':
        case 'perguntar_quando_onde':
        case 'exemplos_treinamentos':
        case 'outras_aplicacoes':
        case 'confirmar_dados_certificado':
        case 'pergunta_conteudo_restante':
        case 'contato_comercial':
        case 'processando_recursos':
        case 'finalizando':
            // Todas essas etapas devem ser processadas pelo treinamentoApresentacao
            const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
            const ultimaInteracao = await obterUltimaInteracao(sender);
            const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
            
            const contatoMock = {
                id: dados.contato_id || 'mock',
                nome: dados.nome || 'Usuário',
                empresaId: dados.empresa_id || 'N/A' // Usar empresaId (não empresa_id)
            };
            
            return await treinamentoApresentacao.processarRespostaApresentacao(
                sender, 
                text, 
                null, 
                contatoMock, 
                sendMessage, 
                null
            );

        default:
            return await enviarSaudacaoInicial(sender, sendMessage);
    }
}

// ==================== SAUDAÇÃO INICIAL ====================

async function enviarSaudacaoInicial(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '👋 Olá! Seja bem-vindo(a) ao futuro dos treinamentos normativos.\nEu sou a Eliza, a sua assistente virtual \nJá imaginou fazer um curso oficial de saúde e segurança direto pelo WhatsApp? 📱\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    
    await salvarInteracao(sender, 'saudacao_inicial', JSON.stringify({ etapa: 'saudacao_inicial' }));
    return true;
}

// ==================== PROCESSAR RESPOSTA DA SAUDAÇÃO ====================

async function processarRespostaSaudacao(sender, text, sendMessage, buscarContato) {
    const opcao = text.trim();
    console.log(`🔢 Opção saudação: "${opcao}"`);
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        // Identificar o contato
        const contato = await buscarContato();
        
        if (!contato) {
            // Usuário não cadastrado
            console.log('❌ Usuário não cadastrado - Solicitando cadastro');
            await sendMessage(sender, 'send-message', {
                message: '🤔 Hum, que tal fazer o seu cadastro na nossa plataforma antes, hein?\nÉ muito simples, basta clicar no link abaixo e assim que finalizar é só voltar aqui e me envie qualquer mensagem para começarmos!\n\nhttps://abrir.link/ZEeCt\n\nATENÇÃO:\nNo Cadastro use o MESMO NÚMERO que você utilizará para conversar aqui comigo.\n\n💡 Caso tenha feito cadastro com um número diferente desse, basta acessar novamente o painel de cadastro, rolar a tela até o final e acessar os seus dados para realizar a edição do número.'
            });
            await salvarInteracao(sender, 'aguardando_cadastro', JSON.stringify({ etapa: 'aguardando_cadastro' }));
        } else {
            // Usuário cadastrado - Verificar se já teve interações anteriores
            const interacoesAnteriores = await verificarInteracoesAnteriores(sender);
            
            if (interacoesAnteriores) {
                // Já teve interações - Perguntar se quer fazer treinamento
                console.log(`🔄 Usuário ${contato.nome} já teve interações - Perguntando sobre treinamento`);
                await sendMessage(sender, 'send-message', {
                    message: `😃 Olá novamente, ${encurtarNome(contato.nome)}! \n\nVejo que você já conhece nossa plataforma. Quer fazer seu treinamento agora?\n\n1️⃣ Sim, vamos ao treinamento!\n2️⃣ Quero conhecer melhor a ferramenta primeiro`
                });
            } else {
                // Primeira interação de usuário cadastrado
                console.log(`🆕 Primeira interação de ${contato.nome} - Oferecendo opções`);
                await sendMessage(sender, 'send-message', {
                    message: `😃 Muito bem, ${encurtarNome(contato.nome)}! Vejo que você já está cadastrado em nossa plataforma.\n\nO que você gostaria de fazer?\n\n1️⃣ Ir direto para meu treinamento\n2️⃣ Conhecer como a ferramenta funciona primeiro`
                });
            }
            
            await salvarInteracao(sender, 'usuario_cadastrado_opcoes', JSON.stringify({ 
                etapa: 'usuario_cadastrado_opcoes',
                contato_id: contato.id,
                nome: encurtarNome(contato.nome),
                empresa_id: contato.empresaId || 'N/A',
                ja_teve_interacoes: interacoesAnteriores
            }));
        }
        return true;
        
    } else if (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('nao')) {
        // Insistir de forma amigável
        await sendMessage(sender, 'send-message', {
            message: '😄 Ahh Vai!!! Leva só um minutinho, prometo que vai ser legal!\n\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
        });
        
        // Enviar GIF do gatinho
        setTimeout(async () => {
            try {
                const path = require('path');
                const gifPath = path.join(__dirname, 'Treinamentos', 'Apresentacao', 'medias', 'gatinho-porfavor.gif');
                await sendMessage(sender, 'send-sticker-gif', { path: gifPath });
            } catch (error) {
                console.error('❌ Erro ao enviar GIF:', error);
                await sendMessage(sender, 'send-message', { message: '😿' });
            }
        }, 500);
        return true;
        
    } else {
        // Resposta inválida
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta. Por favor, escolha uma das opções:\n\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
        });
        return true;
    }
}

// ==================== PROCESSAR OPÇÕES USUÁRIO CADASTRADO ====================

async function processarOpcaoUsuarioCadastrado(sender, text, sendMessage, buscarContato) {
    const opcao = text.trim();
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    
    console.log(`🎯 Opção usuário cadastrado: "${opcao}"`);
    
    if (opcao === '1' || opcao.toLowerCase().includes('treinamento')) {
        // Ir para treinamento da empresa
        console.log(`🎓 Direcionando para treinamento da empresa ID: ${dados.empresa_id}`);
        
        // TODO: Aqui será implementado o roteamento para o treinamento específico da empresa
        await sendMessage(sender, 'send-message', {
            message: `🎓 Perfeito, ${dados.nome}! Vou direcionar você para seu treinamento.\n\n⚠️ [SISTEMA EM DESENVOLVIMENTO]\nEm breve você será direcionado para o treinamento específico da sua empresa (ID: ${dados.empresa_id || 'N/A'}).`
        });
        
        await salvarInteracao(sender, 'direcionando_treinamento', JSON.stringify({ 
            etapa: 'direcionando_treinamento',
            empresa_id: dados.empresa_id,
            contato_id: dados.contato_id
        }));
        
    } else if (opcao === '2' || opcao.toLowerCase().includes('ferramenta') || opcao.toLowerCase().includes('conhecer') || opcao.toLowerCase().includes('melhor')) {
        // Mostrar apresentação da ferramenta
        console.log(`📱 Iniciando apresentação da ferramenta para ${dados.nome}`);
        
        // Chamar o fluxo de apresentação do treinamentoApresentacao
        const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
        
        console.log(`📱 Iniciando apresentação para ${dados.nome}`);
        
        // Criar objeto contato mock para o treinamentoApresentacao
        const contatoMock = {
            id: dados.contato_id,
            nome: dados.nome,
            empresa_id: dados.empresa_id
        };
        
        // Chamar diretamente a função mostrarComoFunciona do treinamentoApresentacao
        // Isso evita duplicação de mensagens
        await treinamentoApresentacao.mostrarComoFunciona(sender, dados.nome, sendMessage);
        
        await salvarInteracao(sender, 'apresentacao_ferramenta', JSON.stringify({ 
            etapa: 'apresentacao_ferramenta',
            empresa_id: dados.empresa_id,
            contato_id: dados.contato_id
        }));
        
    } else {
        // Resposta inválida
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta. Por favor, escolha uma das opções:\n\n1️⃣ Ir direto para meu treinamento\n2️⃣ Conhecer como a ferramenta funciona primeiro'
        });
    }
    
    return true;
}

// ==================== PROCESSAR APÓS CADASTRO ====================

async function processarAposCadastro(sender, text, sendMessage, buscarContato) {
    // Verificar se agora está cadastrado
    const contato = await buscarContato();
    
    if (contato) {
        console.log(`🎉 Usuário ${contato.nome} retornou após cadastro`);
        await sendMessage(sender, 'send-message', {
            message: `🎉 Perfeito, ${encurtarNome(contato.nome)}! Seu cadastro foi realizado com sucesso.\n\nAgora você pode escolher:\n\n1️⃣ Ir direto para meu treinamento\n2️⃣ Conhecer como a ferramenta funciona primeiro`
        });
        
        await salvarInteracao(sender, 'usuario_cadastrado_opcoes', JSON.stringify({ 
            etapa: 'usuario_cadastrado_opcoes',
            contato_id: contato.id,
            nome: encurtarNome(contato.nome),
            empresa_id: contato.empresaId || 'N/A',
            ja_teve_interacoes: false
        }));
    } else {
        // Ainda não cadastrado
        await sendMessage(sender, 'send-message', {
            message: '🤔 Ainda não consegui localizar seu cadastro. Certifique-se de usar o mesmo número do WhatsApp no cadastro.\n\nLink para cadastro: https://abrir.link/ZEeCt\n\nApós o cadastro, envie qualquer mensagem aqui!'
        });
    }
    
    return true;
}

// ==================== FUNÇÕES AUXILIARES ====================

async function obterUltimaInteracao(sender) {
    try {
        return await Interacao.findOne({
            where: { telefone: sender },
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.error('❌ Erro ao obter última interação:', error);
        return null;
    }
}

async function salvarInteracao(sender, tipo, mensagem) {
    try {
        await Interacao.create({
            telefone: sender,
            tipo: tipo,
            mensagem: mensagem
        });
        console.log(`✅ Interação salva: ${tipo} para ${sender}`);
    } catch (error) {
        console.error('❌ Erro ao salvar interação:', error);
    }
}

async function verificarInteracoesAnteriores(sender) {
    try {
        const count = await Interacao.count({
            where: { telefone: sender }
        });
        return count > 0;
    } catch (error) {
        console.error('❌ Erro ao verificar interações anteriores:', error);
        return false;
    }
}

// ==================== PROCESSAR RECURSOS APRESENTAÇÃO ====================

async function processarRecursosApresentacao(sender, text, sendMessage) {
    const opcao = text.trim();
    console.log(`🎯 Processando recursos apresentação: "${opcao}"`);
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        // Chamar o fluxo completo de apresentação
        const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
        
        const ultimaInteracao = await obterUltimaInteracao(sender);
        const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
        
        const contatoMock = {
            id: dados.contato_id,
            nome: dados.nome,
            empresa_id: dados.empresa_id
        };
        
        // Forçar entrada no fluxo de apresentação
        await treinamentoApresentacao.processarRespostaApresentacao(
            sender, 
            'iniciar_apresentacao', 
            null, 
            contatoMock, 
            sendMessage, 
            null
        );
        
    } else if (opcao === '2' || opcao.toLowerCase().includes('pula')) {
        await sendMessage(sender, 'send-message', {
            message: '😊 Tudo bem! Quando quiser conhecer melhor nossa ferramenta, é só me mandar um "oi" que recomeçamos!'
        });
        await salvarInteracao(sender, 'finalizado', JSON.stringify({ etapa: 'finalizado' }));
    } else {
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta. Por favor, escolha uma das opções:\n\n1️⃣ Sim, mostra aí.\n2️⃣ Pula essa parte.'
        });
    }
    
    return true;
}

module.exports = {
    processarMensagemInicial,
    processarOpcaoUsuarioCadastrado
};