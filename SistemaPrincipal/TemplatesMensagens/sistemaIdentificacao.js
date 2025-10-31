const { Interacao, Usuario } = require('../BancoDeDados/models');
const { encurtarNome } = require('./utils/formatarNome');
const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');

// ==================== SISTEMA DE IDENTIFICAÇÃO ====================

async function processarMensagemInicial(sender, text, sendMessage, buscarContato) {
    console.log(`🎯 [SistemaIdentificacao] Processando: "${text}" de ${sender}`);
    
    // CÓDIGO ESPECIAL PARA PULAR DIRETO PARA CERTIFICADO
    if (text.trim() === '#CERT123') {
        console.log('🎯 CÓDIGO ESPECIAL DETECTADO - Pulando para certificado');
        return await processarCodigoEspecialCertificado(sender, sendMessage, buscarContato);
    }
    
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
        case 'treinamentos_pendentes':
            // Verificar se é resposta válida para treinamentos pendentes
            const respostasValidasTreinamentos = ['1', '2', '3', '4', 'fazer', 'ferramenta', 'depois', 'comercial'];
            const textoLimpoTreinamentos = text.toLowerCase().trim();
            
            if (!respostasValidasTreinamentos.some(r => textoLimpoTreinamentos.includes(r) || textoLimpoTreinamentos === r)) {
                console.log('🔄 Mensagem não reconhecida em treinamentos pendentes - Resetando para início');
                return await enviarSaudacaoInicial(sender, sendMessage);
            }
            
            // Se for resposta válida, processar normalmente
            const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
            
            const contatoMock = {
                id: dados.contato_id || 'mock',
                nome: dados.nome || 'Usuário',
                empresaId: dados.empresa_id || 'N/A'
            };
            
            return await treinamentoApresentacao.processarRespostaApresentacao(
                sender, 
                text, 
                null, 
                contatoMock, 
                sendMessage, 
                null
            );
            
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
            const treinamentoApresentacao2 = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
            
            const contatoMock2 = {
                id: dados.contato_id || 'mock',
                nome: dados.nome || 'Usuário',
                empresaId: dados.empresa_id || 'N/A'
            };
            
            return await treinamentoApresentacao2.processarRespostaApresentacao(
                sender, 
                text, 
                null, 
                contatoMock2, 
                sendMessage, 
                null
            );
            
        // Etapas do treinamento EPC/EPI
        case 'epc_epi_iniciado':
        case 'epc_epi_introducao':
        case 'epc_epi_audio_confirmacao':
        case 'epc_epi_perigo_risco':
        case 'epc_epi_pergunta_a':
        case 'epc_epi_pergunta_b':
        case 'epc_epi_pergunta_relaxar_a':
        case 'epc_epi_pergunta_relaxar_b':
        case 'epc_epi_pergunta_relaxar_c':
        case 'epc_epi_pergunta_relaxar_d':
        case 'epc_epi_definicoes':
        case 'epc_epi_tipos_epc':
        case 'epc_epi_tipos_epi':
        case 'epc_epi_uso_correto':
        case 'epc_epi_manutencao':
        case 'epc_epi_responsabilidades':
        case 'epc_epi_avaliacao':
        case 'epc_epi_certificado':
        case 'epc_epi_reprovado':
        case 'epc_epi_finalizado':
            console.log(`🎓 [EPC_EPI] Processando etapa: ${etapa}`);
            
            // Verificar se é saudação para resetar (apenas mensagens curtas e específicas)
            const saudacoes = ['oi', 'olá', 'ola', 'hello', 'hi', 'tchau', 'sair', 'menu', 'inicio'];
            const textoLimpo = text.toLowerCase().trim();
            
            // Se for saudação exata ou mensagem curta, resetar para início
            if (textoLimpo.length <= 10 && saudacoes.some(s => textoLimpo === s || textoLimpo.startsWith(s))) {
                console.log('🔄 Saudação detectada no treinamento - Resetando para início');
                return await enviarSaudacaoInicial(sender, sendMessage);
            }
            
            // Processar pelo treinamento EPC/EPI
            const epcEpi = require('./Treinamentos/EPC_EPI/epc_epi');
            
            // Buscar contato para o treinamento
            let contatoEpcEpi = null;
            if (buscarContato) {
                contatoEpcEpi = await buscarContato();
            }
            
            if (!contatoEpcEpi) {
                // Criar contato mock se não encontrar
                contatoEpcEpi = {
                    id: dados.contato_id || 'mock',
                    nome: dados.nome || 'Usuário',
                    numero: sender.replace('@c.us', ''),
                    empresaId: dados.empresa_id || 'N/A'
                };
            } else {
                // Adicionar número do telefone
                contatoEpcEpi.numero = sender.replace('@c.us', '');
            }
            
            return await epcEpi.processarTreinamentoEpcEpi(
                sender,
                text,
                null,
                contatoEpcEpi,
                sendMessage,
                buscarContato
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
                // Já teve interações - Verificar treinamentos pendentes
                console.log(`🔄 Usuário ${contato.nome} já teve interações - Verificando treinamentos`);
                
                const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
                const treinamentosPendentes = await treinamentoApresentacao.verificarTreinamentosEmpresa(contato.empresaId, contato.id);
                
                if (treinamentosPendentes && treinamentosPendentes.length > 0) {
                    await treinamentoApresentacao.direcionarParaTreinamentos(sender, sendMessage, treinamentosPendentes, contato);
                    await salvarInteracao(sender, 'treinamentos_pendentes', JSON.stringify({ 
                        etapa: 'treinamentos_pendentes',
                        contato_id: contato.id,
                        nome: encurtarNome(contato.nome),
                        empresa_id: contato.empresaId || 'N/A',
                        treinamentos: treinamentosPendentes
                    }));
                    return true;
                }
                
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
        // Verificar treinamentos pendentes da empresa
        console.log(`🎓 Verificando treinamentos pendentes para empresa ID: ${dados.empresa_id}`);
        
        const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
        
        // Buscar treinamentos pendentes
        const treinamentosPendentes = await treinamentoApresentacao.verificarTreinamentosEmpresa(dados.empresa_id, dados.contato_id);
        
        if (treinamentosPendentes && treinamentosPendentes.length > 0) {
            console.log(`📚 Encontrados ${treinamentosPendentes.length} treinamentos pendentes`);
            
            // Criar objeto contato para direcionamento
            const contatoMock = {
                id: dados.contato_id,
                nome: dados.nome,
                empresaId: dados.empresa_id
            };
            
            await treinamentoApresentacao.direcionarParaTreinamentos(sender, sendMessage, treinamentosPendentes, contatoMock);
            await salvarInteracao(sender, 'treinamentos_pendentes', JSON.stringify({ 
                etapa: 'treinamentos_pendentes',
                contato_id: dados.contato_id,
                nome: dados.nome,
                empresa_id: dados.empresa_id,
                treinamentos: treinamentosPendentes
            }));
        } else {
            console.log(`✅ Nenhum treinamento pendente para empresa ${dados.empresa_id}`);
            await sendMessage(sender, 'send-message', {
                message: `🎉 Parabéns, ${dados.nome}! Você não possui treinamentos pendentes no momento.\n\n✅ Todos os seus treinamentos estão em dia!`
            });
            await salvarInteracao(sender, 'finalizado', JSON.stringify({ etapa: 'finalizado' }));
        }
        
    } else if (opcao === '2' || opcao.toLowerCase().includes('ferramenta') || opcao.toLowerCase().includes('conhecer') || opcao.toLowerCase().includes('melhor')) {
        // Mostrar apresentação da ferramenta
        console.log(`📱 Iniciando apresentação da ferramenta para ${dados.nome}`);
        
        // Chamar o fluxo de apresentação do treinamentoApresentacao
        const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
        
        console.log(`📱 Iniciando apresentação para ${dados.nome}`);
        
        // Salvar dados do contato na interação para uso posterior
        await salvarInteracao(sender, 'mostrar_recursos', JSON.stringify({ 
            etapa: 'mostrar_recursos',
            contato_id: dados.contato_id,
            nome: dados.nome,
            empresa_id: dados.empresa_id,
            vem_de_treinamentos_pendentes: true // Flag para indicar que veio da tela de treinamentos pendentes
        }));
        
        // Chamar diretamente a função mostrarComoFunciona do treinamentoApresentacao
        await treinamentoApresentacao.mostrarComoFunciona(sender, dados.nome, sendMessage);
        
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
        
        // Buscar treinamentos pendentes
        const treinamentosPendentes = await treinamentoApresentacao.verificarTreinamentosEmpresa(contato.empresaId, contato.id);
        
        let mensagem = `🎉 Perfeito, ${encurtarNome(contato.nome)}! Seu cadastro foi realizado com sucesso.\n\n`;
        
        if (treinamentosPendentes && treinamentosPendentes.length > 0) {
            mensagem += `🎓 Identifiquei que sua empresa tem treinamentos pendentes:\n\n`;
            
            treinamentosPendentes.forEach((treinamento) => {
                let icone = '⚠️';
                
                switch (treinamento.status_prazo) {
                    case 'vencido':
                        icone = '🔴';
                        break;
                    case 'urgente':
                        icone = '🟡';
                        break;
                    case 'normal':
                        icone = treinamento.tipo === 'reciclagem' ? '🔄' : '⚠️';
                        break;
                }
                
                mensagem += `${icone} ${treinamento.nome}\n`;
            });
        } else {
            mensagem += `✅ Todos os seus treinamentos estão em dia!\n`;
        }
        
        mensagem += `\n👉 *O que você gostaria de fazer?*\n\n`;
        mensagem += `1️⃣ Fazer meus treinamentos agora\n`;
        mensagem += `2️⃣ Ver como a ferramenta funciona\n`;
        mensagem += `3️⃣ Acessar meus certificados\n`;
        mensagem += `4️⃣ Lembrar depois\n`;
        mensagem += `5️⃣ Falar com o comercial\n`;
        mensagem += `6️⃣ Falar com o suporte`;
        mensagem += `\n\n💡 *Dica:* Digite *MENU* a qualquer momento para voltar a este menu.`;
        
        await sendMessage(sender, 'send-message', { message: mensagem });
        
        await salvarInteracao(sender, 'treinamentos_pendentes', JSON.stringify({ 
            etapa: 'treinamentos_pendentes',
            contato_id: contato.id,
            nome: encurtarNome(contato.nome),
            empresa_id: contato.empresaId || 'N/A',
            treinamentos: treinamentosPendentes || []
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
        const { Op } = require('sequelize');
        return await Interacao.findOne({
            where: { 
                telefone: sender,
                tipo: { [Op.ne]: 'mensagem_usuario' }
            },
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.error('❌ Erro ao obter última interação:', error);
        return null;
    }
}

async function salvarInteracao(sender, tipo, mensagem) {
    try {
        const telefone = sender.replace('@c.us', '');
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

// ==================== CÓDIGO ESPECIAL PARA CERTIFICADO ====================

async function processarCodigoEspecialCertificado(sender, sendMessage, buscarContato) {
    try {
        // Buscar contato
        const contato = await buscarContato();
        
        if (!contato) {
            await sendMessage(sender, 'send-message', {
                message: '❌ Usuário não encontrado no sistema. Faça seu cadastro primeiro em: https://abrir.link/ZEeCt'
            });
            return false;
        }
        
        console.log(`🎯 Código especial ativado para ${contato.nome}`);
        
        // Importar o sistema de certificados
        const certificados = require('./Certificados/certificados2');
        const TreinamentoUtils = require('./Treinamentos/treinamento-utils');
        
        await sendMessage(sender, 'send-message', {
            message: `🎯 *CÓDIGO ESPECIAL ATIVADO!*\n\n👤 Usuário: ${contato.nome}\n📧 Email: ${contato.email || 'N/A'}\n🏢 Empresa: ${contato.empresa?.nome || 'N/A'}\n\n⚡ Gerando certificado...`
        });
        
        // Gerar certificado usando apenas o ID do contato
        const certificadoPath = await certificados.gerarCertificado(contato.id);
        
        if (certificadoPath) {
            // Criar token de certificado usando ID automático do treinamento
            const resultado = await TreinamentoUtils.criarTokenCertificadoTreinamento(
                contato.id,
                'epc_epi.js', // Nome do arquivo do treinamento
                certificadoPath
            );
            
            const linkAssinatura = resultado.linkAssinatura;
            
            if (resultado && linkAssinatura) {
                await sendMessage(sender, 'send-message', {
                    message: `✅ *CERTIFICADO GERADO COM SUCESSO!*\n\n📜 Seu certificado de **Treinamento EPC/EPI** foi gerado.\n\n🖊️ **Para finalizar, você precisa assinar digitalmente:**\n${linkAssinatura}\n\n⏰ *Link válido por 24 horas*\n\n📱 Acesse pelo celular ou computador para assinar e baixar seu certificado oficial.`
                });
                
                console.log(`✅ Certificado gerado via código especial para ${contato.nome}`);
                console.log(`🔗 Link de assinatura: ${linkAssinatura}`);
            } else {
                await sendMessage(sender, 'send-message', {
                    message: '❌ Erro ao criar link de assinatura. Tente novamente.'
                });
            }
        } else {
            await sendMessage(sender, 'send-message', {
                message: '❌ Erro ao gerar certificado. Tente novamente.'
            });
        }
        
        // Finalizar interação
        await salvarInteracao(sender, 'finalizado', JSON.stringify({ 
            etapa: 'finalizado',
            codigo_especial: true,
            certificado_gerado: !!certificadoPath
        }));
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no código especial:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro interno. Tente novamente ou entre em contato com o suporte.'
        });
        return false;
    }
}

module.exports = {
    processarMensagemInicial,
    processarOpcaoUsuarioCadastrado
};