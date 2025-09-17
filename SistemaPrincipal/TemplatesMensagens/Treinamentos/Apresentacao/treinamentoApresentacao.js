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
    
    // Se é uma saudação E não há interação anterior, enviar saudação
    if (ehSaudacao && !ultimaInteracao) {
        console.log('🎆 SAUDAÇÃO CADASTRADO - Enviando mensagem de boas-vindas');
        return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
    
    // Se há interação anterior, processar baseado no estado
    if (ultimaInteracao) {
        return await processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage);
    }
    
    // Se não há interação anterior, iniciar fluxo
    return await iniciarFluxoBoasVindas(sender, sendMessage);
}

async function iniciarFluxoBoasVindas(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '👋 Olá! Seja bem-vindo(a) ao futuro dos treinamentos normativos.\nEu sou a Eliza, a sua assistente virtual \nJá imaginou fazer um curso oficial de saúde e segurança direto pelo WhatsApp? 📱\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
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
        case 'processando_cadastrado':
            console.log('🔄 Ignorando mensagem - usuário já sendo processado');
            return true;
        case 'mostrar_recursos':
            return await processarMostrarRecursos(sender, text, sendMessage);

        case 'quando_onde':
            return await processarQuandoOnde(sender, text, sendMessage);
        case 'exemplos_treinamentos':
            return await processarExemplosTrainamentos(sender, text, sendMessage);
        case 'outras_aplicacoes':
            return await processarOutrasAplicacoes(sender, text, sendMessage);
        case 'contato_comercial':
            return await processarContatoComercial(sender, text, sendMessage);
        default:
            return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
}

async function processarOpcaoInicial(sender, text, contato, sendMessage) {
    const opcao = text.trim();
    console.log(`🔢 Opção: "${opcao}", Contato: ${contato ? contato.nome : 'NÃO CADASTRADO'}`);
    
    // Se é uma saudação e o usuário está cadastrado, prosseguir automaticamente
    const saudacoes = ['olá', 'oi', 'ola', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'];
    const ehSaudacao = saudacoes.some(s => opcao.toLowerCase().includes(s));
    
    if (ehSaudacao && contato) {
        console.log(`🎉 SAUDAÇÃO DE USUÁRIO CADASTRADO: ${contato.nome} - Prosseguindo automaticamente`);
        await mostrarComoFunciona(sender, contato.nome, sendMessage);
        return true;
    }
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        if (!contato) {
            setTimeout(async () => {
                await sendMessage(sender, 'send-message', {
                    message: '🤔 Hum, que tal fazer o seu cadastro na nossa plataforma antes, hein?\nÉ muito simples, basta clicar no link abaixo e assim que finalizar é só voltar aqui e me envie qualquer mensagem para começarmos!\n\nhttps://abrir.link/ZEeCt\n\nATENÇÃO:\nNo Cadastro use o MESMO NÚMERO que você utilizará para conversar aqui comigo.\n\n💡 Caso tenha feito cadastro com um número diferente desse, basta acessar novamente o painel de cadastro, rolar a tela até o final e acessar os seus dados para realizar a edição do número.'
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
                await sendMessage(sender, 'send-message', {
                    message: '😿'
                });
            }
        }, 500);
        return true;
    }
    
    if (ehSaudacao && !contato) {
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
        });
        return true;
    }
    
    await sendMessage(sender, 'send-message', {
        message: 'Por favor, escolha uma das opções:\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    return true;
}

async function processarAposCadastro(sender, text, contato, sendMessage) {
    if (contato) {
        console.log(`🎉 USUÁRIO CADASTRADO RETORNOU: ${contato.nome}`);
        await salvarInteracao(sender, 'processando_cadastrado', JSON.stringify({ etapa: 'processando_cadastrado' }));
        await mostrarComoFunciona(sender, contato.nome, sendMessage);
        return true;
    } else {
        await sendMessage(sender, 'send-message', {
            message: '🤔 Parece que você ainda não finalizou o cadastro. Após se cadastrar, volte aqui e me envie qualquer mensagem!\n\nhttps://abrir.link/kAgON'
        });
        return true;
    }
}

async function mostrarComoFunciona(sender, nome, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: `😃 Muito bem ${nome}! Aqui o treinamento acontece como uma conversa rápida:\n• Mensagens curtas 💬\n• Linguagem simples ✅\n• Interatividade o tempo todo ⚡\n👉 E tudo com validade legal`
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: 'Quer ver os recursos que posso usar?\n1️⃣ Sim, mostra aí.\n2️⃣ Pula essa parte.'
        });
        await salvarInteracao(sender, 'mostrar_recursos', JSON.stringify({ etapa: 'mostrar_recursos' }));
    }, 800);
}

async function processarMostrarRecursos(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        await mostrarRecursosDetalhados(sender, sendMessage);
    } else {
        await mostrarExemplosTrainamentos(sender, sendMessage);
    }
    
    return true;
}

async function mostrarRecursosDetalhados(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🎯 Olha só o que cabe dentro de um treinamento no WhatsApp:\n\n• 📹 Vídeos curtos\n• 🎤 Áudios explicativos\n• 🖼️ Imagens e infográficos\n• 📑 Arquivos PDF e procedimentos\n• 📝 Testes e avaliações\n\n👉 Fácil, rápido e na palma da mão.'
    });
    
    setTimeout(async () => {
        try {
            const path = require('path');
            const fs = require('fs');
            
            // 1. Enviar vídeo primeiro
            const videoPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'Video01.mp4');
            console.log(`🎥 Tentando enviar vídeo: ${videoPath}`);
            
            if (fs.existsSync(videoPath)) {
                console.log('✅ Arquivo de vídeo encontrado');
                await sendMessage(sender, 'send-video', {
                    path: videoPath,
                    caption: 'Aqui está um exemplo de vídeo que pode ser usado em um treinamento:'
                });
                console.log('✅ Vídeo enviado com sucesso');
            }
            
            // 2. Enviar imagem após o vídeo
            setTimeout(async () => {
                const imagePath = path.join(__dirname, 'material_apresentacao', 'Imagens', 'Vantagens.png');
                if (fs.existsSync(imagePath)) {
                    await sendMessage(sender, 'send-image', {
                        path: imagePath,
                        caption: ''
                    });
                    console.log('✅ Imagem enviada com sucesso');
                }
                
                // 3. Enviar áudio por último
                setTimeout(async () => {
                    const audioPath = path.join(__dirname, 'material_apresentacao', 'audios', 'Audio_texto01.mp3');
                    if (fs.existsSync(audioPath)) {
                        await sendMessage(sender, 'send-file', {
                            path: audioPath,
                            filename: 'audio.mp3',
                            caption: 'Já imaginou fazermos um treinamento interativo, simples, com linguagem clara e cheio de Interação? É isso que você terá a oportunidade de participar com os treinamentos normativos no WhatsApp'
                        });
                        console.log('✅ Áudio enviado com sucesso');
                    }
                    
                    // Ir para exemplos de treinamentos após todos os arquivos
                    setTimeout(async () => {
                        await mostrarExemplosTrainamentos(sender, sendMessage);
                    }, 1000);
                }, 1500);
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro ao enviar arquivos:', error);
            // Em caso de erro, ir direto para exemplos
            setTimeout(async () => {
                await mostrarExemplosTrainamentos(sender, sendMessage);
            }, 1000);
        }
    }, 1500);
}

async function processarRecursosDetalhados(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('quero')) {
        await mostrarQuandoOnde(sender, sendMessage);
    } else {
        await mostrarExemplosTrainamentos(sender, sendMessage);
    }
    
    return true;
}

async function mostrarQuandoOnde(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '⏰ Você pode fazer o curso:\n\n• No intervalo do café ☕\n• No ônibus ou metrô 🚎\n• Em qualquer lugar, a qualquer hora 🌍\n\nTudo com registro, certificado e validade normativa.'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '👉 Quer exemplos de treinamentos que já temos no WhatsApp?\n1️⃣ Sim!\n2️⃣ Não, quero ver outra aplicação.'
        });
        await salvarInteracao(sender, 'quando_onde', JSON.stringify({ etapa: 'quando_onde' }));
    }, 1200);
}

async function processarQuandoOnde(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        await mostrarExemplosTrainamentos(sender, sendMessage);
    } else {
        await mostrarOutrasAplicacoes(sender, sendMessage);
    }
    
    return true;
}

async function mostrarExemplosTrainamentos(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '📚 Olha só alguns exemplos que já estão rodando no zap:\n\n• NR01 – Gerenciamento de Riscos\n• NR06 – EPC & EPI\n• NR10 – Segurança em Eletricidade ⚡\n• NR12 – Segurança em Máquinas\n• NR35 – Trabalho em Altura 🧗'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '👉 Quer ver outras aplicações práticas além dos treinamentos?\n\n1️⃣ Sim, me mostra.\n2️⃣ Já estou convencido(a)!'
        });
        await salvarInteracao(sender, 'exemplos_treinamentos', JSON.stringify({ etapa: 'exemplos_treinamentos' }));
    }, 1000);
}

async function processarExemplosTrainamentos(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        await mostrarOutrasAplicacoes(sender, sendMessage);
    } else {
        await mostrarContatoComercial(sender, sendMessage);
    }
    
    return true;
}

async function mostrarOutrasAplicacoes(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🚪 Imagine a sua portaria com um treinamento relâmpago para visitantes.\nEles fazem o curso pelo WhatsApp e saem com certificado na hora ✅.'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: 'Ou aquele terceiro que vem de longe: recebe o link, faz o cadastro e conclui o treinamento completo com certificado direto no e-mail 📧.'
        });
        
        setTimeout(async () => {
            await sendMessage(sender, 'send-message', {
                message: '👉 Quer conversar um pouco mais com nosso comercial e ver como podemos fechar esta parceria?\n1️⃣ Sim, quero conversar com o comercial\n2️⃣ Prefiro falar com o time técnico primeiro.'
            });
            await salvarInteracao(sender, 'outras_aplicacoes', JSON.stringify({ etapa: 'outras_aplicacoes' }));
        }, 800);
    }, 1000);
}

async function processarOutrasAplicacoes(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('comercial')) {
        await mostrarContatoComercial(sender, sendMessage);
    } else {
        await mostrarContatoTecnico(sender, sendMessage);
    }
    
    return true;
}

async function mostrarContatoComercial(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🙌 Maravilha! É só clicar no link abaixo e chamar o nosso comercial:\n\n🔗 https://wa.me/5531999999999?text=Olá,%20vim%20do%20bot%20e%20quero%20saber%20mais%20sobre%20treinamentos%20no%20WhatsApp'
    });
    
    await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
    return true;
}

async function mostrarContatoTecnico(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🤝 Sem problema! Se quiser conversar com nosso time técnico ou tirar dúvidas:\n\n📧 treinamentos@salubrita.com.br\n📞 (31) 3166-9006'
    });
    
    await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
    return true;
}

async function processarContatoComercial(sender, text, sendMessage) {
    // Conversa finalizada, qualquer mensagem reinicia
    return await iniciarFluxoBoasVindas(sender, sendMessage);
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