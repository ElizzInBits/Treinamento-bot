const { Contato, Interacao } = require('../../../BancoDeDados/models');

async function processarRespostaApresentacao(sender, text, selectedId, contato, sendMessage) {
    console.log(`🎯 Processando resposta: "${text}" de ${sender}`);
    
    // Verificar se é uma saudação genérica
    const saudacoes = ['olá', 'oi', 'ola', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'];
    const ehSaudacao = saudacoes.some(s => text.toLowerCase().includes(s));
    
    // Se não há contato cadastrado
    if (!contato) {
        const ultimaInteracao = await obterUltimaInteracao(sender);
        
        // Se é uma saudação OU não há interação anterior, enviar saudação
        if (ehSaudacao || !ultimaInteracao) {
            console.log('🎆 SAUDAÇÃO DETECTADA - Enviando mensagem de boas-vindas');
            return await iniciarFluxoBoasVindas(sender, sendMessage);
        }
        
        // Se já tem interação e não é saudação, processar baseado no estado
        return await processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage);
    }
    
    // Para contatos cadastrados
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    if (ehSaudacao || !ultimaInteracao) {
        console.log('🎆 SAUDAÇÃO CADASTRADO - Enviando mensagem de boas-vindas');
        return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
    
    return await processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage);
}

async function iniciarFluxoBoasVindas(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '👋 Olá! Seja bem-vindo(a) ao futuro dos treinamentos normativos.\nEu sou a Eliza, a sua assistente virtual 🤖\nJá imaginou fazer um curso oficial de saúde e segurança direto pelo WhatsApp? 📱\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    
    await salvarInteracao(sender, 'aguardando_opcao_inicial', JSON.stringify({ etapa: 'opcao_inicial' }));
    return true;
}

async function processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage) {
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
            return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
}

async function processarOpcaoInicial(sender, text, contato, sendMessage) {
    const opcao = text.trim();
    console.log(`🔢 Opção: "${opcao}", Contato: ${contato ? contato.nome : 'NÃO CADASTRADO'}`);
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        if (!contato) {
            setTimeout(async () => {
                await sendMessage(sender, 'send-message', {
                    message: '🤔 Hum, que tal fazer o seu cadastro na nossa plataforma antes, hein?\nÉ muito simples, basta clicar no link abaixo e assim que finalizar é só voltar aqui e me envie qualquer mensagem para começarmos!\n\nhttps://abrir.link/kAgON\n\nATENÇÃO:\nNo Cadastro use o MESMO NÚMERO que você utilizará para conversar aqui comigo.\n\n💡 Caso tenha feito cadastro com um número diferente desse, basta acessar novamente o painel de cadastro, rolar a tela até o final e acessar os seus dados para realizar a edição do número.'
                });
                await salvarInteracao(sender, 'aguardando_cadastro', JSON.stringify({ etapa: 'aguardando_cadastro' }));
            }, 300);
        } else {
            await mostrarComoFunciona(sender, contato.nome, sendMessage);
        }
        return true;
    } else if (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('nao')) {
        await sendMessage(sender, 'send-message', {
            message: '😄 Ahh Vai!!! Leva só um minutinho, prometo que vai ser legal!\n\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
        });
        
        // Enviar GIF do gatinho como sticker
        setTimeout(async () => {
            try {
                const path = require('path');
                const gifPath = path.join(__dirname, 'medias', 'gatinho-porfavor.gif');
                console.log(`🖼️ Tentando enviar GIF como sticker: ${gifPath}`);
                
                await sendMessage(sender, 'send-sticker-gif', {
                    path: gifPath
                });
            } catch (error) {
                console.error('❌ Erro ao enviar GIF sticker:', error);
                // Fallback: enviar emoji
                await sendMessage(sender, 'send-message', {
                    message: '😿'
                });
            }
        }, 500);
        return true;
    }
    
    await sendMessage(sender, 'send-message', {
        message: 'Por favor, escolha uma das opções:\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    return true;
}

async function processarAposCadastro(sender, text, contato, sendMessage) {
    if (contato) {
        await mostrarComoFunciona(sender, contato.nome, sendMessage);
    } else {
        await sendMessage(sender, 'send-message', {
            message: '🤔 Parece que você ainda não finalizou o cadastro. Após se cadastrar, volte aqui e me envie qualquer mensagem!\n\nhttps://abrir.link/kAgON'
        });
    }
    return true;
}

async function mostrarComoFunciona(sender, nome, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: `😃 Muito bem ${nome}! Aqui o treinamento acontece como uma conversa rápida:\n• Mensagens curtas 💬\n• Linguagem simples ✅\n• Interatividade o tempo todo ⚡\n👉 E tudo com validade legal 📜`
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '🎉 [Aqui seria enviado um sticker/gif animado]'
        });
        
        setTimeout(async () => {
            await sendMessage(sender, 'send-message', {
                message: 'Quer ver os recursos que posso usar?\n1️⃣ Sim, mostra aí.\n2️⃣ Pula essa parte.'
            });
            await salvarInteracao(sender, 'mostrar_recursos', JSON.stringify({ etapa: 'mostrar_recursos' }));
        }, 500);
    }, 800);
}

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
    }, 800);
    
    return true;
}

async function iniciarTreinamentoReal(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🎯 Agora vamos começar seu treinamento!\n\nEste é um curso completo sobre técnicas de apresentação eficaz.\n\n📚 Você está pronto para começar?'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '🎉 Parabéns! Você concluiu a demonstração do sistema de treinamentos!\n\n✨ Em breve teremos mais conteúdos disponíveis.\n\n📞 Entre em contato conosco para mais informações!'
        });
    }, 1500);
}

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

async function iniciarTreinamentoApresentacao(sender, sendMessage) {
    return await processarRespostaApresentacao(sender, '', null, null, sendMessage);
}

module.exports = {
    processarRespostaApresentacao,
    iniciarTreinamentoApresentacao
};