const { Contato, Interacao, ContatoTreinamentos } = require('../../../BancoDeDados/models');
const { gerarCertificado } = require('../../Certificados/gerarCertificado');
const { encurtarNome } = require('../../utils/formatarNome');

// ID do treinamento EPC/EPI no sistema
const TREINAMENTO_ID = 16;
const NOME_TREINAMENTO = 'NR6 - EPC e EPI - Uso, Guarda e Conservação';

// ==================== FUNÇÃO PRINCIPAL ====================

async function processarTreinamentoEpcEpi(sender, text, selectedId, contato, sendMessage, buscarContato = null) {
    console.log(`🎯 [EPC_EPI] Processando resposta: "${text}" de ${sender}`);
    
    const ultimaInteracao = await obterUltimaInteracao(sender);
    
    // Se não há interação anterior, iniciar treinamento
    if (!ultimaInteracao) {
        console.log('🎆 PRIMEIRA INTERAÇÃO - Iniciando treinamento EPC/EPI');
        return await iniciarTreinamento(sender, contato, sendMessage);
    }
    
    // Se há interação anterior, processar baseado no estado
    if (ultimaInteracao) {
        return await processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage, buscarContato);
    }
    
    return await iniciarTreinamento(sender, contato, sendMessage);
}

async function processarEstadoAtual(sender, text, selectedId, contato, ultimaInteracao, sendMessage, buscarContato = null) {
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const etapa = dados.etapa;
    
    console.log(`🎯 Etapa atual EPC/EPI: ${etapa}`);
    console.log(`📝 Text: "${text}", SelectedId: "${selectedId}"`);
    
    switch (etapa) {
        case 'introducao':
            return await processarIntroducao(sender, text, sendMessage);
        case 'definicoes':
            return await processarDefinicoes(sender, text, sendMessage);
        case 'tipos_epc':
            return await processarTiposEpc(sender, text, sendMessage);
        case 'tipos_epi':
            return await processarTiposEpi(sender, text, sendMessage);
        case 'uso_correto':
            return await processarUsoCorreto(sender, text, sendMessage);
        case 'manutencao':
            return await processarManutencao(sender, text, sendMessage);
        case 'responsabilidades':
            return await processarResponsabilidades(sender, text, sendMessage);
        case 'avaliacao_final':
            return await processarAvaliacaoFinal(sender, text, selectedId, sendMessage);
        case 'confirmar_dados_certificado':
            return await processarConfirmacaoDados(sender, text, sendMessage);
        case 'finalizado':
            console.log('🔄 Treinamento finalizado');
            return true;
        default:
            console.log(`⚠️ Etapa desconhecida: ${etapa} - Reiniciando treinamento`);
            return await iniciarTreinamento(sender, contato, sendMessage);
    }
}

// ==================== INÍCIO DO TREINAMENTO ====================

async function iniciarTreinamento(sender, contato, sendMessage) {
    const nomeContato = encurtarNome(contato.nome || contato.nomeCompleto);
    
    await sendMessage(sender, 'send-message', {
        message: `🎓 *Treinamento NR6 - EPC e EPI*\n\nOlá ${nomeContato}! Bem-vindo ao treinamento sobre Equipamentos de Proteção Coletiva (EPC) e Equipamentos de Proteção Individual (EPI).\n\n🎯 *Objetivo:*\nAprender sobre uso, guarda e conservação de EPCs e EPIs conforme a NR6.\n\n⏱️ *Duração estimada:* 15-20 minutos\n\n👉 Vamos começar?\n\n1️⃣ Sim, vamos começar!\n2️⃣ Não, quero sair`
    });
    
    await salvarInteracao(sender, 'epc_epi_introducao', JSON.stringify({ 
        etapa: 'introducao',
        treinamento_id: TREINAMENTO_ID,
        contato_id: contato.id,
        nome: nomeContato
    }));
    
    return true;
}

async function processarIntroducao(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim') || opcao.toLowerCase().includes('começar')) {
        await mostrarDefinicoes(sender, sendMessage);
    } else if (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('sair')) {
        await sendMessage(sender, 'send-message', {
            message: '😊 Tudo bem! Quando quiser fazer o treinamento, é só me avisar.\n\nLembre-se: este treinamento é obrigatório para sua segurança!'
        });
        await salvarInteracao(sender, 'epc_epi_finalizado', JSON.stringify({ etapa: 'finalizado' }));
    } else {
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua resposta. Por favor, escolha uma das opções:\n\n1️⃣ Sim, vamos começar!\n2️⃣ Não, quero sair'
        });
    }
    
    return true;
}

// ==================== DEFINIÇÕES ====================

async function mostrarDefinicoes(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '📚 *DEFINIÇÕES IMPORTANTES*\n\n🛡️ *EPC - Equipamento de Proteção Coletiva*\nDispositivo que protege um grupo de pessoas simultaneamente.\n\n👤 *EPI - Equipamento de Proteção Individual*\nDispositivo de uso individual para proteção contra riscos.\n\n⚖️ *NR6 - Norma Regulamentadora 6*\nEstabelece os requisitos para EPIs no ambiente de trabalho.'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: 'Entendeu as definições?\n\n1️⃣ Sim, entendi!\n2️⃣ Preciso rever'
        });
        
        await salvarInteracao(sender, 'epc_epi_definicoes', JSON.stringify({ etapa: 'definicoes' }));
    }, 2000);
}

async function processarDefinicoes(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim') || opcao.toLowerCase().includes('entendi')) {
        await mostrarTiposEpc(sender, sendMessage);
    } else if (opcao === '2' || opcao.toLowerCase().includes('rever')) {
        await mostrarDefinicoes(sender, sendMessage);
    } else {
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Sim, entendi!\n2️⃣ Preciso rever'
        });
    }
    
    return true;
}

// ==================== TIPOS DE EPC ====================

async function mostrarTiposEpc(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🛡️ *TIPOS DE EPC*\n\n🚧 *Proteção Coletiva:*\n• Guarda-corpos\n• Redes de proteção\n• Ventilação/exaustão\n• Sinalização de segurança\n• Barreiras de contenção\n• Sistemas de alarme'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: 'Qual a principal vantagem do EPC?\n\n1️⃣ Protege várias pessoas ao mesmo tempo\n2️⃣ É mais barato que o EPI\n3️⃣ Não precisa de manutenção'
        });
        
        await salvarInteracao(sender, 'epc_epi_tipos_epc', JSON.stringify({ etapa: 'tipos_epc' }));
    }, 3000);
}

async function processarTiposEpc(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1') {
        await sendMessage(sender, 'send-message', {
            message: '✅ *Correto!*\n\nA principal vantagem do EPC é proteger várias pessoas simultaneamente, sendo sempre a primeira opção de proteção.'
        });
        
        setTimeout(async () => {
            await mostrarTiposEpi(sender, sendMessage);
        }, 2000);
    } else if (opcao === '2' || opcao === '3') {
        await sendMessage(sender, 'send-message', {
            message: '❌ *Incorreto.*\n\nA principal vantagem do EPC é proteger várias pessoas ao mesmo tempo. Vamos continuar!'
        });
        
        setTimeout(async () => {
            await mostrarTiposEpi(sender, sendMessage);
        }, 2000);
    } else {
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Protege várias pessoas ao mesmo tempo\n2️⃣ É mais barato que o EPI\n3️⃣ Não precisa de manutenção'
        });
    }
    
    return true;
}

// ==================== TIPOS DE EPI ====================

async function mostrarTiposEpi(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '👤 *TIPOS DE EPI*\n\n🧢 *Proteção da Cabeça:*\nCapacetes, bonés, toucas\n\n👁️ *Proteção dos Olhos:*\nÓculos, viseiras, máscaras de solda\n\n👂 *Proteção Auditiva:*\nProtetores auriculares, abafadores\n\n🫁 *Proteção Respiratória:*\nMáscaras, respiradores, filtros'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '🧤 *Proteção das Mãos:*\nLuvas de diversos materiais\n\n🦶 *Proteção dos Pés:*\nBotas, sapatos de segurança\n\n🦺 *Proteção do Corpo:*\nAventais, macacões, coletes\n\n🪢 *Proteção contra Quedas:*\nCinturões, talabartes, trava-quedas'
        });
        
        setTimeout(async () => {
            await sendMessage(sender, 'send-message', {
                message: 'Quando devemos usar EPI?\n\n1️⃣ Sempre, em qualquer situação\n2️⃣ Quando não for possível eliminar o risco com EPC\n3️⃣ Apenas quando o chefe mandar'
            });
            
            await salvarInteracao(sender, 'epc_epi_tipos_epi', JSON.stringify({ etapa: 'tipos_epi' }));
        }, 3000);
    }, 3000);
}

async function processarTiposEpi(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '2') {
        await sendMessage(sender, 'send-message', {
            message: '✅ *Correto!*\n\nO EPI deve ser usado quando não for possível eliminar ou controlar o risco através de medidas de proteção coletiva (EPC).'
        });
        
        setTimeout(async () => {
            await mostrarUsoCorreto(sender, sendMessage);
        }, 2000);
    } else if (opcao === '1' || opcao === '3') {
        await sendMessage(sender, 'send-message', {
            message: '❌ *Incorreto.*\n\nO EPI deve ser usado quando não for possível eliminar o risco com EPC. Vamos continuar!'
        });
        
        setTimeout(async () => {
            await mostrarUsoCorreto(sender, sendMessage);
        }, 2000);
    } else {
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Sempre, em qualquer situação\n2️⃣ Quando não for possível eliminar o risco com EPC\n3️⃣ Apenas quando o chefe mandar'
        });
    }
    
    return true;
}

// ==================== USO CORRETO ====================

async function mostrarUsoCorreto(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '✅ *USO CORRETO DE EPIs*\n\n📋 *Antes de usar:*\n• Verificar se está em bom estado\n• Conferir se é adequado ao risco\n• Verificar prazo de validade\n• Ajustar corretamente\n\n⚠️ *Durante o uso:*\n• Manter sempre limpo\n• Não emprestar ou trocar\n• Comunicar defeitos imediatamente\n• Seguir instruções do fabricante'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: 'O que fazer se o EPI estiver danificado?\n\n1️⃣ Usar mesmo assim, é melhor que nada\n2️⃣ Comunicar ao superior e solicitar substituição\n3️⃣ Tentar consertar sozinho'
        });
        
        await salvarInteracao(sender, 'epc_epi_uso_correto', JSON.stringify({ etapa: 'uso_correto' }));
    }, 4000);
}

async function processarUsoCorreto(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '2') {
        await sendMessage(sender, 'send-message', {
            message: '✅ *Correto!*\n\nSempre comunique defeitos ao superior e solicite substituição. EPI danificado não oferece proteção adequada.'
        });
        
        setTimeout(async () => {
            await mostrarManutencao(sender, sendMessage);
        }, 2000);
    } else if (opcao === '1' || opcao === '3') {
        await sendMessage(sender, 'send-message', {
            message: '❌ *Incorreto.*\n\nNunca use EPI danificado! Sempre comunique ao superior e solicite substituição.'
        });
        
        setTimeout(async () => {
            await mostrarManutencao(sender, sendMessage);
        }, 2000);
    } else {
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Usar mesmo assim, é melhor que nada\n2️⃣ Comunicar ao superior e solicitar substituição\n3️⃣ Tentar consertar sozinho'
        });
    }
    
    return true;
}

// ==================== MANUTENÇÃO ====================

async function mostrarManutencao(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🧽 *MANUTENÇÃO E CONSERVAÇÃO*\n\n🧼 *Limpeza:*\n• Limpar após cada uso\n• Usar produtos adequados\n• Secar completamente\n• Não usar produtos abrasivos\n\n📦 *Armazenamento:*\n• Local limpo e seco\n• Protegido do sol\n• Temperatura adequada\n• Embalagem original quando possível'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: 'Com que frequência devemos limpar os EPIs?\n\n1️⃣ Uma vez por semana\n2️⃣ Após cada uso\n3️⃣ Apenas quando estiver muito sujo'
        });
        
        await salvarInteracao(sender, 'epc_epi_manutencao', JSON.stringify({ etapa: 'manutencao' }));
    }, 4000);
}

async function processarManutencao(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '2') {
        await sendMessage(sender, 'send-message', {
            message: '✅ *Correto!*\n\nOs EPIs devem ser limpos após cada uso para manter sua eficácia e durabilidade.'
        });
        
        setTimeout(async () => {
            await mostrarResponsabilidades(sender, sendMessage);
        }, 2000);
    } else if (opcao === '1' || opcao === '3') {
        await sendMessage(sender, 'send-message', {
            message: '❌ *Incorreto.*\n\nOs EPIs devem ser limpos após cada uso para garantir proteção e durabilidade.'
        });
        
        setTimeout(async () => {
            await mostrarResponsabilidades(sender, sendMessage);
        }, 2000);
    } else {
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Uma vez por semana\n2️⃣ Após cada uso\n3️⃣ Apenas quando estiver muito sujo'
        });
    }
    
    return true;
}

// ==================== RESPONSABILIDADES ====================

async function mostrarResponsabilidades(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '⚖️ *RESPONSABILIDADES*\n\n🏢 *Do Empregador:*\n• Fornecer EPI adequado e gratuito\n• Treinar sobre uso correto\n• Substituir quando danificado\n• Fiscalizar o uso\n\n👷 *Do Empregado:*\n• Usar conforme orientação\n• Cuidar e conservar\n• Comunicar defeitos\n• Cumprir determinações'
    });
    
    setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '🎯 *Agora vamos para a avaliação final!*\n\nVocê está preparado?\n\n1️⃣ Sim, vamos lá!\n2️⃣ Quero revisar o conteúdo'
        });
        
        await salvarInteracao(sender, 'epc_epi_responsabilidades', JSON.stringify({ etapa: 'responsabilidades' }));
    }, 4000);
}

async function processarResponsabilidades(sender, text, sendMessage) {
    const opcao = text.trim();
    
    if (opcao === '1' || opcao.toLowerCase().includes('sim') || opcao.toLowerCase().includes('vamos')) {
        await iniciarAvaliacaoFinal(sender, sendMessage);
    } else if (opcao === '2' || opcao.toLowerCase().includes('revisar')) {
        await sendMessage(sender, 'send-message', {
            message: '📚 Você pode revisar o conteúdo quando quiser. Por enquanto, vamos continuar com a avaliação!'
        });
        
        setTimeout(async () => {
            await iniciarAvaliacaoFinal(sender, sendMessage);
        }, 2000);
    } else {
        await sendMessage(sender, 'send-message', {
            message: 'Por favor, escolha uma das opções:\n\n1️⃣ Sim, vamos lá!\n2️⃣ Quero revisar o conteúdo'
        });
    }
    
    return true;
}

// ==================== AVALIAÇÃO FINAL ====================

async function iniciarAvaliacaoFinal(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '📝 *AVALIAÇÃO FINAL*\n\nPergunta 1 de 3:\n\nQual é a principal diferença entre EPC e EPI?'
    });
    
    setTimeout(async () => {
        try {
            await sendMessage(sender, 'send-list-message', {
                title: '',
                description: 'Escolha a resposta correta:',
                buttonText: 'Ver opções',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: 'Opções',
                    rows: [
                        {
                            id: 'opcao_a',
                            title: 'A) EPC protege grupos, EPI protege indivíduo',
                            description: 'Proteção coletiva vs individual'
                        },
                        {
                            id: 'opcao_b',
                            title: 'B) EPC é mais caro que EPI',
                            description: 'Diferença de custo'
                        },
                        {
                            id: 'opcao_c',
                            title: 'C) Não há diferença',
                            description: 'São iguais'
                        }
                    ]
                }]
            });
            
            await salvarInteracao(sender, 'epc_epi_avaliacao', JSON.stringify({ 
                etapa: 'avaliacao_final',
                pergunta: 1,
                acertos: 0
            }));
        } catch (error) {
            console.error('❌ Erro ao enviar lista:', error);
            await sendMessage(sender, 'send-message', {
                message: 'Qual é a principal diferença entre EPC e EPI?\n\nA) EPC protege grupos, EPI protege indivíduo\nB) EPC é mais caro que EPI\nC) Não há diferença\n\nResponda com A, B ou C:'
            });
            
            await salvarInteracao(sender, 'epc_epi_avaliacao', JSON.stringify({ 
                etapa: 'avaliacao_final',
                pergunta: 1,
                acertos: 0
            }));
        }
    }, 1000);
}

async function processarAvaliacaoFinal(sender, text, selectedId, sendMessage) {
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const perguntaAtual = dados.pergunta || 1;
    let acertos = dados.acertos || 0;
    
    // Processar resposta da pergunta atual
    let respostaCorreta = false;
    
    if (perguntaAtual === 1) {
        if (selectedId === 'opcao_a' || text.toLowerCase().includes('a')) {
            respostaCorreta = true;
            acertos++;
        }
    } else if (perguntaAtual === 2) {
        if (selectedId === 'opcao_b' || text.toLowerCase().includes('b')) {
            respostaCorreta = true;
            acertos++;
        }
    } else if (perguntaAtual === 3) {
        if (selectedId === 'opcao_a' || text.toLowerCase().includes('a')) {
            respostaCorreta = true;
            acertos++;
        }
    }
    
    // Mostrar resultado da pergunta
    if (respostaCorreta) {
        await sendMessage(sender, 'send-message', {
            message: '✅ Correto!'
        });
    } else {
        await sendMessage(sender, 'send-message', {
            message: '❌ Incorreto.'
        });
    }
    
    // Próxima pergunta ou finalizar
    if (perguntaAtual < 3) {
        setTimeout(async () => {
            await enviarProximaPergunta(sender, perguntaAtual + 1, acertos, sendMessage);
        }, 1500);
    } else {
        setTimeout(async () => {
            await finalizarAvaliacao(sender, acertos, sendMessage);
        }, 1500);
    }
    
    return true;
}

async function enviarProximaPergunta(sender, numeroPergunta, acertos, sendMessage) {
    let pergunta = '';
    let opcoes = [];
    
    if (numeroPergunta === 2) {
        pergunta = 'Pergunta 2 de 3:\n\nQuando devemos usar EPI?';
        opcoes = [
            { id: 'opcao_a', title: 'A) Sempre que possível', description: 'Em todas as situações' },
            { id: 'opcao_b', title: 'B) Quando EPC não elimina o risco', description: 'Como segunda opção' },
            { id: 'opcao_c', title: 'C) Apenas em emergências', description: 'Só em casos extremos' }
        ];
    } else if (numeroPergunta === 3) {
        pergunta = 'Pergunta 3 de 3:\n\nO que fazer se o EPI estiver danificado?';
        opcoes = [
            { id: 'opcao_a', title: 'A) Comunicar e solicitar substituição', description: 'Procedimento correto' },
            { id: 'opcao_b', title: 'B) Usar mesmo assim', description: 'Continuar usando' },
            { id: 'opcao_c', title: 'C) Tentar consertar', description: 'Reparar sozinho' }
        ];
    }
    
    await sendMessage(sender, 'send-message', {
        message: `📝 *AVALIAÇÃO FINAL*\n\n${pergunta}`
    });
    
    setTimeout(async () => {
        try {
            await sendMessage(sender, 'send-list-message', {
                title: '',
                description: 'Escolha a resposta correta:',
                buttonText: 'Ver opções',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: 'Opções',
                    rows: opcoes
                }]
            });
        } catch (error) {
            console.error('❌ Erro ao enviar lista:', error);
            const textoOpcoes = opcoes.map(op => op.title).join('\n');
            await sendMessage(sender, 'send-message', {
                message: `${pergunta}\n\n${textoOpcoes}\n\nResponda com A, B ou C:`
            });
        }
        
        await salvarInteracao(sender, 'epc_epi_avaliacao', JSON.stringify({ 
            etapa: 'avaliacao_final',
            pergunta: numeroPergunta,
            acertos: acertos
        }));
    }, 1000);
}

async function finalizarAvaliacao(sender, acertos, sendMessage) {
    const aprovado = acertos >= 2; // Precisa de pelo menos 2 acertos de 3
    
    if (aprovado) {
        await sendMessage(sender, 'send-message', {
            message: `🎉 *PARABÉNS!*\n\nVocê foi aprovado no treinamento!\n\n📊 *Resultado:*\n✅ Acertos: ${acertos}/3\n📜 Status: APROVADO\n\n🎓 Agora vamos gerar seu certificado!`
        });
        
        setTimeout(async () => {
            await perguntarDadosCertificado(sender, sendMessage);
        }, 2000);
    } else {
        await sendMessage(sender, 'send-message', {
            message: `😔 *Não foi dessa vez...*\n\n📊 *Resultado:*\n❌ Acertos: ${acertos}/3\n📜 Status: REPROVADO\n\nVocê precisa de pelo menos 2 acertos para ser aprovado.\n\n🔄 Quer tentar novamente?\n\n1️⃣ Sim, quero refazer\n2️⃣ Não, vou estudar mais`
        });
        
        await salvarInteracao(sender, 'epc_epi_reprovado', JSON.stringify({ 
            etapa: 'reprovado',
            acertos: acertos
        }));
    }
}

// ==================== CERTIFICADO ====================

async function perguntarDadosCertificado(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: "🎓 *Certificado de Conclusão*\n\nVamos gerar seu certificado do treinamento NR6 - EPC e EPI!"
    });
    
    try {
        // Buscar dados do contato no sistema
        console.log(`🔍 Buscando contato para certificado: ${sender}`);
        
        const formatosTelefone = [
            sender,
            sender.substring(2),
            `${sender.substring(0, 4)}9${sender.substring(4)}`,
            sender.length === 13 ? sender.substring(0, 4) + sender.substring(5) : sender,
        ];
        
        let contato = null;
        for (const formato of formatosTelefone) {
            contato = await Contato.findOne({ where: { telefone: formato } });
            if (contato) {
                console.log(`✅ Contato encontrado: ${contato.nome || contato.nomeCompleto} (formato: ${formato})`);
                break;
            }
        }
        
        if (contato) {
            const nome = contato.nomeCompleto || contato.nome || null;
            const email = contato.email || null;
            
            if (nome && email && nome !== 'Não informado' && email !== 'Não informado') {
                await sendMessage(sender, 'send-message', {
                    message: `🎓 *Certificado NR6 - EPC e EPI*\n\nDados cadastrados:\n\n👤 *Nome:* ${nome}\n📧 *E-mail:* ${email}\n\nEstão corretos?\n\n1️⃣ Sim, gerar certificado\n2️⃣ Não, corrigir dados`
                });
                
                await salvarInteracao(sender, 'epc_epi_certificado', JSON.stringify({ 
                    etapa: 'confirmar_dados_certificado', 
                    nome: nome, 
                    email: email,
                    treinamento_id: TREINAMENTO_ID
                }));
                return;
            }
        }
        
        // Se não encontrou dados completos
        await sendMessage(sender, 'send-message', {
            message: '🎓 *Certificado NR6 - EPC e EPI*\n\nPara emitir seu certificado, preciso confirmar seus dados:\n\n📝 Envie no formato:\n\n*Nome completo*\n*E-mail*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
        });
        
        await salvarInteracao(sender, 'epc_epi_certificado', JSON.stringify({ 
            etapa: 'confirmar_dados_certificado',
            treinamento_id: TREINAMENTO_ID
        }));
        
    } catch (error) {
        console.error('❌ Erro ao buscar dados para certificado:', error);
        await sendMessage(sender, 'send-message', {
            message: '🎓 *Certificado NR6 - EPC e EPI*\n\nPara emitir seu certificado, preciso de seus dados:\n\n📝 Envie no formato:\n\n*Nome completo*\n*E-mail*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
        });
        
        await salvarInteracao(sender, 'epc_epi_certificado', JSON.stringify({ 
            etapa: 'confirmar_dados_certificado',
            treinamento_id: TREINAMENTO_ID
        }));
    }
}

async function processarConfirmacaoDados(sender, text, sendMessage) {
    const ultimaInteracao = await obterUltimaInteracao(sender);
    const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
    const opcao = text.trim();
    
    // Se tem dados salvos e usuário confirmou
    if (dados.nome && dados.email && (opcao === '1' || opcao.toLowerCase().includes('sim') || opcao.toLowerCase().includes('gerar'))) {
        await gerarEEnviarCertificado(dados.nome, dados.email, sender, sendMessage);
        return true;
    }
    
    // Se usuário quer corrigir ou não tem dados salvos
    if (dados.nome && dados.email && (opcao === '2' || opcao.toLowerCase().includes('não') || opcao.toLowerCase().includes('corrigir'))) {
        await sendMessage(sender, 'send-message', {
            message: '📝 Envie os dados corretos:\n\n*Nome completo*\n*E-mail*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
        });
        
        await salvarInteracao(sender, 'epc_epi_certificado', JSON.stringify({ 
            etapa: 'confirmar_dados_certificado',
            treinamento_id: TREINAMENTO_ID
        }));
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
                message: '❌ E-mail inválido. Envie novamente:\n\n*Nome completo*\n*E-mail válido*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
            });
            return true;
        }
        
        await gerarEEnviarCertificado(nome, email, sender, sendMessage);
    } else {
        await sendMessage(sender, 'send-message', {
            message: '❌ Dados incompletos. Envie:\n\n*Nome completo*\n*E-mail*\n\nExemplo:\nJoão Silva Santos\njoao@email.com'
        });
    }
    
    return true;
}

async function gerarEEnviarCertificado(nome, email, sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '⏳ Gerando seu certificado de conclusão...'
    });
    
    try {
        // Registrar conclusão do treinamento no banco
        await registrarConclusaoTreinamento(sender, nome, email);
        
        // Gerar certificado específico do treinamento
        const resultado = await gerarCertificadoTreinamento(nome, email, NOME_TREINAMENTO, sendMessage, sender);
        
        if (resultado.sucesso) {
            await sendMessage(sender, 'send-message', {
                message: `✅ *Certificado gerado com sucesso!*\n\n🎓 *Treinamento:* ${NOME_TREINAMENTO}\n📧 *Enviado para:* ${email}\n📱 *Também enviado aqui no chat*\n\n🏆 *Parabéns por concluir o treinamento!*\n\n⚠️ *IMPORTANTE:* Este certificado possui validade legal para treinamentos normativos conforme NR6.`
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
        await finalizarTreinamento(sender, sendMessage);
    }, 2000);
}

async function registrarConclusaoTreinamento(sender, nome, email) {
    try {
        // Buscar contato
        const formatosTelefone = [
            sender,
            sender.substring(2),
            `${sender.substring(0, 4)}9${sender.substring(4)}`,
            sender.length === 13 ? sender.substring(0, 4) + sender.substring(5) : sender,
        ];
        
        let contato = null;
        for (const formato of formatosTelefone) {
            contato = await Contato.findOne({ where: { telefone: formato } });
            if (contato) break;
        }
        
        if (contato) {
            // Registrar conclusão na tabela ContatoTreinamentos
            await ContatoTreinamentos.create({
                contato_id: contato.id,
                treinamento_id: TREINAMENTO_ID,
                data_conclusao: new Date(),
                certificado_emitido: true,
                nome_certificado: nome,
                email_certificado: email
            });
            
            console.log(`✅ Conclusão registrada: Contato ${contato.id}, Treinamento ${TREINAMENTO_ID}`);
        }
    } catch (error) {
        console.error('❌ Erro ao registrar conclusão:', error);
    }
}

async function gerarCertificadoTreinamento(nome, email, nomeTrainamento, sendMessage, sender) {
    // Esta função deve ser implementada para gerar certificado específico do treinamento
    // Por enquanto, usar a função genérica
    return await gerarCertificado(nome, email, sendMessage, sender, nomeTrainamento);
}

async function finalizarTreinamento(sender, sendMessage) {
    await sendMessage(sender, 'send-message', {
        message: '🎉 *Treinamento Concluído!*\n\nVocê completou com sucesso o treinamento NR6 - EPC e EPI.\n\n📋 *Lembre-se:*\n• Use sempre os EPIs adequados\n• Mantenha-os limpos e conservados\n• Comunique defeitos imediatamente\n• A segurança é responsabilidade de todos!\n\n🚀 Obrigado por participar!'
    });
    
    await salvarInteracao(sender, 'epc_epi_finalizado', JSON.stringify({ 
        etapa: 'finalizado',
        data_conclusao: new Date().toISOString()
    }));
}

// ==================== FUNÇÕES AUXILIARES ====================

async function salvarInteracao(telefone, tipo, mensagem) {
    try {
        await Interacao.create({
            telefone: telefone,
            tipo: tipo,
            mensagem: mensagem
        });
        console.log(`✅ Interação EPC/EPI salva: ${tipo} para ${telefone}`);
    } catch (error) {
        console.error('❌ Erro ao salvar interação EPC/EPI:', error);
    }
}

async function obterUltimaInteracao(telefone) {
    try {
        return await Interacao.findOne({
            where: { 
                telefone: telefone,
                tipo: { [require('sequelize').Op.like]: 'epc_epi_%' }
            },
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.error('❌ Erro ao obter interação EPC/EPI:', error);
        return null;
    }
}

// ==================== EXPORTS ====================

module.exports = {
    processarTreinamentoEpcEpi,
    TREINAMENTO_ID,
    NOME_TREINAMENTO
};