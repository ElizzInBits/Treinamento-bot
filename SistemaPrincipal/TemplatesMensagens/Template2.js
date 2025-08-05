const wppconnect = require('@wppconnect-team/wppconnect');
const { sendMessage } = require('./conexao/wppConnectTemplate');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Message = require('../BancoDeDados/models/message');
const { Contato, Interacao, Empresa, EmpresaTreinamento } = require('../BancoDeDados/models');
const Treinamento = require('../BancoDeDados/models/treinamento');
const { gerarCertificadoBanco, enviarEmail } = require('./Certificados/certificados2.js');

// Carregar todos os scripts de treinamento dinamicamente
const scriptsTreinamento = {};
function carregarScriptsTreinamento() {
    const pastaScripts = path.join(__dirname, 'Treinamentos');
    if (fs.existsSync(pastaScripts)) {
        const arquivos = fs.readdirSync(pastaScripts).filter(arquivo => arquivo.endsWith('.js'));
        arquivos.forEach(arquivo => {
            const nomeScript = arquivo.replace('.js', '');
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
    }
}

// Carregar scripts na inicialização
carregarScriptsTreinamento();

// Recarregar scripts a cada processamento (para desenvolvimento)
function recarregarScripts() {
    console.log('🔄 Recarregando scripts de treinamento...');
    carregarScriptsTreinamento();
}



// ========================================
// VARIÁVEIS DE CONTROLE GLOBAIS
// ========================================
const timeouts = {};
const emProcessamento = new Set();
const saudacoesEnviadas = new Set();

// ========================================
// CONSTANTES E CONFIGURAÇÕES
// ========================================
const TEMPO_LEMBRETE = 0.3 * 60 * 1000; // 18 segundos
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Constantes básicas para confirmação de dados
const RESPOSTAS_POSITIVAS = ['sim', 'confirmar', 'dados corretos'];
const RESPOSTAS_NEGATIVAS = ['não', 'dados incorretos', 'corrigir'];

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Limpa um número de telefone removendo caracteres especiais
 */
function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

/**
 * Gera variações de um número brasileiro (com e sem o 9)
 */
function gerarVariacoes(numeroCompleto) {
    const limpo = limparNumero(numeroCompleto);
    if (!limpo.startsWith('55') || limpo.length < 10) return [limpo];

    const ddd = limpo.slice(2, 4);
    const base = limpo.slice(4);
    let var1 = limpo;
    let var2 = limpo;

    if (base.length === 9 && base[0] === '9') {
        var2 = '55' + ddd + base.slice(1);
    } else if (base.length === 8) {
        var2 = '55' + ddd + '9' + base;
    }

    return [var1, var2];
}



// ========================================
// FUNÇÕES DE AGENDAMENTO E INTERAÇÃO
// ========================================

/**
 * Agenda um lembrete para o usuário (DESABILITADO para evitar duplicações)
 */
function agendarLembrete(sender, mensagemLista, tempoMs = TEMPO_LEMBRETE) {
    // Desabilitado temporariamente para evitar mensagens duplicadas
    return;
    
    if (timeouts[sender]) clearTimeout(timeouts[sender]);

    timeouts[sender] = setTimeout(async () => {
        await sendMessage(sender, 'send-message', {
            message: '👀 Ah, parece que alguém se esqueceu de mim... Vamos continuar?',
        });
        await sendMessage(sender, 'send-list-message', mensagemLista);
    }, tempoMs);
}

/**
 * Salva a última interação do usuário no banco
 */
async function salvarUltimaInteracao(sender, tipo, mensagem) {
    await Interacao.upsert({ telefone: sender, tipo, mensagem });
}

/**
 * Obtém a última interação do usuário
 */
async function obterUltimaInteracao(sender) {
    return await Interacao.findOne({
        where: { telefone: sender },
        order: [['updatedAt', 'DESC']],
    });
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
            agendarLembrete(sender, getMensagemListaContinuar());
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
        agendarLembrete(sender, getMensagemListaContinuar());
        return true;
    }

    return false;
}

/**
 * Verifica se o contato está cadastrado
 */
async function verificarCadastro(sender) {
    const senderVariacoes = gerarVariacoes(sender);
    const contatos = await Contato.findAll();

    return contatos.find((c) => {
        const variacoesContato = gerarVariacoes(c.telefone);
        return senderVariacoes.some((num) => variacoesContato.includes(num));
    });
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
        agendarLembrete(sender, getMensagemListaContinuar());
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
        agendarLembrete(sender, getMensagemListaContinuar());
        return true;
    }

    // Correção de email
    if (ultimaInteracao?.tipo === 'corrigir_email') {
        if (!EMAIL_REGEX.test(rawText.trim())) {
            await sendMessage(sender, 'send-message', {
                message: '⚠️ E-mail inválido! Por favor, insira um e-mail válido.',
            });
            await salvarUltimaInteracao(sender, 'corrigir_email', 'Por favor, me envie seu e-mail correto.');
            agendarLembrete(sender, getMensagemListaContinuar());
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
 * Busca treinamentos atribuídos à empresa do usuário
 */
async function buscarTreinamentosEmpresa(empresaId) {
    const treinamentosEmpresa = await EmpresaTreinamento.findAll({
        where: { empresa_id: empresaId }
    });
    
    const treinamentos = [];
    for (const et of treinamentosEmpresa) {
        const treinamento = await Treinamento.findByPk(et.treinamento_id);
        if (treinamento) {
            treinamentos.push(treinamento);
        }
    }
    
    return treinamentos;
}

/**
 * Inicia o treinamento para novos usuários
 */
async function iniciarTreinamento(sender, contato) {
    // Buscar empresa do contato
    const empresa = await Empresa.findByPk(contato.empresaId);
    const nomeEmpresa = empresa ? empresa.razaoSocial : 'sua empresa';
    
    await sendMessage(sender, 'send-message', {
        message: `👋 Olá, ${contato.nome}! Seja bem-vindo(a) à ${nomeEmpresa}! 💼`,
    });

    // Buscar treinamentos da empresa
    const treinamentos = await buscarTreinamentosEmpresa(contato.empresaId);
    
    if (treinamentos.length === 0) {
        await sendMessage(sender, 'send-message', {
            message: '⚠️ Não há treinamentos disponíveis para sua empresa no momento. Entre em contato com o suporte.',
        });
        return;
    }

    await sendMessage(sender, 'send-message', {
        message: '📚 Aqui estão os treinamentos disponíveis para você:',
    });

    // Mostrar treinamentos disponíveis como texto simples primeiro
    const listaTreinamentos = treinamentos.map(t => `${t.nome}\n${t.modalidade} - ${t.cargaHoraria}h`).join('\n\n');
    await sendMessage(sender, 'send-message', {
        message: `*Escolha qual treinamento deseja iniciar:*\n\n${listaTreinamentos}`,
    });

    // Criar lista de treinamentos
    const rows = treinamentos.map((treinamento, index) => ({
        id: `treinamento_${treinamento.id}`,
        title: treinamento.nome,
        description: `${treinamento.modalidade} - ${treinamento.cargaHoraria}h`
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

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarUltimaInteracao(sender, 'selecionar_treinamento', JSON.stringify(listMsg));
    // Remover lembrete para evitar duplicações
    // agendarLembrete(sender, getMensagemListaContinuar());
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
          modalidade: treinamento.modalidade,
          cargaHoraria: treinamento.cargaHoraria.toString(),
          tipo: treinamento.tipo,
          emConformidade: treinamento.emConformidade,
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

async function processarMensagem(message) {
    const sender = message.from.replace('@c.us', '');

    if (emProcessamento.has(sender)) {
        console.log(`⏳ Ignorando nova mensagem de ${sender}, já está em processamento.`);
        return;
    }

    emProcessamento.add(sender);

    try {
        const text = message.body?.toLowerCase() || '';
        const selectedId = message.selectedRowId || '';
        const rawText = message.body || '';

        await salvarUltimaInteracao(sender, 'resposta', rawText.trim());

        if (timeouts[sender]) clearTimeout(timeouts[sender]);

        // Verificação de cadastro primeiro
        const contato = await verificarCadastro(sender);
        if (!contato) {
            await sendMessage(sender, 'send-message', {
                message: `🤔 Humm, parece que você ainda não fez seu cadastro.\nClique no link abaixo para se cadastrar e iniciar seu treinamento:\n\n👉 bit.ly/44xw45W`,
            });
            return;
        }

        // Saudação inicial apenas uma vez
        if (!saudacoesEnviadas.has(sender)) {
            console.log('📤 PRIMEIRA INTERAÇÃO COM:', sender);
            saudacoesEnviadas.add(sender);
            
            // Se é primeira vez E não há interação anterior, iniciar treinamento
            if (contato.statusTreinamento === 'não iniciado') {
                const ultimaInteracao = await obterUltimaInteracao(sender);
                if (!ultimaInteracao || ultimaInteracao.tipo === 'resposta') {
                    await iniciarTreinamento(sender, contato);
                    return;
                }
            }
        }

        // Processar comandos continuar/pausar
        if (await processarComandosContinuar(sender, text, selectedId)) {
            return;
        }



        // ✅ Atualizar a última interação no campo do contato
        contato.ultimaInteracao = rawText.trim();
        await contato.save();

        const correuCorrecao = await processarCorrecaoDados(sender, rawText, contato);
        if (correuCorrecao) return;

        console.log(`📩 Mensagem de ${sender} (${contato.nome}): ${text}`);

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

        // Processar seleção de treinamento - detectar por selectedId ou texto
        if (contato.statusTreinamento === 'não iniciado' && (selectedId.startsWith('treinamento_') || text.toLowerCase().includes('treinamento'))) {
            console.log(`✅ Detectou seleção de treinamento`);
            
            let treinamento;
            
            // Se foi selecionado por ID
            if (selectedId.startsWith('treinamento_')) {
                const treinamentoId = selectedId.replace('treinamento_', '');
                treinamento = await Treinamento.findByPk(treinamentoId);
            } else {
                // Buscar treinamento pelo nome no texto
                const nomeTexto = text.split('\n')[0].trim();
                treinamento = await Treinamento.findOne({
                    where: {
                        nome: {
                            [Op.like]: `%${nomeTexto}%`
                        }
                    }
                });
            }
            
            if (treinamento) {
                console.log(`✅ Executando treinamento:`, treinamento.nome);
                await contato.update({ 
                    statusTreinamento: 'em andamento',
                    treinamentoId: treinamento.id 
                });
                
                // Converter nome do banco para nome do arquivo
                const nomeArquivo = treinamento.nome
                    .toLowerCase()
                    .split(' ')
                    .map((palavra) => {
                        if (['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para'].includes(palavra)) {
                            return palavra;
                        }
                        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
                    })
                    .join(' ');
                
                // Recarregar scripts antes de executar (para desenvolvimento)
                recarregarScripts();
                
                // Executar script dinâmico
                const script = scriptsTreinamento[nomeArquivo];
                if (script && script.executarTreinamento) {
                    try {
                        console.log(`✅ Executando script: ${nomeArquivo}`);
                        await script.executarTreinamento(sender, contato);
                        console.log(`✅ Script executado com sucesso`);
                        return;
                    } catch (error) {
                        console.error(`❌ Erro ao executar script:`, error);
                    }
                } else {
                    console.log(`❌ Script não encontrado: ${nomeArquivo}`);
                }
            }
        }

        // Evitar reinicialização desnecessária
        if (contato.statusTreinamento === 'não iniciado' && !selectedId.startsWith('treinamento_')) {
            // Só reiniciar se não há interação recente
            const ultimaInteracao = await obterUltimaInteracao(sender);
            if (!ultimaInteracao || ultimaInteracao.tipo !== 'selecionar_treinamento') {
                await iniciarTreinamento(sender, contato);
                return;
            }
        }
        
        // Processar respostas de treinamentos específicos PRIMEIRO
        if (contato.treinamentoId) {
            const treinamento = await Treinamento.findByPk(contato.treinamentoId);
            if (treinamento) {
                // Converter nome do banco para nome do arquivo
                const nomeArquivo = treinamento.nome
                    .toLowerCase()
                    .split(' ')
                    .map((palavra) => {
                        if (['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para'].includes(palavra)) {
                            return palavra;
                        }
                        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
                    })
                    .join(' ');
                
                // Recarregar scripts antes de processar (para desenvolvimento)
                recarregarScripts();
                
                // Tentar processar com script específico
                const script = scriptsTreinamento[nomeArquivo];
                console.log(`🔍 Tentando processar com script: ${nomeArquivo}`);
                console.log(`🔍 Script encontrado:`, !!script);
                console.log(`🔍 Função processarRespostaTeste:`, !!script?.processarRespostaTeste);
                console.log(`🔍 selectedId recebido: '${selectedId}'`);
                console.log(`🔍 text recebido: '${text}'`);
                
                if (script && script.processarRespostaTeste) {
                    try {
                        console.log(`🔍 Executando processarRespostaTeste`);
                        const resultado = await script.processarRespostaTeste(sender, text, selectedId, contato);
                        console.log(`🔍 Resultado do processamento:`, resultado);
                        if (resultado) {
                            console.log(`✅ Resposta processada pelo script`);
                            return;
                        }
                    } catch (error) {
                        console.error(`Erro ao processar resposta do treinamento ${treinamento.nome}:`, error);
                    }
                } else {
                    console.log(`❌ Script ou função não encontrada para: ${nomeArquivo}`);
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


        // Mensagem padrão para entradas não reconhecidas
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua mensagem. Por favor, use as opções fornecidas.',
        });
        agendarLembrete(sender, getMensagemListaContinuar());

    } catch (error) {
        console.error('Erro no processamento da mensagem:', error);
    } finally {
        emProcessamento.delete(sender);
    }
}

// Exportar função para ser usada externamente
module.exports = { processarMensagem };