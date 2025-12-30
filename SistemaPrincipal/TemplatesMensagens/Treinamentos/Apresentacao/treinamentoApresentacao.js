// ID do treinamento
const TREINAMENTO_ID = 15;
const NOME_TREINAMENTO = 'Como fazer Treinamentos Normativos no WhatsApp';

const { Usuario, Interacao } = require('../../../BancoDeDados/models');
const { gerarCertificado } = require('../../Certificados/gerarCertificado');
const { encurtarNome } = require('../../utils/formatarNome');
const { atualizarDadosUsuario } = require('../../utils/atualizarDadosUsuario');

// ==================== FUNÇÃO PRINCIPAL ====================

async function processarRespostaApresentacao(sender, text, selectedId, contato, sendMessage, buscarContato = null) {
    console.log(`🎯 [APRESENTACAO] Processando resposta: "${text}" de ${sender}`);
    
    // Se for comando especial para iniciar apresentação
    if (text === 'iniciar_apresentacao') {
        console.log('🎆 INICIANDO FLUXO DE APRESENTAÇÃO');
        return await mostrarComoFunciona(sender, contato.nome, sendMessage);
    }
    
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    // Se conversa foi finalizada, reiniciar
    if (ultimaInteracao && JSON.parse(ultimaInteracao.mensagem || '{}').etapa === 'finalizado') {
        console.log('🎆 REINICIANDO FLUXO - Conversa finalizada');
        return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
    
    // Se não há interação anterior, iniciar fluxo
    if (!ultimaInteracao) {
        console.log('🎆 PRIMEIRA INTERAÇÃO - Iniciando fluxo');
        return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
    
    // Se há interação anterior, processar baseado no estado
    if (ultimaInteracao) {
        return await processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage, buscarContato);
    }
    
    // Se não há interação anterior, iniciar fluxo
    return await iniciarFluxoBoasVindas(sender, sendMessage);
}

async function processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage, buscarContato = null) {
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const etapa = dados.etapa;
    
    console.log(`🎯 Etapa atual: ${etapa}`);
    console.log(`📝 Text: "${text}", SelectedId: "${selectedId}"`);
    
    switch (etapa) {
        case 'opcao_inicial':
            return await processarOpcaoInicial(sender, text, sendMessage, buscarContato);
        case 'aguardando_cadastro':
            return await processarAposCadastro(sender, text, sendMessage, buscarContato);
        case 'processando_cadastrado':
            console.log('🔄 Ignorando mensagem duplicada - usuário já sendo processado');
            return true;
        case 'processando_recursos':
            console.log('🔄 Ignorando mensagem - recursos já sendo processados');
            return true;
        case 'mostrar_recursos':
            return await processarMostrarRecursos(sender, text, sendMessage);
        case 'processando_recursos':
            console.log('🔄 Ignorando mensagem - recursos já sendo processados');
            return true;
        case 'testes_avaliacoes':
            console.log('📝 Entrando em processarTestesAvaliacoes');
            return await processarTestesAvaliacoes(sender, text, selectedId, sendMessage);
        case 'perguntar_quando_onde':
            return await processarPerguntaQuandoOnde(sender, text, sendMessage);
        case 'exemplos_treinamentos':
            return await processarExemplosTrainamentos(sender, text, sendMessage);
        case 'outras_aplicacoes':
            return await processarOutrasAplicacoes(sender, text, sendMessage);
        case 'confirmar_dados_certificado':
            return await processarConfirmacaoDados(sender, text, sendMessage);
        case 'pergunta_conteudo_restante':
            return await processarPerguntaConteudoRestante(sender, text, sendMessage);
        case 'contato_comercial':
            return await processarContatoComercial(sender, text, sendMessage);
        case 'treinamentos_pendentes':
            return await processarTreinamentosPendentes(sender, text, sendMessage);
        case 'finalizando':
            console.log('🔄 Conversa finalizada - reiniciando fluxo');
            return await iniciarFluxoBoasVindas(sender, sendMessage);
        default:
            console.log(`⚠️ Etapa desconhecida: ${etapa} - Continuando fluxo`);
            return true;
    }
}

// ==================== FLUXO INICIAL ====================

async function iniciarFluxoBoasVindas(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '👋 Olá! Seja bem-vindo(a) ao futuro dos treinamentos normativos.\nEu sou a Eliza, sua assistente virtual \nJá imaginou fazer um curso oficial de saúde e segurança direto pelo WhatsApp? 📱\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    
    await salvarInteracao(sender, 'aguardando_opcao_inicial', JSON.stringify({ etapa: 'opcao_inicial' }));
    return true;
}

async function processarOpcaoInicial(sender, text, sendMessage, buscarContato = null) {
    const opcao = text.trim();
    console.log(`🔢 Opção: "${opcao}"`);
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        // Só AGORA identificar o contato após escolher opção 1
        let contato = null;
        if (buscarContato) {
            contato = await buscarContato();
            console.log(`📋 RESULTADO:`, contato ? `${contato.nome}` : 'NÃO ENCONTRADO');
        }
        
        if (!contato) {
            // MODO VISITANTE - Permitir ver apresentação sem cadastro
            console.log(`👤 MODO VISITANTE: Iniciando apresentação sem cadastro`);
            
            // Salvar interação ANTES de enviar mensagens para evitar loop
            await salvarInteracao(sender, 'processando_cadastrado', JSON.stringify({ 
                etapa: 'processando_cadastrado',
                modo_visitante: true
            }));
            console.log(`✅ Interação salva para evitar loop`);
            
            await mostrarComoFunciona(sender, 'Visitante', sendMessage);
            console.log(`✅ mostrarComoFunciona chamada`);
        } else {
            console.log(`🎉 USUÁRIO CADASTRADO: ${contato.nome} - Iniciando apresentação direta`);
            
            try {
                // Salvar dados do contato na interação para uso posterior
                await salvarInteracao(sender, 'mostrar_recursos', JSON.stringify({ 
                    etapa: 'mostrar_recursos',
                    contato_id: contato.id,
                    nome: contato.nome || contato.nomeCompleto,
                    empresa_id: contato.empresaId,
                    em_apresentacao_direta: true // Flag para indicar apresentação direta
                }));
                
                await mostrarComoFunciona(sender, encurtarNome(contato.nome || contato.nomeCompleto), sendMessage);
            } catch (error) {
                console.error(`❌ Erro ao iniciar apresentação:`, error);
                throw error;
            }
        }
        return true;
    } else if (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('nao')) {
        await sendMessage(sender, 'send-message', {
            message: '😄 Ahh vai!!! Leva só um minutinho, prometo que vai ser legal!\n\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
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
    } else {
        // Resposta inválida
        console.log(`❌ Resposta inválida na opção inicial: "${opcao}"`);
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta. Por favor, escolha uma das opções:\n\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
        });
        return true;
    }
}

async function processarAposCadastro(sender, text, sendMessage, buscarContato = null) {
    // Buscar contato novamente
    let contato = null;
    if (buscarContato) {
        contato = await buscarContato();
    }
    
    if (contato) {
        console.log(`🎉 USUÁRIO CADASTRADO RETORNOU: ${contato.nome}`);
        await salvarInteracao(sender, 'processando_cadastrado', JSON.stringify({ etapa: 'processando_cadastrado' }));
        await mostrarComoFunciona(sender, encurtarNome(contato.nome || contato.nomeCompleto), sendMessage);
        return true;
    } else {
        // MODO VISITANTE - Permitir continuar sem cadastro
        console.log(`👤 MODO VISITANTE: Usuário ainda não cadastrado, iniciando apresentação`);
        
        // Salvar interação ANTES de enviar mensagens para evitar loop
        await salvarInteracao(sender, 'processando_cadastrado', JSON.stringify({ 
            etapa: 'processando_cadastrado',
            modo_visitante: true
        }));
        
        await mostrarComoFunciona(sender, 'Visitante', sendMessage);
        return true;
    }
}

// ==================== APRESENTAÇÃO DOS RECURSOS ====================

async function mostrarComoFunciona(sender, nome, sendMessage) {
    console.log(`🎬 [APRESENTACAO] Iniciando mostrarComoFunciona para ${sender} (${nome})`);
    
    // LIMPAR PROGRESSO ANTERIOR ao iniciar nova apresentação
    console.log(`🧹 [PROGRESSO] Limpando progresso anterior para ${sender}`);
    await limparProgressoAnterior(sender);
    
    // Mensagem de boas-vindas para visitantes
    if (nome === 'Visitante') {
        console.log(`📤 [ENVIO] Enviando mensagem de boas-vindas visitante`);
        try {
            await sendMessage(sender, 'send-message', {
                message: '😊 Perfeito! Vou te mostrar como funciona!\n\n⚠️ *Modo Visitante*\nVocê poderá ver toda a apresentação e gerar seu certificado de demonstração.\n\n📌 Para certificados oficiais com assinatura digital e validade legal, faça seu cadastro: https://abrir.link/ZEeCt'
            });
            console.log(`✅ [ENVIO] Mensagem visitante enviada`);
        } catch (error) {
            console.error(`❌ [ENVIO] Erro ao enviar mensagem visitante:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`📤 [ENVIO] Enviando mensagem principal`);
    try {
        await sendMessage(sender, 'send-message', {
            message: `😃 Muito bem ${nome}! Aqui o treinamento acontece como uma conversa rápida:\n• Mensagens curtas 💬\n• Linguagem simples ✅\n• Interatividade o tempo todo ⚡\n👉 E tudo com validade legal`
        });
        console.log(`✅ [ENVIO] Mensagem principal enviada`);
    } catch (error) {
        console.error(`❌ [ENVIO] Erro ao enviar mensagem principal:`, error);
    }
    
    setTimeout(async () => {
        console.log(`📤 [ENVIO] Enviando pergunta recursos`);
        try {
            await sendMessage(sender, 'send-message', {
                message: 'Quer ver os recursos que posso usar?\n1️⃣ Sim, mostra aí.\n2️⃣ Pula essa parte.'
            });
            console.log(`✅ [ENVIO] Pergunta recursos enviada`);
        } catch (error) {
            console.error(`❌ [ENVIO] Erro ao enviar pergunta recursos:`, error);
        }
        await salvarInteracao(sender, 'mostrar_recursos', JSON.stringify({ 
            etapa: 'mostrar_recursos',
            em_apresentacao: true
        }));
    }, 800);
}

async function processarMostrarRecursos(sender, text, sendMessage) {
    const opcao = text.trim().toLowerCase();
    
    console.log(`🎯 Processando mostrar recursos: "${text}" -> "${opcao}"`);
    
    if (opcao === '1' || opcao.includes('sim') || opcao.includes('mostra')) {
        console.log('✅ Mostrando recursos detalhados');
        await mostrarRecursosDetalhados(sender, sendMessage);
    } else if (opcao === '2' || opcao.includes('pula')) {
        console.log('✅ Pulando recursos - Continuando apresentação');
        
        // Enviar GIF de preguiça como sticker
        try {
            const path = require('path');
            const gifPath = path.join(__dirname, 'medias', 'preguica.gif');
            console.log(`🖼️ Tentando enviar GIF de preguiça como sticker: ${gifPath}`);
            
            await sendMessage(sender, 'send-sticker-gif', {
                path: gifPath
            });
        } catch (error) {
            console.error('❌ Erro ao enviar GIF sticker:', error);
        }
        
        // Aguardar 1 segundo antes de continuar
        setTimeout(async () => {
            // Continuar diretamente com exemplos de treinamentos sem verificar pendentes
            // A verificação de treinamentos pendentes já foi feita no início da apresentação
            await mostrarExemplosTrainamentos(sender, sendMessage);
        }, 1000);
    } else {
        console.log('❌ Opção inválida - reenviando');
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Sim, mostra aí.\n2️⃣ Pula essa parte.'
        });
    }
    
    return true;
}

async function mostrarRecursosDetalhados(sender, sendMessage) {
    // Marcar que está processando recursos para evitar duplicação
    await salvarInteracao(sender, 'processando_recursos', JSON.stringify({ etapa: 'processando_recursos' }));
    
    // Marcar progresso
    await marcarProgressoEtapa(sender, 'recursos_detalhados');
    
    await sendMessage(sender, 'send-message', {
        message: '🎯 Olha só o que cabe dentro de um treinamento no WhatsApp:\n\n• 📹 Vídeos curtos\n• 🎤 Áudios explicativos\n• 🖼️ Imagens e infográficos\n• 📑 Arquivos PDF e procedimentos\n• 📝 Testes e avaliações\n\n👉 Fácil, rápido e na palma da mão.'
    });
    
    setTimeout(async () => {
        try {
            const path = require('path');
            const fs = require('fs');
            
            // 1. Enviar vídeo
            const videoPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'Video01.mp4');
            if (fs.existsSync(videoPath)) {
                try {
                    await sendMessage(sender, 'send-video', {
                        path: videoPath,
                        caption: '📹 *Vídeos curtos*'
                    });
                } catch (error) {
                    console.error('❌ Erro ao enviar vídeo:', error);
                    await sendMessage(sender, 'send-message', {
                        message: '📹 *Vídeos curtos*\n\nVídeos explicativos de fácil compreensão'
                    });
                }
            } else {
                await sendMessage(sender, 'send-message', {
                    message: '📹 *Vídeos curtos*\n\nVídeos explicativos de fácil compreensão'
                });
            }
            
            // 2. Enviar imagem
            setTimeout(async () => {
                const imagePath = path.join(__dirname, 'material_apresentacao', 'Imagens', 'Vantagens.png');
                if (fs.existsSync(imagePath)) {
                    try {
                        await sendMessage(sender, 'send-image', {
                            path: imagePath,
                            caption: '🖼️ *Imagens e infográficos*'
                        });
                    } catch (error) {
                        console.error('❌ Erro ao enviar imagem:', error);
                        await sendMessage(sender, 'send-message', {
                            message: '🖼️ *Imagens e infográficos*\n\nRecursos visuais para facilitar o aprendizado'
                        });
                    }
                } else {
                    await sendMessage(sender, 'send-message', {
                        message: '🖼️ *Imagens e infográficos*\n\nRecursos visuais para facilitar o aprendizado'
                    });
                }
                
                // 3. Texto do áudio
                setTimeout(async () => {
                    await sendMessage(sender, 'send-message', {
                        message: '🎤 *Áudios explicativos*\nJá imaginou fazermos um treinamento interativo, simples, com linguagem clara e cheio de Interação? É isso que você terá a oportunidade de participar com os treinamentos normativos no WhatsApp'
                    });
                    
                    // 4. Enviar áudio
                    setTimeout(async () => {
                        const audioPath = path.join(__dirname, 'material_apresentacao', 'audios', 'Audio_texto01.mp3');
                        if (fs.existsSync(audioPath)) {
                            try {
                                await sendMessage(sender, 'send-file', {
                                    path: audioPath,
                                    filename: 'audio.mp3'
                                });
                            } catch (error) {
                                console.error('❌ Erro ao enviar áudio:', error);
                            }
                        }
                        
                        // 5. Testes e avaliações
                        setTimeout(async () => {
                            await sendMessage(sender, 'send-message', {
                                message: '📝 *Testes e avaliações*'
                            });
                            
                            setTimeout(async () => {
                                try {
                                    await sendMessage(sender, 'send-list-message', {
                                        title: '',
                                        description: 'Você concorda em realizar treinamentos normativos no WhatsApp em sua empresa?',
                                        buttonText: 'Ver opções',
                                        listType: 'SINGLE_SELECT',
                                        sections: [{
                                            title: 'Suas opções',
                                            rows: [
                                                {
                                                    id: 'sim_concordo',
                                                    title: '🟢 1 - SIM',
                                                    description: 'Concordo com os treinamentos'
                                                },
                                                {
                                                    id: 'com_certeza', 
                                                    title: '🔵 2 - COM CERTEZA',
                                                    description: 'Definitivamente concordo'
                                                }
                                            ]
                                        }]
                                    });
                                    await salvarInteracao(sender, 'testes_avaliacoes', JSON.stringify({ etapa: 'testes_avaliacoes' }));
                                } catch (error) {
                                    console.error('❌ Erro ao enviar lista:', error);
                                    await sendMessage(sender, 'send-message', {
                                        message: 'Você concorda em realizar treinamentos normativos no WhatsApp em sua empresa?\n\n1️⃣ SIM\n2️⃣ COM CERTEZA'
                                    });
                                    await salvarInteracao(sender, 'testes_avaliacoes', JSON.stringify({ etapa: 'testes_avaliacoes' }));
                                }
                            }, 500);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro ao enviar arquivos:', error);
        }
    }, 1000);
}

// ==================== PROCESSAMENTO DE TESTES E AVALIAÇÕES ====================

async function processarTestesAvaliacoes(sender, text, selectedId, sendMessage) {
    const opcao = text.trim().toLowerCase();
    console.log(`📝 Processando resposta dos testes: "${text}", selectedId: "${selectedId}"`);
    
    // Processar tanto texto quanto selectedId
    if (selectedId === 'sim_concordo' || selectedId === 'com_certeza' || opcao === '1' || opcao === '2' || opcao.includes('sim') || opcao.includes('certeza')) {
        console.log('✅ Resposta positiva detectada - continuando fluxo');
        await perguntarQuandoOnde(sender, sendMessage);
        return true;
    }
    
    // Se resposta inválida
    if (!selectedId && opcao !== '1' && opcao !== '2' && !opcao.includes('sim') && !opcao.includes('certeza')) {
        console.log(`❌ Resposta inválida nos testes: "${text}"`);
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta. Você concorda em realizar treinamentos normativos no WhatsApp em sua empresa?\n\n1️⃣ SIM\n2️⃣ COM CERTEZA'
        });
        return true;
    }
    
    // Se chegou até aqui, continuar fluxo
    await perguntarQuandoOnde(sender, sendMessage);
    return true;
}

// ==================== QUANDO E ONDE USAR ====================

async function perguntarQuandoOnde(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: 'Quer saber quando e onde você pode usar?\n\n1️⃣ Quero sim.\n2️⃣ Vamos direto para exemplos de treinamentos.'
    });
    await salvarInteracao(sender, 'perguntar_quando_onde', JSON.stringify({ etapa: 'perguntar_quando_onde' }));
}

async function processarPerguntaQuandoOnde(sender, text, sendMessage) {
    const opcao = text.trim().toLowerCase();
    
    console.log(`⏰ Processando quando/onde: "${text}" -> "${opcao}"`);
    
    if (opcao === '1' || opcao.includes('quero sim')) {
        console.log('✅ Mostrando quando/onde usar');
        await mostrarQuandoOnde(sender, sendMessage);
    } else if (opcao === '2' || opcao.includes('direto') || opcao.includes('exemplos')) {
        console.log('✅ Indo direto para exemplos');
        
        // Enviar GIF de preguiça como sticker
        try {
            const path = require('path');
            const gifPath = path.join(__dirname, 'medias', 'preguica.gif');
            console.log(`🖼️ Tentando enviar GIF de preguiça como sticker: ${gifPath}`);
            
            await sendMessage(sender, 'send-sticker-gif', {
                path: gifPath
            });
        } catch (error) {
            console.error('❌ Erro ao enviar GIF sticker:', error);
        }
        
        // Aguardar 1 segundo antes de continuar
        setTimeout(async () => {
            // Não marcar progresso se pulou
            await mostrarExemplosTrainamentos(sender, sendMessage);
        }, 1000);
    } else {
        console.log('❌ Opção inválida - reenviando');
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Quero sim.\n2️⃣ Vamos direto para exemplos de treinamentos.'
        });
    }
    
    return true;
}

async function mostrarQuandoOnde(sender, sendMessage) {
    // Marcar progresso
    await marcarProgressoEtapa(sender, 'quando_onde');
    
    await sendMessage(sender, 'send-message', {
        message: '⏰ *Você pode fazer o curso:*'
    });

    // Enviar imagens
    const path = require('path');
    const fs = require('fs');
    const imagens = ['nocafe.png', 'nometro.png', 'notrabalho.png'];
    const legendas = ['☕ Tomando um café', '🚎 No ônibus ou metrô', '🌍 No trabalho ou em qualquer lugar'];
    
    for (let i = 0; i < imagens.length; i++) {
        const imagemPath = path.join(__dirname, 'material_apresentacao', 'Imagens', imagens[i]);
        if (fs.existsSync(imagemPath)) {
            await sendMessage(sender, 'send-image', {
                path: imagemPath,
                caption: legendas[i]
            });
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }
    
    await sendMessage(sender, 'send-message', {
        message: '📜 Tudo com registro, certificado e validade normativa.'
    });

    // Continuar direto para exemplos após 2 segundos
    setTimeout(async () => {
        await mostrarExemplosTrainamentos(sender, sendMessage);
    }, 2000);
}

// ==================== EXEMPLOS DE TREINAMENTOS ====================

async function mostrarExemplosTrainamentos(sender, sendMessage) {
    console.log(`📚 [EXEMPLOS] Mostrando exemplos para ${sender} - NÃO marcando progresso ainda`);
    
    await sendMessage(sender, 'send-message', {
        message: '📚 Olha só alguns exemplos que já estão rodando no zap:\n\n• NR01 – Gerenciamento de Riscos\n• NR06 – EPC & EPI\n• NR10 – Segurança em Eletricidade ⚡\n• NR12 – Segurança em Máquinas\n• NR35 – Trabalho em Altura 🧗'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: 'Quer ver outras aplicações práticas além dos treinamentos?\n\n1️⃣ Sim, me mostra.\n2️⃣ Já estou convencido(a)!'
        });
        await salvarInteracao(sender, 'exemplos_treinamentos', JSON.stringify({ etapa: 'exemplos_treinamentos' }));
    }, 1000);
}

async function processarExemplosTrainamentos(sender, text, sendMessage) {
    const opcao = text.trim().toLowerCase();
    
    console.log(`📚 Processando exemplos treinamentos: "${text}" -> "${opcao}"`);
    
    if (opcao === '1' || opcao.includes('sim, me mostra') || opcao.includes('mostra')) {
        console.log('✅ Opção 1 selecionada - enviando vídeos');
        await enviarVideoTreinamentoMotorista(sender, sendMessage);
    } else if (opcao === '2' || opcao.includes('convencido') || opcao.includes('já estou')) {
        console.log('✅ Opção 2 selecionada - pulando vídeos');
        
        // Enviar GIF de preguiça como sticker
        try {
            const path = require('path');
            const gifPath = path.join(__dirname, 'medias', 'preguica.gif');
            console.log(`🖼️ Tentando enviar GIF de preguiça como sticker: ${gifPath}`);
            
            await sendMessage(sender, 'send-sticker-gif', {
                path: gifPath
            });
        } catch (error) {
            console.error('❌ Erro ao enviar GIF sticker:', error);
        }
        
        // Aguardar 1 segundo antes de continuar
        setTimeout(async () => {
            // NÃO marcar progresso de videos_exemplos se pulou
            // Ir direto para certificado (que vai detectar que faltou conteúdo)
            await perguntarDadosCertificado(sender, sendMessage);
        }, 1000);
    } else {
        console.log('❌ Opção inválida - reenviando opções');
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Sim, me mostra.\n2️⃣ Já estou convencido(a)!'
        });
    }
    
    return true;
}

// ==================== ENVIO DE VÍDEOS ====================

async function enviarVideoTreinamentoMotorista(sender, sendMessage) {
    // Verificar se já está processando vídeos para evitar duplicação
    const chaveProcessamento = `video_motorista_${sender}`;
    if (global.processandoVideos && global.processandoVideos.has(chaveProcessamento)) {
        console.log('🔄 Vídeo de motorista já sendo processado, ignorando');
        return;
    }
    
    // Marcar como processando
    if (!global.processandoVideos) global.processandoVideos = new Set();
    global.processandoVideos.add(chaveProcessamento);
    
    // Marcar progresso
    await marcarProgressoEtapa(sender, 'videos_exemplos');
    
    try {
        const path = require('path');
        const fs = require('fs');
        
        const videoPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'treinamento-motorista.mp4');
        console.log(`🎥 Tentando enviar vídeo: ${videoPath}`);
        
        if (fs.existsSync(videoPath)) {
            try {
                await sendMessage(sender, 'send-video', {
                    path: videoPath,
                    caption: '🎥 Exemplo prático: Treinamento para motoristas'
                });
                console.log('✅ Vídeo de motoristas enviado com sucesso');
            } catch (error) {
                console.error('❌ Erro ao enviar vídeo de motoristas:', error);
                await sendMessage(sender, 'send-message', {
                    message: '🎥 *Exemplo prático: Treinamento para motoristas*\n\n🚗 Nossos treinamentos incluem:\n• Vídeos explicativos\n• Simulações práticas\n• Testes interativos\n• Certificado válido\n\n📱 Tudo direto no WhatsApp!'
                });
            }
        } else {
            console.log('❌ Arquivo de vídeo não encontrado, enviando mensagem alternativa');
            await sendMessage(sender, 'send-message', {
                message: '🎥 *Exemplo prático: Treinamento para motoristas*\n\n🚗 Nossos treinamentos incluem:\n• Vídeos explicativos\n• Simulações práticas\n• Testes interativos\n• Certificado válido\n\n📱 Tudo direto no WhatsApp!'
            });
        }

        
        // Ir direto para certificado após o vídeo (pular segundo vídeo)
        setTimeout(async () => {
            await perguntarDadosCertificado(sender, sendMessage);
            // Remover da lista de processamento
            global.processandoVideos.delete(chaveProcessamento);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao processar vídeo:', error);
        await sendMessage(sender, 'send-message', {
            message: '🎥 *Exemplo prático: Treinamento para motoristas*\n\n🚗 Nossos treinamentos incluem:\n• Vídeos explicativos\n• Simulações práticas\n• Testes interativos\n• Certificado válido\n\n📱 Tudo direto no WhatsApp!'
        });
        await perguntarDadosCertificado(sender, sendMessage);
        // Remover da lista de processamento
        global.processandoVideos.delete(chaveProcessamento);
    }
}

async function enviarVideoTreinamentoTerceiros(sender, sendMessage) {
    // Verificar se já está processando vídeos de terceiros
    const chaveProcessamento = `video_terceiros_${sender}`;
    if (global.processandoVideos && global.processandoVideos.has(chaveProcessamento)) {
        console.log('🔄 Vídeo de terceiros já sendo processado, ignorando');
        return;
    }
    
    // Marcar como processando
    if (!global.processandoVideos) global.processandoVideos = new Set();
    global.processandoVideos.add(chaveProcessamento);
    
    try {
        const path = require('path');
        const fs = require('fs');
        
        const videoPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'Treinamento de Terceiros via WhatsApp.mp4');
        console.log(`🎥 Tentando enviar vídeo de terceiros: ${videoPath}`);
        
        if (fs.existsSync(videoPath)) {
            try {
                await sendMessage(sender, 'send-video', {
                    path: videoPath,
                    caption: '🎥 Exemplo prático: Treinamento de Terceiros'
                });
                console.log('✅ Vídeo de terceiros enviado com sucesso');
            } catch (error) {
                console.error('❌ Erro ao enviar vídeo de terceiros:', error);
                await sendMessage(sender, 'send-message', {
                    message: '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!'
                });
            }
        } else {
            console.log('❌ Arquivo de vídeo de terceiros não encontrado, enviando mensagem alternativa');
            await sendMessage(sender, 'send-message', {
                message: '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!'
            });
        }

        
        setTimeout(async () => {
            await perguntarDadosCertificado(sender, sendMessage);
            // Remover da lista de processamento
            global.processandoVideos.delete(chaveProcessamento);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao processar vídeo de terceiros:', error);
        await sendMessage(sender, 'send-message', {
            message: '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!'
        });
        await perguntarDadosCertificado(sender, sendMessage);
        // Remover da lista de processamento
        global.processandoVideos.delete(chaveProcessamento);
    }
}

// ==================== CONFIRMAÇÃO DE DADOS PARA CERTIFICADO ====================

async function perguntarDadosCertificado(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: "🎓 Agora você pode receber o seu certificado!"
    });
    
    try {
        // Buscar dados do contato no sistema - mesma lógica do Template2
        console.log(`🔍 Buscando contato para telefone: ${sender}`);
        
        const formatosTelefone = [
            sender,                           // 553399595511
            sender.substring(2),              // 3399595511  
            `${sender.substring(0, 4)}9${sender.substring(4)}`, // 5533999595511 (adicionar 9)
            sender.length === 13 ? sender.substring(0, 4) + sender.substring(5) : sender, // 5533999595511 -> 553399595511 (remover 9º dígito)
        ];
        
        let contato = null;
        for (const formato of formatosTelefone) {
            contato = await Usuario.findOne({ where: { telefone: formato } });
            if (contato) {
                console.log(`✅ Contato encontrado: ${contato.nome || contato.nomeCompleto} (formato: ${formato})`);
                break;
            }
        }
        
        console.log(`📊 Contato encontrado:`, contato ? 'SIM' : 'NÃO');
        
        if (contato) {
            const nome = contato.nomeCompleto || contato.nome || null;
            const email = contato.email || null;
            
            console.log(`📝 Dados do contato - Nome: ${nome}, Email: ${email}`);
            
            if (nome && email && nome !== 'Não informado' && email !== 'Não informado') {
                await sendMessage(sender, 'send-message', {
                    message: `🎓 *Certificado de conclusão*\n\nDados cadastrados no sistema:\n\n👤 *Nome:* ${nome}\n📧 *E-mail:* ${email}\n\nEstão corretos?\n\n1️⃣ Sim, estão corretos\n2️⃣ Não, quero corrigir`
                });
                await salvarInteracao(sender, 'confirmar_dados_certificado', JSON.stringify({ 
                    etapa: 'confirmar_dados_certificado', 
                    nome: nome, 
                    email: email 
                }));
                return;
            }
        }
        
        // Se não encontrou contato ou dados estão incompletos - MODO VISITANTE
        await sendMessage(sender, 'send-message', {
            message: '🎓 *Certificado de Participação*\n\nPara emitir seu certificado, preciso de alguns dados:\n\n📝 Por favor, envie:\n\n*Nome completo:* (como deve aparecer no certificado)\n*CPF:* (para validação)\n*E-mail:* (para envio do certificado)\n\nExemplo:\nJoão Silva Santos\n123.456.789-00\njoao@email.com'
        });
        await salvarInteracao(sender, 'confirmar_dados_certificado', JSON.stringify({ etapa: 'confirmar_dados_certificado' }));
        
    } catch (error) {
        console.error('❌ Erro ao buscar contato:', error);
        await sendMessage(sender, 'send-message', {
            message: '🎓 *Certificado de Participação*\n\nPara emitir seu certificado, preciso de alguns dados:\n\n📝 Por favor, envie:\n\n*Nome completo:* (como deve aparecer no certificado)\n*CPF:* (para validação)\n*E-mail:* (para envio do certificado)\n\nExemplo:\nJoão Silva Santos\n123.456.789-00\njoao@email.com'
        });
        await salvarInteracao(sender, 'confirmar_dados_certificado', JSON.stringify({ etapa: 'confirmar_dados_certificado' }));
    }
}

async function processarConfirmacaoDados(sender, text, sendMessage) {
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const opcao = text.trim();
    
    // Se tem dados salvos (do sistema) e usuário confirmou
    if (dados.nome && dados.email && (opcao === '1' || opcao.toLowerCase().includes('sim') || opcao.toLowerCase().includes('correto'))) {
        await gerarEEnviarCertificado(dados.nome, dados.email, sender, sendMessage);
        return true;
    }
    
    // Se usuário quer alterar ou não tem dados salvos
    if (dados.nome && dados.email && (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('corrigir'))) {
        await sendMessage(sender, 'send-message', {
            message: '📝 Por favor, envie os dados corretos:\n\n*Nome completo:*\n*CPF:*\n*E-mail:*\n\nExemplo:\nJoão Silva Santos\n123.456.789-00\njoao@email.com'
        });
        await salvarInteracao(sender, 'confirmar_dados_certificado', JSON.stringify({ etapa: 'confirmar_dados_certificado' }));
        return true;
    }
    
    // Se tem dados salvos mas resposta é inválida
    if (dados.nome && dados.email && opcao !== '1' && opcao !== '2' && !opcao.toLowerCase().includes('sim') && !opcao.toLowerCase().includes('correto') && !opcao.toLowerCase().includes('não') && !opcao.toLowerCase().includes('corrigir')) {
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta. Os dados estão corretos?\n\n1️⃣ Sim, estão corretos\n2️⃣ Não, quero corrigir'
        });
        return true;
    }
    
    // Processar dados informados manualmente
    const linhas = text.trim().split('\n').filter(linha => linha.trim());
    
    if (linhas.length >= 3) {
        const nome = linhas[0].trim();
        const cpf = linhas[1].trim();
        const email = linhas[2].trim();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await sendMessage(sender, 'send-message', {
                message: '❌ E-mail inválido. Por favor, envie novamente:\n\n*Nome completo:*\n*CPF:*\n*E-mail válido:*\n\nExemplo:\nJoão Silva Santos\n123.456.789-00\njoao@email.com'
            });
            return true;
        }
        
        // Salvar CPF na interação para uso posterior
        await salvarInteracao(sender, 'confirmar_dados_certificado', JSON.stringify({ 
            etapa: 'confirmar_dados_certificado',
            nome: nome,
            email: email,
            cpf: cpf
        }));
        
        // Gerar certificado diretamente (não precisa atualizar banco para visitante)
        await gerarEEnviarCertificado(nome, email, sender, sendMessage);
    } else {
        await sendMessage(sender, 'send-message', {
            message: '❌ Dados incompletos. Por favor, envie:\n\n*Nome completo:*\n*CPF:*\n*E-mail:*\n\nExemplo:\nJoão Silva Santos\n123.456.789-00\njoao@email.com'
        });
    }
    
    return true;
}

async function gerarEEnviarCertificado(nome, email, sender, sendMessage) {
    // Verificar se o usuário completou todo o treinamento
    const progressoCompleto = await verificarProgressoCompleto(sender);
    
    console.log(`📋 [CERTIFICADO] Resultado verificação progresso:`);
    console.log(`📋 Completo: ${progressoCompleto.completo}`);
    console.log(`📋 Faltando: ${JSON.stringify(progressoCompleto.faltando)}`);
    
    if (!progressoCompleto.completo) {
        await sendMessage(sender, 'send-message', {
            message: `🎓 *Certificado Disponível!*\n\n⚠️ Para emitir seu certificado, você precisa ver todo o conteúdo do treinamento.\n\n📋 *Partes que você ainda não viu:*\n${progressoCompleto.faltando.join('\n')}\n\nQuer ver o restante do conteúdo para obter o certificado?\n\n1️⃣ Sim, quero ver o conteúdo\n2️⃣ Não, obrigado`
        });
        
        await salvarInteracao(sender, 'pergunta_conteudo_restante', JSON.stringify({ 
            etapa: 'pergunta_conteudo_restante',
            nome: nome,
            email: email,
            proximaParte: progressoCompleto.proximaParte
        }));
        return;
    }
    
    // Buscar contato no banco
    const { Usuario } = require('../../../BancoDeDados/models');
    const telefone = sender.replace('@c.us', '');
    const formatosTelefone = [
        telefone,
        telefone.substring(2),
        `${telefone.substring(0, 4)}9${telefone.substring(4)}`,
        telefone.length === 13 ? telefone.substring(0, 4) + telefone.substring(5) : telefone,
    ];

    let contato = null;
    for (const formato of formatosTelefone) {
        contato = await Usuario.findOne({ where: { telefone: formato } });
        if (contato) break;
    }

    if (!contato) {
        // MODO VISITANTE - Gerar certificado com dados informados
        // Buscar CPF da última interação
        const ultimaInteracao = await obterUltimaInteracao(sender);
        const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
        const cpf = dados.cpf || 'Não informado';
        
        await gerarCertificadoVisitante(nome, email, cpf, sender, sendMessage);
        return;
    }
    
    await sendMessage(sender, 'send-message', {
        message: '⏳ Gerando seu certificado...'
    });
    
    try {

        const { gerarCertificadoBanco } = require('../../Certificados/certificados2');
        const TreinamentoUtils = require('../treinamento-utils');
        
        // Usar ID 15 para treinamento de apresentação
        const caminhoArquivo = await gerarCertificadoBanco(contato.id, null, 15, false);

        const { gerarCertificadoComAssinatura } = require('../../Template2');
        
        // Usar função centralizada
        const resultado = await gerarCertificadoComAssinatura(
            contato.id,
            'treinamentoApresentacao.js',
            15,
            sendMessage,
            sender
        );
        
        if (resultado.sucesso) {
            await sendMessage(sender, 'send-message', {
                message: `✅ *CERTIFICADO GERADO COM SUCESSO!*\n\n📜 Seu certificado de **Treinamento de Apresentação** foi gerado.\n\n🖊️ **Para finalizar, você precisa assinar digitalmente:**\n${resultado.linkAssinatura}\n\n⏰ *Link válido por 24 horas*\n\n📱 Acesse pelo celular ou computador para assinar e baixar seu certificado oficial.`
            });
        }
    } catch (error) {
        console.error('❌ Erro ao gerar certificado:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro interno ao gerar certificado. Tente novamente mais tarde.'
        });
    }
    
    setTimeout(async () => {
        await mostrarOutrasAplicacoes(sender, sendMessage);
    }, 1000);
}

// ==================== OUTRAS APLICAÇÕES ====================

async function mostrarOutrasAplicacoes(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '📊 *Outras aplicações práticas:*\n\n• 📝 Integração de terceiros\n• 📈 Comunicação de acidentes\n• 📊 Pesquisas de clima organizacional\n• 📝 Procedimentos operacionais\n• 📅 Lembretes de segurança'
    });
    
    setTimeout(async () => {
        // Verificar se o usuário veio da tela de treinamentos pendentes
        const ultimaInteracao = await obterUltimaInteracao(sender);
        let temTreinamentosPendentes = false;
        
        if (ultimaInteracao) {
            const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
            if (dados.vem_de_treinamentos_pendentes && dados.treinamentos_pendentes) {
                temTreinamentosPendentes = true;
            }
        }
        
        if (temTreinamentosPendentes) {
            await sendMessage(sender, 'send-message', {
                message: 'Agora que você já viu como funciona, o que gostaria de fazer?\n\n1️⃣ Fazer meus treinamentos pendentes\n2️⃣ Conversar com o comercial\n3️⃣ Lembrar depois'
            });
            await salvarInteracao(sender, 'outras_aplicacoes', JSON.stringify({ 
                etapa: 'outras_aplicacoes',
                tem_treinamentos_pendentes: true
            }));
        } else {
            await sendMessage(sender, 'send-message', {
                message: 'Agora que você já viu tudo, quer conversar com nosso time comercial?\n\n1️⃣ Sim, quero mais informações!\n2️⃣ Não, obrigado.'
            });
            await salvarInteracao(sender, 'outras_aplicacoes', JSON.stringify({ etapa: 'outras_aplicacoes' }));
        }
    }, 1000);
}

async function processarOutrasAplicacoes(sender, text, sendMessage) {
    const opcao = text.trim().toLowerCase();
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    
    console.log(`📊 Processando outras aplicações: "${text}" -> "${opcao}"`);
    
    // Verificar se tem treinamentos pendentes
    if (dados.tem_treinamentos_pendentes) {
        if (opcao === '1' || opcao.includes('treinamentos') || opcao.includes('pendentes')) {
            console.log('✅ Direcionando para treinamentos pendentes');
            await sendMessage(sender, 'send-message', {
                message: '🎓 Excelente! Vou direcionar você para seus treinamentos pendentes.\n\n🚀 Preparando seu ambiente de treinamento...\n\n⚠️ [EM DESENVOLVIMENTO]\nEm breve você será direcionado automaticamente para o primeiro treinamento da lista.'
            });
            await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
        } else if (opcao === '2' || opcao.includes('comercial')) {
            console.log('✅ Direcionando para contato comercial');
            await finalizarApresentacao(sender, sendMessage);
        } else if (opcao === '3' || opcao.includes('depois') || opcao.includes('lembrar')) {
            console.log('✅ Lembrando depois');
            await sendMessage(sender, 'send-message', {
                message: '😊 Perfeito! Vou te lembrar sobre seus treinamentos.\n\n📋 **Treinamentos pendentes salvos!**\n\nQuando quiser fazer, é só me mandar um "oi" que te direciono direto para eles.\n\n⏰ Não esqueça dos prazos!'
            });
            await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
        } else {
            await sendMessage(sender, 'send-message', {
                message: 'Por favor, escolha uma das opções:\n\n1️⃣ Fazer meus treinamentos pendentes\n2️⃣ Conversar com o comercial\n3️⃣ Lembrar depois'
            });
        }
    } else {
        // Fluxo normal sem treinamentos pendentes
        if (opcao === '1' || opcao.includes('sim, quero') || opcao.includes('mais informações')) {
            console.log('✅ Verificando treinamentos pendentes antes do contato comercial');
            await verificarTreinamentosPendentes(sender, sendMessage);
        } else if (opcao === '2' || opcao.includes('não, obrigado') || opcao.includes('obrigado')) {
            console.log('✅ Usuário não quer contato comercial - verificando treinamentos pendentes');
            await verificarTreinamentosPendentes(sender, sendMessage, false);
        } else {
            console.log('❌ Opção inválida - reenviando');
            await sendMessage(sender, 'send-message', {
                message: 'Por favor, escolha uma das opções:\n\n1️⃣ Sim, quero mais informações!\n2️⃣ Não, obrigado.'
            });
        }
    }
    
    return true;
}

// ==================== VERIFICAÇÃO DE TREINAMENTOS PENDENTES ====================

async function verificarTreinamentosPendentes(sender, sendMessage, querContato = true) {
    try {
        // Buscar dados do contato
        const formatosTelefone = [
            sender,
            sender.substring(2),
            `${sender.substring(0, 4)}9${sender.substring(4)}`,
            sender.length === 13 ? sender.substring(0, 4) + sender.substring(5) : sender,
        ];
        
        let contato = null;
        for (const formato of formatosTelefone) {
            contato = await Usuario.findOne({ where: { telefone: formato } });
            if (contato) break;
        }
        
        if (!contato || !contato.empresaId) {
            console.log('📊 Não foi possível identificar empresa - direcionando para contato');
            if (querContato) {
                await finalizarApresentacao(sender, sendMessage);
            } else {
                await finalizarSemContato(sender, sendMessage);
            }
            return;
        }
        
        console.log(`📊 Verificando treinamentos para empresa ID: ${contato.empresaId}, contato ID: ${contato.id}`);
        
        // Buscar treinamentos pendentes da empresa, excluindo os já completados pelo usuário
        const treinamentosPendentes = await verificarTreinamentosEmpresa(contato.empresaId, contato.id);
        
        if (treinamentosPendentes && treinamentosPendentes.length > 0) {
            console.log(`🎓 Encontrados ${treinamentosPendentes.length} treinamentos pendentes`);
            await direcionarParaTreinamentos(sender, sendMessage, treinamentosPendentes, contato);
        } else {
            console.log('📊 Nenhum treinamento pendente encontrado');
            if (querContato) {
                await finalizarApresentacao(sender, sendMessage);
            } else {
                await finalizarSemContato(sender, sendMessage);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar treinamentos pendentes:', error);
        if (querContato) {
            await finalizarApresentacao(sender, sendMessage);
        } else {
            await finalizarSemContato(sender, sendMessage);
        }
    }
}

async function verificarTreinamentosEmpresa(empresaId, contatoId = null) {
    try {
        const { sequelize } = require('../../../BancoDeDados/models');
        
        console.log(`🔍 Consultando treinamentos para empresa ${empresaId}, contato ${contatoId}`);
        
        // Query otimizada para buscar treinamentos da empresa que o contato ainda não completou
        const query = `
            SELECT 
                t.id,
                t.nome,
                et.data_atribuicao,
                CASE 
                    WHEN DATEDIFF(DATE_ADD(et.data_atribuicao, INTERVAL 30 DAY), CURDATE()) < 0 THEN 'vencido'
                    WHEN DATEDIFF(DATE_ADD(et.data_atribuicao, INTERVAL 30 DAY), CURDATE()) <= 7 THEN 'urgente'
                    ELSE 'normal'
                END as status_prazo,
                DATE_ADD(et.data_atribuicao, INTERVAL 30 DAY) as prazo
            FROM treinamentos t
            INNER JOIN empresas_treinamentos et ON t.id = et.treinamento_id
            LEFT JOIN assinaturas_certificados ac ON ac.usuario_id = :contatoId 
                AND ac.token_assinatura LIKE CONCAT(t.id, '_%')
                AND ac.status = 'assinado'
            WHERE et.empresa_id = :empresaId
                AND ac.id IS NULL
            ORDER BY 
                CASE 
                    WHEN DATEDIFF(DATE_ADD(et.data_atribuicao, INTERVAL 30 DAY), CURDATE()) < 0 THEN 1
                    WHEN DATEDIFF(DATE_ADD(et.data_atribuicao, INTERVAL 30 DAY), CURDATE()) <= 7 THEN 2
                    ELSE 3
                END,
                et.data_atribuicao ASC
        `;
        
        const replacements = { empresaId, contatoId };
        
        const resultados = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });
        
        if (resultados.length === 0) {
            console.log(`❌ Nenhum treinamento pendente encontrado para empresa ${empresaId}`);
            return [];
        }
        
        // Mapear resultados para formato esperado
        const treinamentos = resultados.map(resultado => {
            let tipo = 'obrigatorio';
            
            // Determinar tipo baseado no status do prazo
            if (resultado.status_prazo === 'vencido') {
                tipo = 'vencido';
            } else if (resultado.status_prazo === 'urgente') {
                tipo = 'urgente';
            }
            
            return {
                id: resultado.id,
                nome: resultado.nome,
                tipo: tipo,
                prazo: resultado.prazo.toISOString().split('T')[0], // formato YYYY-MM-DD
                status_prazo: resultado.status_prazo
            };
        });
        
        console.log(`✅ Empresa ${empresaId} tem ${treinamentos.length} treinamentos pendentes`);
        console.log(`📊 Detalhes:`, treinamentos.map(t => `${t.nome} (${t.status_prazo})`));
        
        return treinamentos;
        
    } catch (error) {
        console.error('❌ Erro ao buscar treinamentos da empresa:', error);
        return [];
    }
}

async function direcionarParaTreinamentos(sender, sendMessage, treinamentos, contato) {
    const nomeContato = encurtarNome(contato.nome || contato.nomeCompleto);
    const { gerarMenuTreinamentosPendentes } = require('../../Template2');
    
    let mensagem = `🎓 Ótimo ${nomeContato}! Identifiquei que sua empresa tem treinamentos pendentes:\n\n`;
    
    treinamentos.forEach((treinamento, index) => {
        const prazoFormatado = treinamento.prazo ? ` (prazo: ${treinamento.prazo})` : '';
        
        // Determinar ícone baseado no status do prazo
        let icone = '⚠️'; // Padrão
        
        switch (treinamento.status_prazo) {
            case 'vencido':
                icone = '🔴'; // Vencido
                break;
            case 'urgente':
                icone = '🟡'; // Urgente (até 7 dias)
                break;
            case 'normal':
                if (treinamento.tipo === 'reciclagem') {
                    icone = '🔄'; // Reciclagem
                } else {
                    icone = '⚠️'; // Normal
                }
                break;
        }
        
        mensagem += `${icone} ${treinamento.nome}\n`;
    });
    
    mensagem += gerarMenuTreinamentosPendentes();
    
    await sendMessage(sender, 'send-message', { message: mensagem });
    
    await salvarInteracao(sender, 'treinamentos_pendentes', JSON.stringify({ 
        etapa: 'treinamentos_pendentes',
        treinamentos: treinamentos,
        contato_id: contato.id,
        empresa_id: contato.empresaId
    }));
}

async function finalizarSemContato(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '😊 Obrigada pelo seu tempo! \n\nSe precisar de alguma coisa ou quiser conhecer nossos treinamentos, é só me mandar um "oi" que recomeçamos!\n\n🚀 Até a próxima!'
    });
    await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
}

// ==================== FINALIZAÇÃO ====================

async function finalizarApresentacao(sender, sendMessage) {
    // Marcar como finalizado ANTES de enviar mensagens para evitar duplicação
    await salvarInteracao(sender, 'finalizando', JSON.stringify({ etapa: 'finalizando' }));
    
    // Enviar GIF de palmas como sticker animado antes da mensagem final
    try {
        const path = require('path');
        const gifPath = path.join(__dirname, 'medias', 'palmas.gif');
        console.log(`🖼️ Tentando enviar GIF de palmas como sticker: ${gifPath}`);
        
        await sendMessage(sender, 'send-sticker-gif', {
            path: gifPath
        });
    } catch (error) {
        console.error('❌ Erro ao enviar GIF de palmas:', error);
        await sendMessage(sender, 'send-message', {
            message: '👏👏👏'
        });
    }
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '🎉 *Perfeito!*\n\nVou te conectar com nosso time comercial agora mesmo!\n\n👉 Clique no link abaixo para falar diretamente com nossa equipe:\n\nhttps://wa.me/553195095646?text=Ol%C3%A1%2C%20vim%20pelo%20assistente%20virtual%20de%20treinamentos.\n\n🚀 Obrigada por conhecer o futuro dos treinamentos normativos!'
        });
        
        await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
    }, 1000);
}





async function processarContatoComercial(sender, text, sendMessage) {
    // Qualquer mensagem reinicia o fluxo
    console.log('🔄 Contato comercial finalizado - reiniciando fluxo');
    return await iniciarFluxoBoasVindas(sender, sendMessage);
}

// Processar resposta dos treinamentos pendentes
async function processarTreinamentosPendentes(sender, text, sendMessage) {
    const opcao = text.trim();
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    
    console.log(`🎓 Processando treinamentos pendentes: "${text}"`);
    
    if (opcao === '1' || (opcao.toLowerCase().includes('fazer') && opcao.toLowerCase().includes('treinamento'))) {
        // Iniciar treinamentos
        console.log('🎓 Direcionando para treinamentos da empresa');
        
        // Buscar o primeiro treinamento pendente
        const treinamentos = dados.treinamentos || [];
        
        if (treinamentos.length > 0) {
            const primeiroTreinamento = treinamentos[0];
            console.log(`🎓 Iniciando treinamento: ${primeiroTreinamento.nome} (ID: ${primeiroTreinamento.id})`);
            
            // Verificar se é o treinamento EPC/EPI (ID 16)
            if (primeiroTreinamento.id === 16) {
                const epcEpi = require('../EPC_EPI/epc_epi');
                
                // Buscar dados do contato
                let contato = null;
                const formatosTelefone = [
                    sender,
                    sender.substring(2),
                    `${sender.substring(0, 4)}9${sender.substring(4)}`,
                    sender.length === 13 ? sender.substring(0, 4) + sender.substring(5) : sender,
                ];
                
                const { Usuario } = require('../../../BancoDeDados/models');
                for (const formato of formatosTelefone) {
                    contato = await Usuario.findOne({ where: { telefone: formato } });
                    if (contato) break;
                }
                
                if (contato) {
                    console.log(`🎓 Iniciando treinamento EPC/EPI para ${contato.nome}`);
                    // Adicionar número do telefone ao contato
                    contato.numero = sender.replace('@c.us', '');
                    
                    return await epcEpi.processarTreinamentoEpcEpi(sender, 'iniciar_treinamento', null, contato, sendMessage, null);
                }
            }
            
            // Para outros treinamentos (futuros)
            await sendMessage(sender, 'send-message', {
                message: `🎓 Iniciando treinamento: ${primeiroTreinamento.nome}\n\n⚠️ Este treinamento ainda está em desenvolvimento.\n\nEm breve estará disponível!`
            });
        } else {
            await sendMessage(sender, 'send-message', {
                message: '🎓 Nenhum treinamento pendente encontrado no momento.'
            });
        }
        
        await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
        
    } else if (opcao === '2' || (opcao.toLowerCase().includes('ferramenta') && opcao.toLowerCase().includes('funciona'))) {
        // Ver apresentação da ferramenta
        console.log('📱 Usuário quer ver apresentação mesmo com treinamentos pendentes');
        
        const ultimaInteracao = await obterUltimaInteracao(sender);
        const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
        
        // Salvar dados do contato na interação para uso posterior
        await salvarInteracao(sender, 'mostrar_recursos', JSON.stringify({ 
            etapa: 'mostrar_recursos',
            contato_id: dados.contato_id,
            nome: dados.nome || 'Usuário',
            empresa_id: dados.empresa_id,
            vem_de_treinamentos_pendentes: true,
            treinamentos_pendentes: dados.treinamentos // Manter referência aos treinamentos
        }));
        
        await mostrarComoFunciona(sender, dados.nome || 'Usuário', sendMessage);
        
    } else if (opcao === '3' || opcao.toLowerCase().includes('certificado')) {
        // Acessar certificados
        console.log('📜 Usuário quer acessar certificados');
        
        const { enviarCertificadosUsuario } = require('../../Template2');
        await enviarCertificadosUsuario(sender, sendMessage);
        
        // Não mudar etapa, manter em treinamentos_pendentes para continuar no menu
        return true;
        
    } else if (opcao === '4' || opcao.toLowerCase().includes('depois') || opcao.toLowerCase().includes('lembrar')) {
        // Lembrar depois
        await sendMessage(sender, 'send-message', {
            message: '😊 Perfeito! Vou te lembrar sobre seus treinamentos.\n\n📝 **Treinamentos pendentes salvos!**\n\nQuando quiser fazer, é só me mandar um "oi" que te direciono direto para eles.\n\n⏰ Não esqueça dos prazos!'
        });
        await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
        
    } else if (opcao === '5' || opcao.toLowerCase().includes('comercial')) {
        // Contato comercial
        await finalizarApresentacao(sender, sendMessage);
        
    } else {
        // Opção inválida
        const { gerarMenuTreinamentosPendentes } = require('../../Template2');
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta.' + gerarMenuTreinamentosPendentes()
        });
    }
    
    return true;
}

// ==================== CONTROLE DE PROGRESSO ====================

async function marcarProgressoEtapa(telefone, etapa) {
    try {
        const progressoAtual = await obterProgresso(telefone);
        console.log(`📋 Marcando progresso: ${etapa} para ${telefone}`);
        console.log(`📋 Progresso antes:`, progressoAtual);
        
        if (!progressoAtual.includes(etapa)) {
            progressoAtual.push(etapa);
            await salvarProgresso(telefone, progressoAtual);
            console.log(`✅ Progresso marcado: ${etapa} para ${telefone}`);
            console.log(`📋 Progresso depois:`, progressoAtual);
        } else {
            console.log(`🔄 Etapa ${etapa} já marcada para ${telefone}`);
        }
    } catch (error) {
        console.error('❌ Erro ao marcar progresso:', error);
    }
}

async function obterProgresso(telefone) {
    try {
        const interacao = await Interacao.findOne({
            where: { 
                telefone: telefone,
                tipo: 'progresso_treinamento'
            },
            order: [['createdAt', 'DESC']]
        });
        
        if (interacao) {
            const dados = JSON.parse(interacao.mensagem || '{}');
            return dados.etapas || [];
        }
        return [];
    } catch (error) {
        console.error('❌ Erro ao obter progresso:', error);
        return [];
    }
}

async function salvarProgresso(telefone, etapas) {
    try {
        await Interacao.create({
            telefone: telefone,
            tipo: 'progresso_treinamento',
            mensagem: JSON.stringify({ etapas: etapas })
        });
    } catch (error) {
        console.error('❌ Erro ao salvar progresso:', error);
    }
}

async function verificarProgressoCompleto(telefone) {
    const etapasObrigatorias = [
        'recursos_detalhados',
        'quando_onde', 
        'videos_exemplos'
    ];
    
    const progressoAtual = await obterProgresso(telefone);
    const faltando = etapasObrigatorias.filter(etapa => !progressoAtual.includes(etapa));
    
    console.log(`📋 [PROGRESSO] ===== VERIFICAÇÃO COMPLETA =====`);
    console.log(`📋 [PROGRESSO] Telefone: ${telefone}`);
    console.log(`📋 [PROGRESSO] Etapas obrigatórias:`, etapasObrigatorias);
    console.log(`📋 [PROGRESSO] Progresso atual:`, progressoAtual);
    console.log(`📋 [PROGRESSO] Etapas faltando:`, faltando);
    console.log(`📋 [PROGRESSO] Completo: ${faltando.length === 0}`);
    console.log(`📋 [PROGRESSO] ================================`);
    
    const nomeEtapas = {
        'recursos_detalhados': '• 📱 Recursos do WhatsApp',
        'quando_onde': '• ⏰ Quando e onde usar',
        'videos_exemplos': '• 🎥 Vídeos de exemplo'
    };
    
    // Forçar retorno de incompleto se qualquer etapa estiver faltando
    const resultado = {
        completo: faltando.length === 0,
        faltando: faltando.map(etapa => nomeEtapas[etapa]),
        proximaParte: faltando[0] || null
    };
    
    console.log(`📋 [PROGRESSO] Resultado final:`, resultado);
    return resultado;
}

async function processarPerguntaConteudoRestante(sender, text, sendMessage) {
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        // Mostrar conteúdo faltante
        await mostrarParteFaltante(sender, dados.proximaParte, sendMessage);
        return true;
    } else if (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('obrigado')) {
        // Usuário não quer ver o conteúdo
        await sendMessage(sender, 'send-message', {
            message: '😊 Tudo bem! Quando quiser ver o conteúdo completo e obter seu certificado, é só me mandar um "oi" que recomeçamos!'
        });
        await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
        return true;
    } else {
        // Resposta inválida
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta. Quer ver o restante do conteúdo para obter o certificado?\n\n1️⃣ Sim, quero ver o conteúdo\n2️⃣ Não, obrigado'
        });
        return true;
    }
}

async function mostrarParteFaltante(sender, parte, sendMessage) {
    const progressoAtual = await obterProgresso(sender);
    
    // Mostrar apenas a próxima parte que não foi vista
    if (parte === 'recursos_detalhados' && !progressoAtual.includes('recursos_detalhados')) {
        await mostrarRecursosDetalhados(sender, sendMessage);
    } else if (parte === 'quando_onde' && !progressoAtual.includes('quando_onde')) {
        await mostrarQuandoOnde(sender, sendMessage);
    } else if (parte === 'videos_exemplos' && !progressoAtual.includes('videos_exemplos')) {
        await enviarVideoTreinamentoMotorista(sender, sendMessage);
    } else {
        // Se a parte atual já foi vista, ir para a próxima
        const proximaParte = await obterProximaParteNaoVista(sender);
        if (proximaParte) {
            await mostrarParteFaltante(sender, proximaParte, sendMessage);
        } else {
            // Todas as partes foram vistas, ir para certificado
            await perguntarDadosCertificado(sender, sendMessage);
        }
    }
}

async function obterProximaParteNaoVista(sender) {
    const etapasObrigatorias = ['recursos_detalhados', 'quando_onde', 'videos_exemplos'];
    const progressoAtual = await obterProgresso(sender);
    
    for (const etapa of etapasObrigatorias) {
        if (!progressoAtual.includes(etapa)) {
            return etapa;
        }
    }
    return null;
}

// Função para limpar progresso anterior
async function limparProgressoAnterior(telefone) {
    try {
        // Deletar TODOS os registros de progresso anteriores
        await Interacao.destroy({
            where: {
                telefone: telefone,
                tipo: 'progresso_treinamento'
            }
        });
        console.log(`🧹 [PROGRESSO] Progresso anterior limpo para ${telefone}`);
    } catch (error) {
        console.error('❌ Erro ao limpar progresso anterior:', error);
    }
}

// ==================== FUNÇÕES AUXILIARES ====================

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
        const { Op } = require('sequelize');
        return await Interacao.findOne({
            where: { 
                telefone: telefone,
                tipo: { [Op.ne]: 'mensagem_usuario' }
            },
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

// Função para gerar certificado de visitante (sem cadastro no sistema)
async function gerarCertificadoVisitante(nome, email, cpf, sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '⏳ Gerando seu certificado...'
    });
    
    try {
        const certificadosModule = require('../../Certificados/certificados2');
        
        // Gerar certificado PDF com dados do visitante
        const caminhoArquivo = await certificadosModule.gerarCertificadoVisitante(nome, email, cpf, 15);
        
        if (!caminhoArquivo) {
            await sendMessage(sender, 'send-message', {
                message: '❌ Erro ao gerar certificado. Tente novamente.'
            });
            return;
        }
        
        // Enviar certificado diretamente por WhatsApp
        await sendMessage(sender, 'send-file', {
            path: caminhoArquivo,
            filename: `Certificado_${nome.replace(/\s+/g, '_')}.pdf`
        });
        
        await sendMessage(sender, 'send-message', {
            message: `✅ *CERTIFICADO GERADO COM SUCESSO!*\n\n📜 Seu certificado de **Treinamento de Apresentação** foi gerado e enviado acima.\n\n📝 *Dados do certificado:*\n👤 Nome: ${nome}\n🆔 CPF: ${cpf}\n📧 E-mail: ${email}\n\n📌 *Observação:* Este é um certificado de demonstração sem assinatura digital. Para certificados oficiais com assinatura digital e validade legal, faça seu cadastro completo em: https://abrir.link/ZEeCt`
        });
        
    } catch (error) {
        console.error('❌ Erro ao gerar certificado visitante:', error);
        await sendMessage(sender, 'send-message', {
            message: '❌ Erro interno ao gerar certificado. Tente novamente mais tarde.'
        });
    }
    
    setTimeout(async () => {
        await mostrarOutrasAplicacoes(sender, sendMessage);
    }, 1000);
}

// ==================== EXPORTS ====================

module.exports = {
    processarRespostaApresentacao,
    iniciarTreinamentoApresentacao,
    mostrarComoFunciona,
    verificarTreinamentosEmpresa,
    direcionarParaTreinamentos,
    verificarProgressoCompleto,
    gerarEEnviarCertificado
};