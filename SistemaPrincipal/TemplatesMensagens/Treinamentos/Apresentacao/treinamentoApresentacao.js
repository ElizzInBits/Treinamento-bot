const { Contato, Interacao } = require('../../../BancoDeDados/models');
const { Op } = require('sequelize');

/**
 * Função principal para processar respostas do treinamento de apresentação
 */
async function processarRespostaApresentacao(sender, text, selectedId, contato, sendMessage) {
    console.log(`🎯 Processando resposta: "${text}" de ${sender}`);
    
    // Verificar se já existe interação anterior
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    if (ultimaInteracao) {
        // Já tem interação - processar baseado no estado
        return await processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage);
    }
    
    // Primeira interação - enviar mensagem inicial
    return await iniciarFluxoBoasVindas(sender, sendMessage);
}

/**
 * Inicia o fluxo de boas-vindas para TODOS os contatos
 */
async function iniciarFluxoBoasVindas(sender, sendMessage) {
    console.log('👋 Iniciando fluxo de boas-vindas');
    
    // Mensagem inicial da Eliza para TODOS
    await sendMessage(sender, 'send-message', {
        message: '👋 Olá! Seja bem-vindo(a) ao futuro dos treinamentos normativos.\nEu sou a Eliza, a sua assistente virtual 🤖\nJá imaginou fazer um curso oficial de saúde e segurança direto pelo WhatsApp? 📱\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    
    // Salvar estado
    await salvarInteracao(sender, 'aguardando_opcao_inicial', JSON.stringify({ etapa: 'opcao_inicial' }));
    return true;
}

/**
 * Processa o estado atual baseado na última interação
 */
async function processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage) {
    console.log(`🔍 Última interação: ${ultimaInteracao.tipo}`);
    console.log(`📝 Mensagem da interação: ${ultimaInteracao.mensagem}`);
    
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const etapa = dados.etapa;
    
    console.log(`🎯 Etapa atual: ${etapa}`);
    
    switch (etapa) {
        case 'opcao_inicial':
            return await processarOpcaoInicial(sender, text, contato, sendMessage);
        case 'aguardando_cadastro':
            return await processarAposCadastro(sender, text, contato, sendMessage);
        case 'mostrar_recursos':
            return await processarMostrarRecursos(sender, text, sendMessage);
        default:
            console.log(`⚠️ Etapa não reconhecida: ${etapa}, reiniciando fluxo`);
            return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
}

/**
 * Processa a opção inicial (1 ou 2)
 */
async function processarOpcaoInicial(sender, text, contato, sendMessage) {
    const opcao = text.trim();
    console.log(`🔢 Opção recebida: "${opcao}", Contato: ${contato ? contato.nome : 'NÃO CADASTRADO'}`);
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        console.log('✅ Usuário escolheu opção 1 (SIM)');
        if (!contato) {
            console.log('📝 Enviando link de cadastro para usuário não cadastrado');
            // Não cadastrado - enviar link de cadastro
            await sendMessage(sender, 'send-message', {
                message: '🤔 Hum, que tal fazer o seu cadastro na nossa plataforma antes, hein?\nÉ muito simples, basta clicar no link abaixo e assim que finalizar é só voltar aqui e me envie qualquer mensagem para começarmos!\n\nhttps://abrir.link/kAgON\n\nATENÇÃO:\nNo Cadastro use o MESMO NÚMERO que você utilizará para conversar aqui comigo.\n\n💡 Caso tenha feito cadastro com um número diferente desse, basta acessar novamente o painel de cadastro, rolar a tela até o final e acessar os seus dados para realizar a edição do número.'
            });
            
            await salvarInteracao(sender, 'aguardando_cadastro', JSON.stringify({ etapa: 'aguardando_cadastro' }));
        } else {
            console.log('🎉 Usuário cadastrado, mostrando como funciona');
            // Cadastrado - mostrar como funciona
            await mostrarComoFunciona(sender, contato.nome, sendMessage);
        }
        return true;
    } else if (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('nao')) {
        console.log('❌ Usuário escolheu opção 2 (NÃO), insistindo');
        // Insistir de forma amigável
        await sendMessage(sender, 'send-message', {
            message: '😄 Ahh Vai!!! Leva só um minutinho, prometo que vai ser legal!\n\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
        });
        // Manter o mesmo estado para aguardar nova resposta
        return true;
    }
    
    console.log('⚠️ Resposta não reconhecida, pedindo para escolher novamente');
    // Resposta não reconhecida
    await sendMessage(sender, 'send-message', {
        message: 'Por favor, escolha uma das opções:\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    return true;
}

/**
 * Processa mensagens após cadastro
 */
async function processarAposCadastro(sender, text, contato, sendMessage) {
    if (contato) {
        // Agora está cadastrado - continuar com o material
        await mostrarComoFunciona(sender, contato.nome, sendMessage);
    } else {
        // Ainda não cadastrado - só lembrar do cadastro
        await sendMessage(sender, 'send-message', {
            message: '🤔 Parece que você ainda não finalizou o cadastro. Após se cadastrar, volte aqui e me envie qualquer mensagem!\n\nhttps://abrir.link/kAgON'
        });
        // NÃO continua com mais nada - para por aqui
    }
    return true;
}

/**
 * Mostra como o treinamento funciona
 */
async function mostrarComoFunciona(sender, nome, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: `😃 Muito bem ${nome}! Aqui o treinamento acontece como uma conversa rápida:\n• Mensagens curtas 💬\n• Linguagem simples ✅\n• Interatividade o tempo todo ⚡\n👉 E tudo com validade legal 📜`
    });
    
    setTimeout(async () => {
        // Enviar sticker/gif aqui se disponível
        await sendMessage(sender, 'send-message', {
            message: '🎉 [Aqui seria enviado um sticker/gif animado]'
        });
        
        setTimeout(async () => {
            await sendMessage(sender, 'send-message', {
                message: 'Quer ver os recursos que posso usar?\n1️⃣ Sim, mostra aí.\n2️⃣ Pula essa parte.'
            });
            
            await salvarInteracao(sender, 'mostrar_recursos', JSON.stringify({ etapa: 'mostrar_recursos' }));
        }, 1000);
    }, 2000);
}

/**
 * Processa opção de mostrar recursos
 */
async function processarMostrarRecursos(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        await sendMessage(sender, 'send-message', {
            message: '🚀 Recursos disponíveis:\n\n📱 Mensagens interativas\n🖼️ Imagens e vídeos\n📊 Quizzes dinâmicos\n📋 Certificados digitais\n⚡ Respostas instantâneas\n\n✨ Tudo isso para tornar seu aprendizado mais eficaz!'
        });
    } else {
        await sendMessage(sender, 'send-message', {
            message: '👍 Perfeito! Vamos direto ao que interessa então!'
        });
    }
    
    setTimeout(async () => {
        await iniciarTreinamentoReal(sender, sendMessage);
    }, 2000);
    
    return true;
}

/**
 * Inicia o treinamento real
 */
async function iniciarTreinamentoReal(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🎯 Agora vamos começar seu treinamento!\n\nEste é um curso completo sobre técnicas de apresentação eficaz.\n\n📚 Você está pronto para começar?'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '🎉 Parabéns! Você concluiu a demonstração do sistema de treinamentos!\n\n✨ Em breve teremos mais conteúdos disponíveis.\n\n📞 Entre em contato conosco para mais informações!'
        });
    }, 3000);
}

/**
 * Salva interação no banco
 */
async function salvarInteracao(telefone, tipo, mensagem) {
    try {
        await Interacao.create({
            telefone: telefone,
            tipo: tipo,
            mensagem: mensagem
        });
        console.log(`✅ Interação salva: ${tipo} para ${telefone}`);
    } catch (error) {
        console.error('❌ Erro ao salvar interação:', error);
    }
}

/**
 * Obtém última interação
 */
async function obterUltimaInteracao(telefone) {
    try {
        return await Interacao.findOne({
            where: { telefone: telefone },
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.error('❌ Erro ao obter interação:', error);
        return null;
    }
}

/**
 * Função de compatibilidade - mantida para não quebrar outras chamadas
 */
async function iniciarTreinamentoApresentacao(sender, sendMessage) {
    return await processarRespostaApresentacao(sender, '', null, null, sendMessage);
}

module.exports = {
    processarRespostaApresentacao,
    iniciarTreinamentoApresentacao
};