const { Contato, Interacao } = require('../../../BancoDeDados/models');
const { gerarCertificado } = require('../../Certificados/gerarCertificado');

// ==================== FUNÇÃO PRINCIPAL ====================

async function processarRespostaApresentacao(sender, text, selectedId, contato, sendMessage, buscarContato = null) {
    console.log(`🎯 Processando resposta: "${text}" de ${sender}`);
    
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    // Se conversa foi finalizada OU não há interação anterior, reiniciar
    if (!ultimaInteracao || (ultimaInteracao && JSON.parse(ultimaInteracao.mensagem || '{}').etapa === 'finalizado')) {
        console.log('🎆 REINICIANDO FLUXO - Conversa finalizada ou primeira interação');
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
        case 'contato_comercial':
            return await processarContatoComercial(sender, text, sendMessage);
        case 'finalizando':
            console.log('🔄 Ignorando mensagem - finalização já em andamento');
            return true;
        default:
            return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
}

// ==================== FLUXO INICIAL ====================

async function iniciarFluxoBoasVindas(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '👋 Olá! Seja bem-vindo(a) ao futuro dos treinamentos normativos.\nEu sou a Eliza, a sua assistente virtual \nJá imaginou fazer um curso oficial de saúde e segurança direto pelo WhatsApp? 📱\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
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
            await sendMessage(sender, 'send-message', {
                message: '🤔 Hum, que tal fazer o seu cadastro na nossa plataforma antes, hein?\nÉ muito simples, basta clicar no link abaixo e assim que finalizar é só voltar aqui e me envie qualquer mensagem para começarmos!\n\nhttps://abrir.link/ZEeCt\n\nATENÇÃO:\nNo Cadastro use o MESMO NÚMERO que você utilizará para conversar aqui comigo.\n\n💡 Caso tenha feito cadastro com um número diferente desse, basta acessar novamente o painel de cadastro, rolar a tela até o final e acessar os seus dados para realizar a edição do número.'
            });
            await salvarInteracao(sender, 'aguardando_cadastro', JSON.stringify({ etapa: 'aguardando_cadastro' }));
        } else {
            console.log(`🎉 USUÁRIO CADASTRADO: ${contato.nome} - Prosseguindo automaticamente`);
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
    
    await sendMessage(sender, 'send-message', {
        message: 'Por favor, escolha uma das opções:\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    return true;
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
        await mostrarComoFunciona(sender, contato.nome, sendMessage);
        return true;
    } else {
        await sendMessage(sender, 'send-message', {
            message: '🤔 Parece que você ainda não finalizou o cadastro. Após se cadastrar, volte aqui e me envie qualquer mensagem!\n\nhttps://abrir.link/ZEeCt'
        });
        return true;
    }
}

// ==================== APRESENTAÇÃO DOS RECURSOS ====================

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
    const opcao = text.trim().toLowerCase();
    
    console.log(`🎯 Processando mostrar recursos: "${text}" -> "${opcao}"`);
    
    if (opcao === '1' || opcao.includes('sim, mostra')) {
        console.log('✅ Mostrando recursos detalhados');
        await mostrarRecursosDetalhados(sender, sendMessage);
    } else if (opcao === '2' || opcao.includes('pula')) {
        console.log('✅ Pulando recursos - indo para exemplos');
        await mostrarExemplosTrainamentos(sender, sendMessage);
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
                await sendMessage(sender, 'send-video', {
                    path: videoPath,
                    caption: '📹 *Vídeos curtos*'
                });
            }
            
            // 2. Enviar imagem
            setTimeout(async () => {
                const imagePath = path.join(__dirname, 'material_apresentacao', 'Imagens', 'Vantagens.png');
                if (fs.existsSync(imagePath)) {
                    await sendMessage(sender, 'send-image', {
                        path: imagePath,
                        caption: '🖼️ *Imagens e infográficos*'
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
                            await sendMessage(sender, 'send-file', {
                                path: audioPath,
                                filename: 'audio.mp3'
                            });
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
    const opcao = text.trim();
    console.log(`📝 Processando resposta dos testes: "${opcao}", selectedId: "${selectedId}"`);
    
    // Processar tanto texto quanto selectedId
    if (selectedId === 'sim_concordo' || selectedId === 'com_certeza' || opcao === '1' || opcao === '2' || opcao.toLowerCase().includes('sim') || opcao.toLowerCase().includes('certeza')) {
        console.log('✅ Resposta positiva detectada - continuando fluxo');
    }
    
    // Independente da resposta, vai para a próxima pergunta
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
        await mostrarExemplosTrainamentos(sender, sendMessage);
    } else {
        console.log('❌ Opção inválida - reenviando');
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Quero sim.\n2️⃣ Vamos direto para exemplos de treinamentos.'
        });
    }
    
    return true;
}

async function mostrarQuandoOnde(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '⏰ *Você pode fazer o curso:*'
    });

    setTimeout(async () => {
        try {
            const path = require('path');
            const fs = require('fs');
            
            // 1. Enviar imagem da moça no café
            const imagemCafe = path.join(__dirname, 'material_apresentacao', 'Imagens', 'nocafe.png');
            if (fs.existsSync(imagemCafe)) {
                await sendMessage(sender, 'send-image', {
                    path: imagemCafe,
                    caption: '☕ Quando estiver tomando um cafezinho'
                });
            }
            
            // 2. Enviar imagem do cara no ônibus
            setTimeout(async () => {
                const imagemMetro = path.join(__dirname, 'material_apresentacao', 'Imagens', 'nometro.png');
                if (fs.existsSync(imagemMetro)) {
                    await sendMessage(sender, 'send-image', {
                        path: imagemMetro,
                        caption: '🚎 No ônibus ou metrô'
                    });
                }
            }, 1000);
            
            // 3. Enviar imagem do trabalho
            setTimeout(async () => {
                const imagemTrabalho = path.join(__dirname, 'material_apresentacao', 'Imagens', 'notrabalho.png');
                if (fs.existsSync(imagemTrabalho)) {
                    await sendMessage(sender, 'send-image', {
                        path: imagemTrabalho,
                        caption: '🌍 Em qualquer lugar, a qualquer hora'
                    });
                }
            }, 2000);
            
            // 4. Enviar mensagem após as imagens
            setTimeout(async () => {
                await sendMessage(sender, 'send-message', {
                    message: 'Tudo com registro, certificado e validade normativa.'
                });
            }, 3000);
            
            // 5. Enviar áudio após a mensagem
            setTimeout(async () => {
                const audioPath = path.join(__dirname, 'material_apresentacao', 'audios', 'norma-atendida.mp3');
                if (fs.existsSync(audioPath)) {
                    await sendMessage(sender, 'send-file', {
                        path: audioPath,
                        filename: 'norma-atendida.mp3',
                        caption: ' Validade normativa'
                    });
                    console.log('✅ Áudio norma-atendida enviado com sucesso');
                } else {
                    console.log('❌ Arquivo de áudio norma-atendida não encontrado');
                }
                
                // 6. Após o áudio, continuar automaticamente para exemplos
                setTimeout(async () => {
                    await mostrarExemplosTrainamentos(sender, sendMessage);
                }, 2000);
            }, 4000);
            
        } catch (error) {
            console.error('❌ Erro ao enviar imagens:', error);
        }
    }, 500);
    

}

// ==================== EXEMPLOS DE TREINAMENTOS ====================

async function mostrarExemplosTrainamentos(sender, sendMessage) {
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
        console.log('✅ Opção 2 selecionada - finalizando');
        await finalizarApresentacao(sender, sendMessage);
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
    try {
        const path = require('path');
        const fs = require('fs');
        
        const videoPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'treinamento-motorista.mp4');
        console.log(`🎥 Tentando enviar vídeo: ${videoPath}`);
        
        if (fs.existsSync(videoPath)) {
            await sendMessage(sender, 'send-video', {
                path: videoPath,
                caption: '🎥 Exemplo prático: Treinamento para motoristas'
            });
            console.log('✅ Vídeo de motoristas enviado com sucesso');
        } else {
            console.log('❌ Arquivo de vídeo não encontrado, enviando mensagem alternativa');
            await sendMessage(sender, 'send-message', {
                message: '🎥 *Exemplo prático: Treinamento para motoristas*\n\n🚗 Nossos treinamentos incluem:\n• Vídeos explicativos\n• Simulações práticas\n• Testes interativos\n• Certificado válido\n\n📱 Tudo direto no WhatsApp!'
            });
        }

        
        // Enviar segundo vídeo após o primeiro
        setTimeout(async () => {
            await enviarVideoTreinamentoTerceiros(sender, sendMessage);
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erro ao processar vídeo:', error);
        await sendMessage(sender, 'send-message', {
            message: '🎥 *Exemplo prático: Treinamento para motoristas*\n\n🚗 Nossos treinamentos incluem:\n• Vídeos explicativos\n• Simulações práticas\n• Testes interativos\n• Certificado válido\n\n📱 Tudo direto no WhatsApp!'
        });
        await mostrarOutrasAplicacoes(sender, sendMessage);
    }
}

async function enviarVideoTreinamentoTerceiros(sender, sendMessage) {
    try {
        const path = require('path');
        const fs = require('fs');
        
        const videoPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'Treinamento de Terceiros via WhatsApp.mp4');
        console.log(`🎥 Tentando enviar vídeo de terceiros: ${videoPath}`);
        
        if (fs.existsSync(videoPath)) {
            await sendMessage(sender, 'send-video', {
                path: videoPath,
                caption: '🎥 Exemplo prático: Treinamento de Terceiros'
            });
            console.log('✅ Vídeo de terceiros enviado com sucesso');
        } else {
            console.log('❌ Arquivo de vídeo de terceiros não encontrado, enviando mensagem alternativa');
            await sendMessage(sender, 'send-message', {
                message: '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!'
            });
        }

        
        setTimeout(async () => {
            await perguntarDadosCertificado(sender, sendMessage);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao processar vídeo de terceiros:', error);
        await sendMessage(sender, 'send-message', {
            message: '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!'
        });
        await perguntarDadosCertificado(sender, sendMessage);
    }
}

// ==================== CONFIRMAÇÃO DE DADOS PARA CERTIFICADO ====================

async function perguntarDadosCertificado(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: "🎓 Certificados também podem ser gerados automaticamente após o treinamento!"
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
            contato = await Contato.findOne({ where: { telefone: formato } });
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
                    message: `🎓 *Certificado de Participação*\n\nDados cadastrados no sistema:\n\n👤 *Nome:* ${nome}\n📧 *E-mail:* ${email}\n\nEstão corretos?\n\n1️⃣ Sim, estão corretos\n2️⃣ Não, quero corrigir`
                });
                await salvarInteracao(sender, 'confirmar_dados_certificado', JSON.stringify({ 
                    etapa: 'confirmar_dados_certificado', 
                    nome: nome, 
                    email: email 
                }));
                return;
            }
        }
        
        // Se não encontrou contato ou dados estão incompletos
        await sendMessage(sender, 'send-message', {
            message: '🎓 *Certificado de Participação*\n\nPara emitir seu certificado, preciso de alguns dados:\n\n📝 Por favor, envie:\n\n*Nome completo:* (como deve aparecer no certificado)\n*E-mail:* (para envio do certificado)\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
        });
        await salvarInteracao(sender, 'confirmar_dados_certificado', JSON.stringify({ etapa: 'confirmar_dados_certificado' }));
        
    } catch (error) {
        console.error('❌ Erro ao buscar contato:', error);
        await sendMessage(sender, 'send-message', {
            message: '🎓 *Certificado de Participação*\n\nPara emitir seu certificado, preciso de alguns dados:\n\n📝 Por favor, envie:\n\n*Nome completo:* (como deve aparecer no certificado)\n*E-mail:* (para envio do certificado)\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
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
            message: '📝 Por favor, envie os dados corretos:\n\n*Nome completo:* (como deve aparecer no certificado)\n*E-mail:* (para envio do certificado)\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
        });
        await salvarInteracao(sender, 'confirmar_dados_certificado', JSON.stringify({ etapa: 'confirmar_dados_certificado' }));
        return true;
    }
    
    // Processar dados informados manualmente
    const linhas = text.trim().split('\n').filter(linha => linha.trim());
    
    if (linhas.length >= 2) {
        const nome = linhas[0].trim();
        const email = linhas[1].trim();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await sendMessage(sender, 'send-message', {
                message: '❌ E-mail inválido. Por favor, envie novamente:\n\n*Nome completo:*\n*E-mail válido:*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
            });
            return true;
        }
        
        await gerarEEnviarCertificado(nome, email, sender, sendMessage);
    } else {
        await sendMessage(sender, 'send-message', {
            message: '❌ Dados incompletos. Por favor, envie:\n\n*Nome completo:*\n*E-mail:*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
        });
    }
    
    return true;
}

async function gerarEEnviarCertificado(nome, email, sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '⏳ Gerando seu certificado...'
    });
    
    try {
        const resultado = await gerarCertificado(nome, email, sendMessage, sender);
        
        if (resultado.sucesso) {
            await sendMessage(sender, 'send-message', {
                message: `✅ *Certificado gerado com sucesso!*\n\n📧 Enviado para: ${email}\n📱 Também enviado aqui no chat\n\n⚠️ *IMPORTANTE:* Este certificado é apenas demonstrativo e não possui validade legal para treinamentos normativos ou conformidade regulatória.`
            });
            

        } else {
            await sendMessage(sender, 'send-message', {
                message: `❌ Erro ao gerar certificado: ${resultado.erro}`
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
        await sendMessage(sender, 'send-message', {
            message: 'Agora que você já viu tudo, quer conversar com nosso time comercial?\n\n1️⃣ Sim, quero mais informações!\n2️⃣ Não, obrigado.'
        });
        await salvarInteracao(sender, 'outras_aplicacoes', JSON.stringify({ etapa: 'outras_aplicacoes' }));
    }, 1000);
}

async function processarOutrasAplicacoes(sender, text, sendMessage) {
    const opcao = text.trim().toLowerCase();
    
    console.log(`📊 Processando outras aplicações: "${text}" -> "${opcao}"`);
    
    if (opcao === '1' || opcao.includes('sim, quero') || opcao.includes('mais informações')) {
        console.log('✅ Finalizando apresentação - contato comercial');
        await finalizarApresentacao(sender, sendMessage);
    } else if (opcao === '2' || opcao.includes('não, obrigado') || opcao.includes('obrigado')) {
        console.log('✅ Usuário não quer contato comercial');
        await sendMessage(sender, 'send-message', {
            message: '😊 Obrigada pelo seu tempo! Se mudar de ideia, é só me mandar um "oi" que recomeçamos!'
        });
        await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
    } else {
        console.log('❌ Opção inválida - reenviando');
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Sim, quero mais informações!\n2️⃣ Não, obrigado.'
        });
    }
    
    return true;
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
            message: '🎉 *Perfeito!*\n\nVou te conectar com nosso time comercial agora mesmo!\n\n👉 Clique no link abaixo para falar diretamente com nossa equipe:\n\nhttps://wa.me/553131669006?text=Ol%C3%A1%2C%20vim%20do%20bot%20da%20Eliza%20e%20quero%20saber%20mais%20sobre%20os%20treinamentos%20normativos%20no%20WhatsApp\n\n📞 *Ou ligue:* (31) 3166-9006\n📧 *E-mail:* treinamentos@salubrita.com.br\n\n🚀 Obrigada por conhecer o futuro dos treinamentos normativos!'
        });
        
        await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
    }, 1000);
}





async function processarContatoComercial(sender, text, sendMessage) {
    // Qualquer mensagem reinicia o fluxo
    return await iniciarFluxoBoasVindas(sender, sendMessage);
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

// ==================== EXPORTS ====================

module.exports = {
    processarRespostaApresentacao,
    iniciarTreinamentoApresentacao
};