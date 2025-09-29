const { Contato, Interacao } = require('../../../BancoDeDados/models');

// ==================== FUNÇÃO PRINCIPAL ====================

async function processarRespostaApresentacao(sender, text, selectedId, contato, sendMessage) {
    console.log(`🎯 Processando resposta: "${text}" de ${sender}`);
    
    // Verificar se é uma saudação para reiniciar o fluxo
    const saudacoes = ['olá', 'oi', 'ola', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'];
    const ehSaudacao = saudacoes.some(s => text.toLowerCase().includes(s));
    
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    // Se é saudação OU conversa foi finalizada, reiniciar
    if (ehSaudacao || !ultimaInteracao || (ultimaInteracao && JSON.parse(ultimaInteracao.mensagem || '{}').etapa === 'finalizado')) {
        console.log('🎆 REINICIANDO FLUXO - Saudação detectada ou conversa finalizada');
        return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
    
    // Se há interação anterior, processar baseado no estado
    if (ultimaInteracao) {
        return await processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage);
    }
    
    // Se não há interação anterior, iniciar fluxo
    return await iniciarFluxoBoasVindas(sender, sendMessage);
}

async function processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage) {
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const etapa = dados.etapa;
    
    console.log(`🎯 Etapa atual: ${etapa}`);
    console.log(`📝 Text: "${text}", SelectedId: "${selectedId}"`);
    
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
        case 'testes_avaliacoes':
            console.log('📝 Entrando em processarTestesAvaliacoes');
            return await processarTestesAvaliacoes(sender, text, selectedId, sendMessage);
        case 'perguntar_quando_onde':
            return await processarPerguntaQuandoOnde(sender, text, sendMessage);
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

// ==================== FLUXO INICIAL ====================

async function iniciarFluxoBoasVindas(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '👋 Olá! Seja bem-vindo(a) ao futuro dos treinamentos normativos.\nEu sou a Eliza, a sua assistente virtual \nJá imaginou fazer um curso oficial de saúde e segurança direto pelo WhatsApp? 📱\n👉 Quer que eu te mostre como funciona?\n1️⃣ Sim, quero conhecer!\n2️⃣ Não, obrigado.'
    });
    
    await salvarInteracao(sender, 'aguardando_opcao_inicial', JSON.stringify({ etapa: 'opcao_inicial' }));
    return true;
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
                
                await sendMessage(sender, 'send-file', {
                    path: gifPath,
                    filename: 'gatinho-porfavor.gif'
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
                    caption: '📹 *Vídeos curtos*'
                });
                console.log('✅ Vídeo enviado com sucesso');
            }
            
            // 2. Enviar imagem após o vídeo
            setTimeout(async () => {
                const imagePath = path.join(__dirname, 'material_apresentacao', 'Imagens', 'Vantagens.png');
                if (fs.existsSync(imagePath)) {
                    await sendMessage(sender, 'send-image', {
                        path: imagePath,
                        caption: '🖼️ *Imagens e infográficos*'
                    });
                    console.log('✅ Imagem enviada com sucesso');
                }
                
                await sendMessage(sender, 'send-message', {     
                    message: ''
                });
                await sendMessage(sender, 'send-message', {
                    message: '• 🎤 *Áudios explicativos*\nÁudio com o texto: Já imaginou fazermos um treinamento interativo, simples, com linguagem clara e cheio de Interação? É isso que você terá a oportunidade de participar com os treinamentos normativos no WhatsApp'
                });
                
                // 3. Enviar áudio diretamente
                setTimeout(async () => {
                    const audioPath = path.join(__dirname, 'material_apresentacao', 'audios', 'Audio_texto01.mp3');
                    console.log(`🎵 Tentando enviar áudio: ${audioPath}`);
                    
                    if (fs.existsSync(audioPath)) {
                        await sendMessage(sender, 'send-file', {
                            path: audioPath,
                            filename: 'audio.mp3',
                            caption: ' Áudios explicativos'
                        });
                        console.log('✅ Áudio enviado com sucesso');
                    } else {
                        console.log('❌ Arquivo de áudio não encontrado');
                    }
                    
                    // 4. Enviar testes IMEDIATAMENTE após o áudio
                    console.log('📝 EXECUTANDO: Enviando testes e avaliações');
                    await sendMessage(sender, 'send-message', {
                        message: '• 📝 Testes e avaliações'
                    });
                    
                    console.log('📝 EXECUTANDO: Enviando lista de testes');
                    try {
                        await sendMessage(sender, 'send-list-message', {
                            title: '',
                            description: 'Você concorda em realizar treinamentos normativos no WhatsApp em sua empresa? (Texto, também em áudio)',
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
                        console.log('✅ SUCESSO: Lista de testes enviada');
                        await salvarInteracao(sender, 'testes_avaliacoes', JSON.stringify({ etapa: 'testes_avaliacoes' }));
                    } catch (error) {
                        console.error('❌ ERRO: Falha ao enviar lista:', error);
                        await sendMessage(sender, 'send-message', {
                            message: 'Você concorda em realizar treinamentos normativos no WhatsApp em sua empresa?\n\n1️⃣ SIM\n2️⃣ COM CERTEZA'
                        });
                        await salvarInteracao(sender, 'testes_avaliacoes', JSON.stringify({ etapa: 'testes_avaliacoes' }));
                    }
                }, 1500);
                
                // Aguardar interação do usuário com a lista - NÃO continuar automaticamente
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro ao enviar arquivos:', error);
            // Em caso de erro, ainda aguardar interação do usuário
        }
    }, 1500);
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
                    caption: '☕ No intervalo do café'
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
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        await enviarVideoTreinamentoMotorista(sender, sendMessage);
    } else {
        await finalizarApresentacao(sender, sendMessage);
    }
    
    return true;
}

// ==================== COMPRESSÃO DE VÍDEO ====================

const VIDEO_CONFIG = require('./videoConfig');
const { limparVideosComprimidos, verificarFFmpeg } = require('./videoUtils');
const { enviarVideoBase64, enviarVideoEmPartes } = require('./videoFallback');

// Limpar vídeos comprimidos antigos na inicialização
limparVideosComprimidos();

// Verificar se FFmpeg está disponível
const FFMPEG_DISPONIVEL = verificarFFmpeg();

async function comprimirVideo(inputPath, outputPath, useHeavyCompression = false) {
    const ffmpeg = require('fluent-ffmpeg');
    
    // Verificar se FFmpeg está disponível
    if (!verificarFFmpeg()) {
        throw new Error('FFmpeg não está disponível');
    }
    
    const config = useHeavyCompression ? VIDEO_CONFIG.HEAVY_COMPRESSION : VIDEO_CONFIG.COMPRESSION;
    
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec(config.videoCodec)
            .audioCodec(config.audioCodec)
            .size(config.size)
            .videoBitrate(config.videoBitrate)
            .audioBitrate(config.audioBitrate)
            .format(config.format)
            .save(outputPath)
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`🔄 Comprimindo: ${Math.round(progress.percent)}%`);
                }
            })
            .on('end', () => {
                console.log('✅ Vídeo comprimido com sucesso');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('❌ Erro na compressão:', err);
                reject(err);
            });
    });
}

async function enviarVideoTreinamentoMotorista(sender, sendMessage) {
    try {
        const path = require('path');
        const fs = require('fs');
        
        const videoPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'treinamento-motorista.mp4');
        const compressedPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'compressed_treinamento-motorista.mp4');
        
        console.log(`🎥 Tentando enviar vídeo: ${videoPath}`);
        
        if (fs.existsSync(videoPath)) {
            const stats = fs.statSync(videoPath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            
            console.log(`📄 Tamanho do vídeo original: ${fileSizeInMB.toFixed(2)}MB`);
            
            if (fileSizeInMB > VIDEO_CONFIG.MAX_SIZE_MB) {
                console.log(`🔄 Vídeo muito grande (${fileSizeInMB.toFixed(2)}MB), comprimindo...`);
                
                try {
                    // Tentar compressão normal primeiro
                    await comprimirVideo(videoPath, compressedPath, false);
                    
                    let compressedStats = fs.statSync(compressedPath);
                    let compressedSizeMB = compressedStats.size / (1024 * 1024);
                    
                    // Se ainda estiver muito grande, tentar compressão pesada
                    if (compressedSizeMB > VIDEO_CONFIG.MAX_SIZE_MB) {
                        console.log(`🔄 Ainda muito grande (${compressedSizeMB.toFixed(2)}MB), aplicando compressão pesada...`);
                        const heavyCompressedPath = compressedPath.replace('.mp4', '_heavy.mp4');
                        
                        await comprimirVideo(videoPath, heavyCompressedPath, true);
                        
                        compressedStats = fs.statSync(heavyCompressedPath);
                        compressedSizeMB = compressedStats.size / (1024 * 1024);
                        
                        if (compressedSizeMB <= VIDEO_CONFIG.MAX_SIZE_MB) {
                            console.log(`✅ Vídeo comprimido para ${compressedSizeMB.toFixed(2)}MB`);
                            
                            await sendMessage(sender, 'send-file', {
                                path: heavyCompressedPath,
                                filename: 'treinamento-motorista.mp4',
                                caption: '🎥 Exemplo prático: Treinamento para motoristas'
                            });
                        } else {
                            throw new Error('Vídeo ainda muito grande após compressão pesada');
                        }
                    } else {
                        console.log(`✅ Vídeo comprimido para ${compressedSizeMB.toFixed(2)}MB`);
                        
                        await sendMessage(sender, 'send-file', {
                            path: compressedPath,
                            filename: 'treinamento-motorista.mp4',
                            caption: '🎥 Exemplo prático: Treinamento para motoristas'
                        });
                    }
                    
                } catch (compressionError) {
                    console.error('❌ Erro na compressão, enviando mensagem alternativa:', compressionError);
                    await sendMessage(sender, 'send-message', {
                        message: '🎥 *Exemplo prático: Treinamento para motoristas*\n\n🚗 Nossos treinamentos incluem:\n• Vídeos explicativos\n• Simulações práticas\n• Testes interativos\n• Certificado válido\n\n📱 Tudo direto no WhatsApp!'
                    });
                }
            } else {
                console.log('✅ Vídeo dentro do limite, enviando diretamente');
                try {
                    await sendMessage(sender, 'send-file', {
                        path: videoPath,
                        filename: 'treinamento-motorista.mp4',
                        caption: '🎥 Exemplo prático: Treinamento para motoristas'
                    });
                } catch (sendError) {
                    console.error('❌ Erro ao enviar vídeo diretamente, tentando base64:', sendError);
                    
                    const sucessoBase64 = await enviarVideoBase64(
                        sender, 
                        sendMessage, 
                        videoPath, 
                        '🎥 Exemplo prático: Treinamento para motoristas',
                        'treinamento-motorista.mp4'
                    );
                    
                    if (!sucessoBase64) {
                        await sendMessage(sender, 'send-message', {
                            message: '🎥 *Exemplo prático: Treinamento para motoristas*\n\n🚗 Nossos treinamentos incluem:\n• Vídeos explicativos\n• Simulações práticas\n• Testes interativos\n• Certificado válido\n\n📱 Tudo direto no WhatsApp!'
                        });
                    }
                }
            }
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
        const compressedPath = path.join(__dirname, 'material_apresentacao', 'Videos', 'compressed_terceiros.mp4');
        
        console.log(`🎥 Tentando enviar vídeo de terceiros: ${videoPath}`);
        
        if (fs.existsSync(videoPath)) {
            const stats = fs.statSync(videoPath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            
            console.log(`📄 Tamanho do vídeo terceiros: ${fileSizeInMB.toFixed(2)}MB`);
            
            if (fileSizeInMB > VIDEO_CONFIG.MAX_SIZE_MB) {
                console.log(`🔄 Vídeo de terceiros muito grande (${fileSizeInMB.toFixed(2)}MB), comprimindo...`);
                
                try {
                    // Tentar compressão normal primeiro
                    await comprimirVideo(videoPath, compressedPath, false);
                    
                    let compressedStats = fs.statSync(compressedPath);
                    let compressedSizeMB = compressedStats.size / (1024 * 1024);
                    
                    // Se ainda estiver muito grande, tentar compressão pesada
                    if (compressedSizeMB > VIDEO_CONFIG.MAX_SIZE_MB) {
                        console.log(`🔄 Ainda muito grande (${compressedSizeMB.toFixed(2)}MB), aplicando compressão pesada...`);
                        const heavyCompressedPath = compressedPath.replace('.mp4', '_heavy.mp4');
                        
                        await comprimirVideo(videoPath, heavyCompressedPath, true);
                        
                        compressedStats = fs.statSync(heavyCompressedPath);
                        compressedSizeMB = compressedStats.size / (1024 * 1024);
                        
                        if (compressedSizeMB <= VIDEO_CONFIG.MAX_SIZE_MB) {
                            console.log(`✅ Vídeo de terceiros comprimido para ${compressedSizeMB.toFixed(2)}MB`);
                            
                            await sendMessage(sender, 'send-file', {
                                path: heavyCompressedPath,
                                filename: 'treinamento-terceiros.mp4',
                                caption: '🎥 Exemplo prático: Treinamento de Terceiros'
                            });
                        } else {
                            throw new Error('Vídeo ainda muito grande após compressão pesada');
                        }
                    } else {
                        console.log(`✅ Vídeo de terceiros comprimido para ${compressedSizeMB.toFixed(2)}MB`);
                        
                        await sendMessage(sender, 'send-file', {
                            path: compressedPath,
                            filename: 'treinamento-terceiros.mp4',
                            caption: '🎥 Exemplo prático: Treinamento de Terceiros'
                        });
                    }
                    
                } catch (compressionError) {
                    console.error('❌ Erro na compressão do vídeo de terceiros, enviando mensagem alternativa:', compressionError);
                    await sendMessage(sender, 'send-message', {
                        message: '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!'
                    });
                }
            } else {
                console.log('✅ Vídeo de terceiros dentro do limite, enviando diretamente');
                await sendMessage(sender, 'send-file', {
                    path: videoPath,
                    filename: 'treinamento-terceiros.mp4',
                    caption: '🎥 Exemplo prático: Treinamento de Terceiros'
                });
            }
        } else {
            console.log('❌ Arquivo de vídeo de terceiros não encontrado, enviando mensagem alternativa');
            await sendMessage(sender, 'send-message', {
                message: '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!'
            });
        }
        
        setTimeout(async () => {
            await mostrarOutrasAplicacoes(sender, sendMessage);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao processar vídeo de terceiros:', error);
        await sendMessage(sender, 'send-message', {
            message: '🎥 *Exemplo prático: Treinamento de Terceiros*\n\n👥 Integração de terceiros via WhatsApp:\n• Cadastro automático\n• Treinamentos obrigatórios\n• Controle de acesso\n• Certificados digitais\n\n📱 Tudo integrado no WhatsApp!'
        });
        await mostrarOutrasAplicacoes(sender, sendMessage);
    }
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
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim')) {
        await finalizarApresentacao(sender, sendMessage);
    } else {
        await sendMessage(sender, 'send-message', {
            message: '😊 Obrigada pelo seu tempo! Se mudar de ideia, é só me mandar um "oi" que recomeçamos!'
        });
        await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
    }
    
    return true;
}

// ==================== FINALIZAÇÃO ====================

async function finalizarApresentacao(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🎉 *Perfeito!*\n\nNosso time comercial entrará em contato com você em breve para apresentar as soluções personalizadas para sua empresa.\n\n📞 *Contato:* (11) 99999-9999\n📧 *E-mail:* comercial@empresa.com\n\n🚀 Obrigada por conhecer o futuro dos treinamentos normativos!'
    });
    
    await salvarInteracao(sender, 'contato_comercial', JSON.stringify({ etapa: 'finalizado' }));
}





async function processarContatoComercial(sender, text, sendMessage) {
    // Verificar se é uma saudação para reiniciar
    const saudacoes = ['olá', 'oi', 'ola', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'];
    const ehSaudacao = saudacoes.some(s => text.toLowerCase().includes(s));
    
    if (ehSaudacao) {
        return await iniciarFluxoBoasVindas(sender, sendMessage);
    }
    
    // Para outras mensagens, apenas responder que a conversa foi finalizada
    await sendMessage(sender, 'send-message', {
        message: '😊 Obrigada pelo interesse! Se quiser conversar novamente, é só me mandar um "oi" que recomeçamos!'
    });
    return true;
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