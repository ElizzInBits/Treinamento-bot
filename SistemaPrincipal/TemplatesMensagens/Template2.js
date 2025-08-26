



// Cliente WhatsApp direto (será definido pelo bot principal)
let wppClient = null;

// Função para definir cliente
function setWppClient(client) {
    wppClient = client;
}

// Função sendMessage usando cliente direto
async function sendMessage(phone, endpoint, body = {}) {
    const sendStart = Date.now();
    
    if (!wppClient) {
        console.error('❌ Cliente WhatsApp não definido');
        return false;
    }
    
    try {
        let result;
        
        switch (endpoint) {
            case 'send-message':
                result = await wppClient.sendText(phone, body.message);
                break;
                
            case 'send-list-message':
                result = await wppClient.sendListMessage(phone, body);
                break;
                
            case 'send-file':
                result = await wppClient.sendFile(phone, body.path, body.filename, body.caption);
                break;
                
            default:
                return false;
        }
        
        console.log(`✅ ${endpoint}: ${Date.now() - sendStart}ms`);
        return result;
        
    } catch (error) {
        const duration = Date.now() - sendStart;
        console.error(`❌ ${endpoint} (${duration}ms):`, error.message);
        return false;
    }
}
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const { Contato, Interacao, Empresa, EmpresaTreinamento } = require('../BancoDeDados/models');
const { Treinamento } = require('../BancoDeDados/models');
const { gerarCertificadoBanco, enviarEmail } = require('./Certificados/certificados2.js');
const cacheContatos = require('../BancoDeDados/cache-contatos');

// Carregar todos os scripts de treinamento dinamicamente
const scriptsTreinamento = {};
function carregarScriptsTreinamento() {
    const pastaScripts = path.join(__dirname, 'Treinamentos');
    if (fs.existsSync(pastaScripts)) {
        // Carregar arquivos da pasta principal
        const arquivos = fs.readdirSync(pastaScripts).filter(arquivo => arquivo.endsWith('.js'));
        arquivos.forEach(arquivo => {
            const nomeScript = arquivo.replace('.js', ''); // Nome do arquivo sem extensão
            try {
                // Limpar cache do require para recarregar o script
                const caminhoCompleto = path.resolve(__dirname, 'Treinamentos', arquivo);
                delete require.cache[caminhoCompleto];

                scriptsTreinamento[nomeScript] = require(`./Treinamentos/${arquivo}`);
                console.log(`📝 Script carregado: ${nomeScript}`);
            } catch (error) {
                console.error(`❌ Erro ao carregar script ${arquivo}:`, error);
            }
        });

        // Carregar arquivos da subpasta LCM
        const pastaLCM = path.join(pastaScripts, 'LCM');
        if (fs.existsSync(pastaLCM)) {
            const arquivosLCM = fs.readdirSync(pastaLCM).filter(arquivo => arquivo.endsWith('.js'));
            arquivosLCM.forEach(arquivo => {
                const nomeScript = arquivo.replace('.js', ''); // Nome do arquivo sem extensão
                try {
                    // Limpar cache do require para recarregar o script
                    const caminhoCompleto = path.resolve(__dirname, 'Treinamentos', 'LCM', arquivo);
                    delete require.cache[caminhoCompleto];

                    scriptsTreinamento[nomeScript] = require(`./Treinamentos/LCM/${arquivo}`);
                    console.log(`📝 Script LCM carregado: ${nomeScript}`);
                } catch (error) {
                    console.error(`❌ Erro ao carregar script LCM ${arquivo}:`, error);
                }
            });
        }
    }
    console.log(`📋 Scripts disponíveis:`, Object.keys(scriptsTreinamento));
}

// Carregar scripts na inicialização
carregarScriptsTreinamento();





// ========================================
// VARIÁVEIS DE CONTROLE GLOBAIS
// ========================================
const emProcessamento = new Set();

// ========================================
// CONSTANTES E CONFIGURAÇÕES
// ========================================
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Constantes básicas para confirmação de dados
const RESPOSTAS_POSITIVAS = ['sim', 'confirmar', 'dados corretos', 'vamos', 'começar', 'iniciar', 'pronto', 'ok', 'vamos nessa', 'vamos começar', 'sim - vamos começar'];
const RESPOSTAS_NEGATIVAS = ['não', 'nao', 'dados incorretos', 'corrigir', 'ainda não', 'ainda nao', 'depois', 'mais tarde', 'preciso me preparar'];

// Função universal para verificar se texto contém resposta positiva ou negativa
function verificarResposta(texto, tipo = 'positiva') {
    const textoLimpo = texto.toLowerCase().trim();
    const respostas = tipo === 'positiva' ? RESPOSTAS_POSITIVAS : RESPOSTAS_NEGATIVAS;

    return respostas.some(resposta =>
        textoLimpo.includes(resposta) ||
        textoLimpo === resposta ||
        textoLimpo.startsWith(resposta) ||
        textoLimpo.endsWith(resposta)
    );
}

// Função para verificar se é resposta de quiz (a, b, c, d)
function verificarRespostaQuiz(texto) {
    const textoLimpo = texto.toLowerCase().trim();
    return /^[abcd]\)|\b[abcd]\)|[abcd]$/.test(textoLimpo);
}

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Limpa um número de telefone removendo caracteres especiais
 */
function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}





// ========================================
// FUNÇÕES DE AGENDAMENTO E INTERAÇÃO
// ========================================



/**
 * Salva interação - SIMPLES
 */
async function salvarUltimaInteracao(sender, tipo, mensagem) {
    try {
        await Interacao.create({
            telefone: sender,
            tipo: tipo,
            mensagem: mensagem || '',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Erro salvarUltimaInteracao:', error.message);
    }
}

/**
 * Obtém a última interação - SIMPLES
 */
async function obterUltimaInteracao(sender) {
    try {
        return await Interacao.findOne({
            where: { telefone: sender },
            order: [['createdAt', 'DESC']],
            logging: false
        });
    } catch (error) {
        console.error('Erro obterUltimaInteracao:', error.message);
        return null;
    }
}

// ========================================
// TEMPLATES DE MENSAGENS
// ========================================

/**
 * Retorna template da mensagem de continuar
 */
function getMensagemListaContinuar() {
    return {
        title: '',
        description: 'Escolha uma opção:',
        buttonText: 'Continuar',
        listType: 'SINGLE_SELECT',
        sections: [
            {
                title: '',
                rows: [
                    { id: 'continuar', title: 'Continuar de onde parei', description: '' },
                    { id: 'pausar', title: 'Continuo assim que possível', description: '' },
                ],
            },
        ],
    };
}



/**
 * Retorna template de confirmação de dados
 */
function getConfirmacaoDados(nomeCompleto, emailCadastrado) {
    return {
        title: '',
        description: `🎓 *Confirmação dos dados para o certificado:*\n\n👤 *Nome:* ${nomeCompleto}\n📧 *E-mail:* ${emailCadastrado}\n\nOs dados estão corretos?`,
        buttonText: 'Confirmar',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'dados_corretos', title: 'Sim, os dados estão corretos', description: '' },
                { id: 'dados_incorretos', title: 'Não, preciso corrigir', description: '' },
            ],
        }],
    };
}

function getFinalizarTreinamento() {
    return {
        title: '',
        description: 'Clique na opção abaixo para finalizar seu treinamento:',
        buttonText: 'Finalizar',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: [
                { id: 'finalizar_treinamento', title: '✅ Treinamento finalizado', description: '' },
            ],
        }],
    };
}

// ========================================
// FUNÇÕES DE PROCESSAMENTO DE MENSAGENS
// ========================================

/**
 * Processa comandos de continuar/pausar
 */
async function processarComandosContinuar(sender, text, selectedId) {
    if (text === 'continuar' || selectedId === 'continuar') {
        const ultima = await obterUltimaInteracao(sender);
        if (ultima) {
            if (ultima.tipo === 'quiz') {
                await sendMessage(sender, 'send-list-message', ultima.mensagem);
            } else {
                await sendMessage(sender, 'send-message', { message: ultima.mensagem });
            }

        } else {
            await sendMessage(sender, 'send-message', {
                message: '❗️Não encontrei onde você parou. Vamos começar do início?',
            });
            await sendMessage(sender, 'send-list-message', getMensagemListaContinuar());
        }
        return true;
    }

    if (text === 'pausar' || selectedId === 'pausar') {
        await sendMessage(sender, 'send-message', {
            message: 'Sem problemas! Quando quiser continuar, é só me chamar.',
        });

        return true;
    }

    return false;
}



/**
 * Processa confirmação de dados
 */
async function processarConfirmacaoDados(sender, textoNormalizado, selectedIdNormalizado, contato) {
    // Dados corretos
    if (selectedIdNormalizado === 'dados_corretos' || RESPOSTAS_POSITIVAS.includes(textoNormalizado)) {
        const nomeCompleto = contato.nomeCompleto || contato.nome || 'Nome não informado';
        const emailCadastrado = contato.email || 'E-mail não informado';

        if (nomeCompleto === 'Nome não informado' || emailCadastrado === 'E-mail não informado') {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ Dados incompletos no cadastro. Por favor, entre em contato com o suporte.',
            });
            return true;
        }

        await sendMessage(sender, 'send-message', {
            message: '✅ Dados confirmados!',
        });
        await gerarEEnviarCertificado(contato, sender);
        return true;
    }

    // Dados incorretos
    if (selectedIdNormalizado === 'dados_incorretos' || RESPOSTAS_NEGATIVAS.includes(textoNormalizado)) {
        await sendMessage(sender, 'send-message', {
            message: '📝 Para corrigir seus dados, por favor, me envie seu nome completo correto.',
        });
        await salvarUltimaInteracao(sender, 'corrigir_nome', 'Por favor, me envie seu nome completo correto.');
        return true;
    }

    return false;
}

/**
 * Processa correção de dados
 */
async function processarCorrecaoDados(sender, rawText, contato) {
    const ultimaInteracao = await obterUltimaInteracao(sender);

    // Correção de nome
    if (ultimaInteracao?.tipo === 'corrigir_nome') {
        contato.nomeCompleto = rawText.trim();
        await contato.save();

        await sendMessage(sender, 'send-message', {
            message: '👍 Nome atualizado! Agora, me envie seu e-mail correto.',
        });
        await salvarUltimaInteracao(sender, 'corrigir_email', 'Por favor, me envie seu e-mail correto.');
        return true;
    }

    // Correção de email
    if (ultimaInteracao?.tipo === 'corrigir_email') {
        if (!EMAIL_REGEX.test(rawText.trim())) {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ E-mail inválido! Por favor, insira um e-mail válido.',
            });
            await salvarUltimaInteracao(sender, 'corrigir_email', 'Por favor, me envie seu e-mail correto.');
            return true;
        }

        contato.email = rawText.trim();
        await contato.save();

        await sendMessage(sender, 'send-message', {
            message: '✅ E-mail atualizado! Gerando seu certificado...',
        });
        await gerarEEnviarCertificado(contato, sender);
        return true;
    }

    return false;
}

/**
 * Busca treinamentos - SIMPLES
 */
async function buscarTreinamentosEmpresa(empresaId) {
    try {
        const empresaTreinamentos = await EmpresaTreinamento.findAll({
            where: { empresa_id: empresaId },
            attributes: ['treinamento_id'],
            logging: false
        });

        if (empresaTreinamentos.length === 0) return [];

        const treinamentoIds = empresaTreinamentos.map(et => et.treinamento_id);
        return await Treinamento.findAll({
            where: { id: treinamentoIds },
            attributes: ['id', 'nome'],
            logging: false
        });
    } catch (error) {
        console.error('Erro buscarTreinamentosEmpresa:', error.message);
        return [];
    }
}

/**
 * Inicia o treinamento para novos usuários - OTIMIZADO
 */
async function iniciarTreinamento(sender, contato) {
    const funcStart = Date.now();
    console.log(`🚀 Iniciando treinamento para ${contato.nome}`);
    
    // Usar dados da empresa já carregados no contato (se disponível)
    const nomeEmpresa = contato.empresaRef?.razaoSocial || 'sua empresa';

    const msg1Start = Date.now();
    await sendMessage(sender, 'send-message', {
        message: `👋 Olá, ${contato.nome}! Seja bem-vindo(a)`,
    });
    console.log(`📤 Mensagem saudação: ${Date.now() - msg1Start}ms`);

    // Buscar treinamentos da empresa (agora otimizado)
    const dbStart = Date.now();
    const treinamentos = await buscarTreinamentosEmpresa(contato.empresaId);
    console.log(`🔍 Busca treinamentos: ${Date.now() - dbStart}ms`);

    if (treinamentos.length === 0) {
        await sendMessage(sender, 'send-message', {
            message: '⚠️ Não há treinamentos disponíveis para sua empresa no momento. Entre em contato com o suporte.',
        });
        return;
    }

    await sendMessage(sender, 'send-message', {
        message: '📚 Aqui estão os treinamentos disponíveis',
    });

    // Mostrar treinamentos disponíveis como texto simples primeiro
    const listaTreinamentos = treinamentos.map(t => `${t.nome}`).join('\n\n');
    await sendMessage(sender, 'send-message', {
        message: `*Escolha qual treinamento deseja iniciar:*\n\n${listaTreinamentos}`,
    });

    // Criar lista de treinamentos
    const rows = treinamentos.map((treinamento, index) => ({
        id: `treinamento_${treinamento.id}`,
        title: treinamento.nome,
        description: ''
    }));

    const listMsg = {
        title: '',
        description: 'Selecione uma opção:',
        buttonText: 'Selecionar',
        listType: 'SINGLE_SELECT',
        sections: [{
            title: '',
            rows: rows
        }],
    };

    const msg3Start = Date.now();
    await sendMessage(sender, 'send-list-message', listMsg);
    console.log(`📤 Mensagem lista: ${Date.now() - msg3Start}ms`);
    
    await salvarUltimaInteracao(sender, 'selecionar_treinamento', JSON.stringify(listMsg));
    console.log(`✅ TOTAL iniciarTreinamento: ${Date.now() - funcStart}ms`);
}



/**
 * Gera e envia certificado para o usuário
 */
async function gerarEEnviarCertificado(contato, sender) {
    await sendMessage(sender, 'send-message', {
        message: '📧 Gerando seu certificado...\n\nIsso pode demorar um pouco...',
    });

    try {
        const nomeParaCertificado = contato.nomeCompleto || contato.nome;

        // Buscar dados do treinamento selecionado
        let dadosTreinamento;
        if (contato.treinamentoId) {
            const treinamento = await Treinamento.findByPk(contato.treinamentoId);
            if (treinamento) {
                dadosTreinamento = {
                    nome: treinamento.nome,
                    modalidade: 'EAD - Ensino à Distância',
                    cargaHoraria: '4',
                    tipo: 'Treinamento Básico',
                    emConformidade: 'Em conformidade com as normas de Segurança, Saúde e Meio Ambiente aplicáveis.',
                    documento: 'CPF: ***.***.***-**',
                    periodo: new Date().toLocaleDateString('pt-BR')
                };
            }
        }

        // Dados padrão caso não tenha treinamento específico
        if (!dadosTreinamento) {
            dadosTreinamento = {
                nome: 'Treinamento Básico de SSMA',
                modalidade: 'EAD - Ensino à Distância',
                cargaHoraria: '4',
                tipo: 'Treinamento Básico',
                emConformidade: 'Em conformidade com as normas de Segurança, Saúde e Meio Ambiente aplicáveis.',
                documento: 'CPF: ***.***.***-**',
                periodo: new Date().toLocaleDateString('pt-BR')
            };
        }

        console.log('📝 Gerando certificado para:', nomeParaCertificado);
        const certificadoPath = await gerarCertificadoBanco(contato.id);

        console.log('📧 Enviando e-mail para:', contato.email);
        const treinamentoAtual = contato.treinamentoId ? await Treinamento.findByPk(contato.treinamentoId) : null;
        await enviarEmail(contato.email, certificadoPath, treinamentoAtual);

        await sendMessage(sender, 'send-message', {
            message: `🎉 Seu certificado foi gerado com sucesso! \n\n📧 Ele foi enviado para: ${contato.email}\n\n📄 Também está disponível aqui:`,
        });

        await sendMessage(sender, 'send-file', {
            path: certificadoPath,
            filename: `Certificado_${dadosTreinamento.nome.replace(/\s+/g, '_')}.pdf`,
            caption: `🎓 Seu certificado de conclusão do ${dadosTreinamento.nome}`
        });

        await sendMessage(sender, 'send-list-message', getFinalizarTreinamento());
        await salvarUltimaInteracao(sender, 'finalizacao', getFinalizarTreinamento());

    } catch (err) {
        console.error('❌ Erro detalhado ao gerar certificado:', err);
        await sendMessage(sender, 'send-message', {
            message: `❌ Ocorreu um erro ao gerar seu certificado:\n\n${err.message}\n\nPor favor, entre em contato com o suporte.`,
        });
    }
}



// ========================================
// FUNÇÃO PRINCIPAL DE PROCESSAMENTO
// ========================================

async function processarMensagem(message, client) {
    const startTime = Date.now();
    console.log(`⏱️ [${new Date().toISOString()}] INÍCIO processamento: ${message.from}`);
    
    setWppClient(client);
    const sender = message.from.replace('@c.us', '');

    if (!client || emProcessamento.has(sender)) {
        return;
    }

    emProcessamento.add(sender);

    try {
        const text = message.body?.toLowerCase() || '';
        const selectedId = message.selectedRowId || '';
        const rawText = message.body || '';

        // RESPOSTA INSTANTÂNEA com cache otimizado
        const dbStart = Date.now();
        const contato = await cacheContatos.buscarContato(sender);
        console.log(`🔍 Busca contato: ${Date.now() - dbStart}ms`);

        // Se não encontrou contato, responder imediatamente
        if (!contato) {
            const msgStart = Date.now();
            await sendMessage(sender, 'send-message', {
                message: `🤖 Olá! Eu sou um bot de treinamentos! 🚀\n\nEstou aqui para aplicar treinamentos de segurança e saúde no trabalho.\n\n🤔 Humm, parece que você ainda não fez seu cadastro.\nClique no link abaixo para se cadastrar e iniciar seu treinamento:\n\n👉 https://abrir.link/kAgON`,
            });
            console.log(`📤 Envio mensagem não cadastrado: ${Date.now() - msgStart}ms`);
            console.log(`⏱️ TOTAL processamento não cadastrado: ${Date.now() - startTime}ms`);
            return;
        }

        if (contato.statusTreinamento === 'não iniciado') {
            // Invalidar cache se necessário
            cacheContatos.invalidarContato(sender);
        }

        const ultimaInteracao = await obterUltimaInteracao(sender);

        if (contato.statusTreinamento === 'concluído') {

            // Se conversa foi finalizada, verificar se usuário quer reativar
            if (ultimaInteracao?.tipo === 'conversa_finalizada') {

                if (text.toLowerCase().includes('treinamentos') || text.toLowerCase().includes('ver treinamentos')) {
                    // Reativar oferecimento de treinamentos
                    const treinamentos = await buscarTreinamentosEmpresa(contato.empresaId);
                    const treinamentosDisponiveis = treinamentos.filter(t => t.id !== 14);

                    if (treinamentosDisponiveis.length > 0) {
                        await sendMessage(sender, 'send-message', {
                            message: '📚 Você possui outros treinamentos disponíveis!',
                        });

                        const listMsg = {
                            title: '',
                            description: 'Deseja ver seus treinamentos disponíveis?',
                            buttonText: 'Ver opções',
                            listType: 'SINGLE_SELECT',
                            sections: [{
                                title: '',
                                rows: [
                                    { id: 'ver_treinamentos_pendentes', title: 'Ver treinamentos disponíveis 📚', description: '' },
                                    { id: 'nao_ver_treinamentos', title: 'Não, obrigado 🙏', description: '' },
                                ],
                            }],
                        };

                        await sendMessage(sender, 'send-list-message', listMsg);
                        await salvarUltimaInteracao(sender, 'aguardando_opcao_treinamentos', JSON.stringify(listMsg));
                        return;
                    }
                } else {
                    await sendMessage(sender, 'send-message', {
                        message: '🙏 Olá! Se quiser ver seus treinamentos, digite "treinamentos".',
                    });
                    return;
                }
            }

            // Se já está aguardando opção de treinamentos, não repetir mensagem
            if (ultimaInteracao?.tipo !== 'aguardando_opcao_treinamentos') {
                // Verificar se há outros treinamentos disponíveis
                const treinamentos = await buscarTreinamentosEmpresa(contato.empresaId);
                const treinamentosDisponiveis = treinamentos.filter(t => t.id !== 14); // Excluir SSMA já concluído

                if (treinamentosDisponiveis.length > 0) {
                    await sendMessage(sender, 'send-message', {
                        message: '👋 Olá! Você já concluiu o treinamento SSMA. 🎉\n\n📚 Você possui outros treinamentos disponíveis!',
                    });

                    const listMsg = {
                        title: '',
                        description: 'Deseja ver seus treinamentos disponíveis?',
                        buttonText: 'Ver opções',
                        listType: 'SINGLE_SELECT',
                        sections: [{
                            title: '',
                            rows: [
                                { id: 'ver_treinamentos_pendentes', title: 'Ver treinamentos disponíveis 📚', description: '' },
                                { id: 'nao_ver_treinamentos', title: 'Não, obrigado 🙏', description: '' },
                            ],
                        }],
                    };

                    await sendMessage(sender, 'send-list-message', listMsg);
                    await salvarUltimaInteracao(sender, 'aguardando_opcao_treinamentos', JSON.stringify(listMsg));
                    return;
                } else {
                    await sendMessage(sender, 'send-message', {
                        message: '🙏 Olá! Você já concluiu todos os seus treinamentos. Se precisar de algo, entre em contato com o suporte.',
                    });
                    return;
                }
            }
        }

        // PROCESSAR SSMA PRIMEIRO - ANTES DA CONTINUIDADE
        const script = scriptsTreinamento['treinamentoSSMA'];
        console.log(`🔍 Script SSMA encontrado: ${!!script}, função processarRespostaSSMA: ${!!(script && script.processarRespostaSSMA)}`);
        if (script && script.processarRespostaSSMA) {
            // Verificar se é uma resposta específica do SSMA usando funções universais
            if (selectedId === 'rever_modulo1' || selectedId === 'rever_modulo2' ||
                selectedId === 'iniciar_ssma' || selectedId === 'nao_iniciar_ssma' ||
                verificarResposta(text, 'positiva') || verificarResposta(text, 'negativa') ||
                verificarRespostaQuiz(text) ||
                ultimaInteracao?.tipo === 'aguardando_confirmacao' ||
                ultimaInteracao?.tipo === 'aguardando_revisao_modulo1' ||
                ultimaInteracao?.tipo === 'aguardando_revisao_modulo2' ||
                ultimaInteracao?.tipo === 'aguardando_inicio_ssma' ||
                ultimaInteracao?.tipo === 'aguardando_modulo2_intro' ||
                ultimaInteracao?.tipo === 'aguardando_quiz_intro' ||
                ultimaInteracao?.tipo?.includes('aguardando_quiz') ||
                ultimaInteracao?.tipo?.includes('confirmacao_dados_ssma') ||
                ultimaInteracao?.tipo?.startsWith('quiz_modulo') ||
                selectedId?.includes('_q') || selectedId?.includes('_m2q')) {

                console.log(`🔍 Tentando processar no SSMA: "${text}", selectedId="${selectedId}", ultimaInteracao="${ultimaInteracao?.tipo}"`);
                try {
                    const resultado = await script.processarRespostaSSMA(sender, text, selectedId, contato, sendMessage);
                    console.log(`🔍 Resultado SSMA: ${resultado}`);
                    if (resultado) {
                        console.log(`✅ SSMA processou com sucesso`);
                        return;
                    }
                    console.log(`❌ SSMA não processou`);
                } catch (error) {
                    console.error(`❌ Erro ao processar resposta SSMA:`, error);
                }
            }
        }

        // Se há interação recente e usuário está em treinamento, oferecer continuidade (apenas se não for resposta de quiz)
        if (ultimaInteracao && contato.statusTreinamento === 'em andamento' &&
            !text.includes('continuar') && !selectedId && !rawText.toLowerCase().includes('exame') &&
            !rawText.toLowerCase().includes('a)') && !rawText.toLowerCase().includes('b)') &&
            !rawText.toLowerCase().includes('c)') && !rawText.toLowerCase().includes('d)') &&
            !rawText.toLowerCase().includes('dados estão corretos') && !rawText.toLowerCase().includes('sim') &&
            !rawText.toLowerCase().includes('pode mandar') && // NÃO oferecer continuidade se usuário já respondeu
            !rawText.toLowerCase().includes('vamos nessa') && // NÃO oferecer se respondeu ao quiz
            !rawText.toLowerCase().includes('rever conteúdo') && // NÃO oferecer se está revisando conteúdo
            ultimaInteracao.tipo !== 'opcoes_continuidade' && ultimaInteracao.tipo !== 'confirmacao_dados_ssma' &&
            ultimaInteracao.tipo !== 'aguardando_inicio_ssma' && // NÃO oferecer se já está aguardando resposta
            ultimaInteracao.tipo !== 'aguardando_quiz_intro' && // NÃO oferecer se aguardando quiz
            ultimaInteracao.tipo !== 'aguardando_revisao_modulo1' && // NÃO oferecer se aguardando revisão
            ultimaInteracao.tipo !== 'aguardando_revisao_modulo2' && // NÃO oferecer se aguardando revisão
            ultimaInteracao.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) { // Últimas 24h

            await sendMessage(sender, 'send-message', {
                message: `👋 Olá! Vejo que você estava no meio do treinamento "${contato.treinamento?.nome || 'SSMA'}".\n\n🔄 Deseja continuar de onde parou?`,
            });

            const continuarMsg = {
                title: '',
                description: 'Escolha uma opção:',
                buttonText: 'Continuar',
                listType: 'SINGLE_SELECT',
                sections: [{
                    title: '',
                    rows: [
                        { id: 'continuar_treinamento', title: 'Continuar de onde parei 📚', description: '' },
                        { id: 'reiniciar_treinamento', title: 'Reiniciar do início 🔄', description: '' },
                    ],
                }],
            };

            await sendMessage(sender, 'send-list-message', continuarMsg);
            await salvarUltimaInteracao(sender, 'opcoes_continuidade', JSON.stringify(continuarMsg));
            return;
        }

        // Saudação inicial para usuários não iniciados (evitar loop)
        if (contato.statusTreinamento === 'não iniciado' && ultimaInteracao?.tipo !== 'selecionar_treinamento') {
            const inicioStart = Date.now();
            await iniciarTreinamento(sender, contato);
            console.log(`🚀 Iniciar treinamento: ${Date.now() - inicioStart}ms`);
            console.log(`⏱️ TOTAL processamento não iniciado: ${Date.now() - startTime}ms`);
            return;
        }



        // Processar opções de continuidade
        if (selectedId === 'continuar_treinamento' ||
            text.toLowerCase().includes('continuar de onde parei') ||
            (ultimaInteracao?.tipo === 'opcoes_continuidade' && text.toLowerCase().includes('continuar'))) {

            await sendMessage(sender, 'send-message', {
                message: '🔄 Continuando de onde você parou...',
            });

            // Buscar a última interação relevante (não de continuidade)
            const interacoesRecentes = await Interacao.findAll({
                where: { telefone: sender },
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            const ultimaInteracaoRelevante = interacoesRecentes.find(i =>
                i.tipo !== 'opcoes_continuidade' &&
                i.tipo !== 'treinamento_iniciado' &&
                i.mensagem && i.mensagem.trim() !== ''
            );

            if (ultimaInteracaoRelevante) {
                try {
                    const mensagemData = JSON.parse(ultimaInteracaoRelevante.mensagem);
                    if (mensagemData.sections) {
                        await sendMessage(sender, 'send-list-message', mensagemData);
                    } else {
                        await sendMessage(sender, 'send-message', { message: ultimaInteracaoRelevante.mensagem });
                    }
                } catch {
                    await sendMessage(sender, 'send-message', { message: ultimaInteracaoRelevante.mensagem });
                }
            } else {
                // Se não encontrou interação relevante, reiniciar
                const script = scriptsTreinamento['treinamentoSSMA'];
                if (script && script.executarTreinamento) {
                    await script.executarTreinamento(sender, contato, sendMessage);
                }
            }
            return;
        }

        if (selectedId === 'reiniciar_treinamento' ||
            text.toLowerCase().includes('reiniciar do início') ||
            (ultimaInteracao?.tipo === 'opcoes_continuidade' && text.toLowerCase().includes('reiniciar'))) {

            // Reiniciar treinamento
            const script = scriptsTreinamento['treinamentoSSMA'];
            if (script && script.executarTreinamento) {
                await sendMessage(sender, 'send-message', {
                    message: '🔄 Reiniciando seu treinamento...',
                });
                await script.executarTreinamento(sender, contato, sendMessage);
                return;
            }
        }

        // Processar confirmação de dados - AMPLIADO
        if ((ultimaInteracao?.tipo === 'confirmacao_dados_ssma' || ultimaInteracao?.mensagem?.includes('dados para o certificado')) &&
            (selectedId === 'dados_corretos_ssma' || text.toLowerCase().includes('sim') || text.toLowerCase().includes('dados estão corretos'))) {

            console.log('✅ Processando confirmação de dados do certificado');

            await sendMessage(sender, 'send-message', {
                message: '✅ Dados confirmados! Gerando seu certificado...',
            });

            // Chamar geração de certificado diretamente
            const script = scriptsTreinamento['treinamentoSSMA'];
            if (script && script.processarRespostaSSMA) {
                try {
                    await script.processarRespostaSSMA(sender, text, 'dados_corretos_ssma', contato, sendMessage);
                } catch (error) {
                    console.error('Erro ao gerar certificado:', error);
                }
            }
            return;
        }

        // FALLBACK - Se contém "dados estão corretos" sempre processar
        if (text.toLowerCase().includes('dados estão corretos') || text.toLowerCase().includes('sim, os dados')) {
            console.log('✅ FALLBACK: Processando confirmação por texto');

            await sendMessage(sender, 'send-message', {
                message: '✅ Dados confirmados! Gerando seu certificado...',
            });

            const script = scriptsTreinamento['treinamentoSSMA'];
            if (script && script.processarRespostaSSMA) {
                try {
                    await script.processarRespostaSSMA(sender, text, 'dados_corretos_ssma', contato, sendMessage);
                } catch (error) {
                    console.error('Erro ao gerar certificado:', error);
                }
            }
            return;
        }

        // Processamento de quiz movido para o início da função



        // Verificar se é um usuário recadastrado que precisa de orientação
        if (contato.statusTreinamento === 'não iniciado' && !ultimaInteracao && ultimaInteracao?.tipo !== 'treinamento_iniciado') {
            await iniciarTreinamento(sender, contato);
            return;
        }

        // Processar comando reiniciar treinamento
        if (text === 'reiniciar' && contato.treinamento) {
            const script = scriptsTreinamento[contato.treinamento.nome];
            if (script && script.executarTreinamento) {
                await script.executarTreinamento(sender, contato);
                return;
            }
        }



        const correuCorrecao = await processarCorrecaoDados(sender, rawText, contato);
        if (correuCorrecao) return;



        // Ignorar mensagens de grupo
        if (message.isGroupMsg) {
            return;
        }

        const textoNormalizado = rawText.trim().toLowerCase();
        const selectedIdNormalizado = (selectedId || '').trim().toLowerCase();



        // Processar confirmação de dados para usuários que concluíram
        if (contato.statusTreinamento === 'concluído') {
            if (await processarConfirmacaoDados(sender, textoNormalizado, selectedIdNormalizado, contato)) {
                return;
            }
            if (await processarCorrecaoDados(sender, rawText, contato)) {
                return;
            }
        }

        // Processar confirmação de seleção de treinamento PRIMEIRO
        if (ultimaInteracao?.tipo === 'confirmacao_treinamento' && ultimaInteracao.mensagem) {
            const dadosInteracao = JSON.parse(ultimaInteracao.mensagem);

            // Confirmar treinamento (por selectedId ou texto)
            if (selectedId.startsWith('confirmar_treinamento_') ||
                text.toLowerCase().includes('sim')) {

                const treinamentoId = selectedId.startsWith('confirmar_treinamento_') ?
                    parseInt(selectedId.replace('confirmar_treinamento_', '')) :
                    dadosInteracao.treinamentoId;

                const treinamento = await Treinamento.findByPk(treinamentoId);

                if (treinamento) {
                    // Limpar interação anterior para evitar loop
                    await salvarUltimaInteracao(sender, 'treinamento_iniciado', '');

                    await contato.update({
                        statusTreinamento: 'em andamento',
                        treinamentoId: treinamento.id
                    });

                    // Mapear nome do treinamento para nome do arquivo
                    let nomeArquivo = treinamento.nome;

                    // Mapeamento específico para treinamentos
                    if (treinamento.id === 14 || treinamento.nome.toLowerCase().includes('ssma')) {
                        nomeArquivo = 'treinamentoSSMA';
                    }

                    // Executar script dinâmico
                    const script = scriptsTreinamento[nomeArquivo];
                    console.log(`🔍 Executando script: ${nomeArquivo}, script encontrado: ${!!script}`);
                    if (script && script.executarTreinamento) {
                        try {
                            console.log(`🚀 Chamando executarTreinamento para ${nomeArquivo}`);
                            await script.executarTreinamento(sender, contato, sendMessage);
                            return;
                        } catch (error) {
                            console.error(`❌ Erro ao executar script ${nomeArquivo}:`, error);
                            await sendMessage(sender, 'send-message', {
                                message: '❌ Erro ao iniciar treinamento. Entre em contato com o suporte.',
                            });
                            return;
                        }
                    } else {
                        console.error(`❌ Script não encontrado: ${nomeArquivo}`);
                        await sendMessage(sender, 'send-message', {
                            message: '❌ Script de treinamento não encontrado. Entre em contato com o suporte.',
                        });
                        return;
                    }
                }
            }

            // Cancelar seleção (por selectedId ou texto)
            if (selectedId === 'cancelar_selecao' ||
                text.toLowerCase().includes('não') ||
                text.toLowerCase().includes('outro') ||
                text.toLowerCase().includes('cancelar')) {

                await iniciarTreinamento(sender, contato);
                return;
            }
        }

        // Processar seleção de treinamento - detectar por selectedId ou texto
        if (contato.statusTreinamento === 'não iniciado' && ultimaInteracao?.tipo !== 'confirmacao_treinamento' && (selectedId.startsWith('treinamento_') || text.toLowerCase().includes('treinamento básico') || text.toLowerCase().includes('curso') || text.toLowerCase().includes('cipa') || text.toLowerCase().includes('teste') || (text.toLowerCase().includes('ssma') && text.toLowerCase().includes('treinamento')))) {


            let treinamento;

            // Se foi selecionado por ID
            if (selectedId.startsWith('treinamento_')) {
                const treinamentoId = selectedId.replace('treinamento_', '');
                treinamento = await Treinamento.findByPk(treinamentoId);
            } else {
                // Buscar treinamento pelo nome no texto - mais flexível
                const nomeTexto = rawText.trim(); // Usar rawText em vez de text


                treinamento = await Treinamento.findOne({
                    where: {
                        nome: {
                            [Op.like]: `%${nomeTexto}%`
                        }
                    }
                });

                // Se não encontrou, tentar busca mais ampla
                if (!treinamento) {
                    const palavrasChave = nomeTexto.toLowerCase().split(' ');
                    for (const palavra of palavrasChave) {
                        if (palavra.length > 3) { // Só palavras com mais de 3 caracteres
                            treinamento = await Treinamento.findOne({
                                where: {
                                    nome: {
                                        [Op.like]: `%${palavra}%`
                                    }
                                }
                            });
                            if (treinamento) break;
                        }
                    }
                }
            }

            if (treinamento) {
                // Mensagem de confirmação
                const listMsg = {
                    title: '',
                    description: `✅ Você selecionou: **${treinamento.nome}**\n\nConfirma que deseja iniciar este treinamento?`,
                    buttonText: 'Confirmar seleção',
                    listType: 'SINGLE_SELECT',
                    sections: [{
                        title: '',
                        rows: [
                            { id: `confirmar_treinamento_${treinamento.id}`, title: 'Sim, iniciar este treinamento', description: '' },
                            { id: 'cancelar_selecao', title: 'Não, escolher outro', description: '' },
                        ],
                    }],
                };

                await sendMessage(sender, 'send-list-message', listMsg);
                await salvarUltimaInteracao(sender, 'confirmacao_treinamento', JSON.stringify({ ...listMsg, treinamentoId: treinamento.id }));
                return;
            } else {
                await sendMessage(sender, 'send-message', {
                    message: '❌ Treinamento não encontrado.',
                });
                return;
            }
        }




        // PROCESSAR TREINAMENTOS PENDENTES - MÁXIMA PRIORIDADE
        const scriptPendentes = scriptsTreinamento['treinamentoSSMA'];
        if (scriptPendentes && scriptPendentes.processarTreinamentosPendentes) {
            // Verificar se é uma resposta relacionada a treinamentos pendentes
            if (selectedId === 'ver_treinamentos_pendentes' ||
                selectedId === 'nao_ver_treinamentos' ||
                selectedId === 'nao_iniciar_treinamento' ||
                selectedId?.startsWith('iniciar_treinamento_') ||
                text.toLowerCase().includes('ver treinamentos') ||
                text.toLowerCase().includes('não iniciar') ||
                text.toLowerCase().includes('nenhum agora') ||
                (ultimaInteracao?.tipo === 'aguardando_opcao_treinamentos') ||
                (ultimaInteracao?.tipo === 'escolhendo_treinamento_pendente')) {

                console.log('🔍 PROCESSANDO TREINAMENTOS PENDENTES:', { selectedId, text, ultimaInteracao: ultimaInteracao?.tipo });
                const resultadoPendentes = await scriptPendentes.processarTreinamentosPendentes(sender, selectedId, contato, sendMessage, text);
                if (resultadoPendentes) return;
            }
        }

        // Processar respostas de treinamentos específicos PRIMEIRO
        if (contato.treinamentoId && contato.treinamento) {
            // Mapear nome do treinamento para nome do arquivo
            let nomeArquivo = contato.treinamento.nome;

            // Mapeamento específico para treinamentos
            if (contato.treinamentoId === 14 || contato.treinamento.nome.toLowerCase().includes('ssma')) {
                nomeArquivo = 'treinamentoSSMA';
            }

            const script = scriptsTreinamento[nomeArquivo];
            if (script) {
                try {
                    let resultado = false;
                    // Tentar diferentes funções de processamento
                    if (script.processarRespostaSSMA) {
                        resultado = await script.processarRespostaSSMA(sender, text, selectedId, contato, sendMessage);
                    } else if (script.processarRespostaTeste) {
                        resultado = await script.processarRespostaTeste(sender, text, selectedId, contato, sendMessage);
                    }
                    if (resultado) return;
                } catch (error) {
                    console.error(`Erro ao processar resposta do treinamento:`, error);
                }
            }
        }



        // Finalizar treinamento
        if (selectedId === 'finalizar_treinamento' || text === '✅ treinamento finalizado') {
            await sendMessage(sender, 'send-message', {
                message: '👏 Muito bem! Ficamos felizes com sua participação. Até a próxima! 🚀',
            });
            return;
        }


        // Se o usuário tem treinamento em andamento mas não foi processado, mostrar opções
        if (contato.statusTreinamento === 'em andamento' && contato.treinamento) {
            await sendMessage(sender, 'send-message', {
                message: `🔄 Você está no meio do treinamento "${contato.treinamento.nome}". Digite *continuar* para prosseguir ou *reiniciar* para começar novamente.`,
            });
            return;
        }



        // Verificar se é usuário não iniciado que precisa de ajuda (evitar loop)
        if (contato.statusTreinamento === 'não iniciado' && ultimaInteracao?.tipo !== 'treinamento_iniciado' && ultimaInteracao?.tipo !== 'selecionar_treinamento') {
            await iniciarTreinamento(sender, contato);
            return;
        }

        // Mensagem padrão para entradas não reconhecidas
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua mensagem. Por favor, use as opções fornecidas.',
        });

    } catch (error) {
        console.error('❌ Erro processamento:', error.message);
    } finally {
        emProcessamento.delete(sender);
        console.log(`⏱️ TOTAL processamento completo: ${Date.now() - startTime}ms`);
    }
}

// Função para processar mensagem de usuário cadastrado
async function processarMensagemCadastrada(message, client, contato) {
    const sender = message.from.replace('@c.us', '');
    const text = message.body?.toLowerCase() || '';
    const selectedId = message.selectedRowId || '';
    const rawText = message.body || '';

    // Continuar processamento normal para usuário cadastrado
    // (resto da lógica original aqui)
}

// Exportar funções para serem usadas externamente
module.exports = {
    processarMensagem,
    setWppClient,
    sendMessage,
    salvarUltimaInteracao,
    obterUltimaInteracao,
    salvarInteracao: salvarUltimaInteracao // Alias para compatibilidade
};