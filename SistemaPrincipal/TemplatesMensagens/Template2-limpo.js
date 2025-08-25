// Variável global para o cliente
let wppClient = null;

function setWppClient(client) {
  wppClient = client;
}

// Função sendMessage
async function sendMessage(phone, endpoint, body = {}) {
  if (!wppClient) return false;
  
  try {
    const to = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    
    switch (endpoint) {
      case 'send-message':
        return await wppClient.sendText(to, body.message);
      case 'send-list-message':
        return await wppClient.sendListMessage(to, body);
      case 'send-file':
        return await wppClient.sendFile(to, body.path, body.filename, body.caption);
      default:
        return false;
    }
  } catch (error) {
    console.error(`❌ ${endpoint}:`, error.message);
    return false;
  }
}

const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { Contato, Interacao, EmpresaTreinamento, Treinamento } = require('../BancoDeDados/models');

// Carregar scripts de treinamento
const scriptsTreinamento = {};
function carregarScriptsTreinamento() {
    const pastaLCM = path.join(__dirname, 'Treinamentos', 'LCM');
    if (fs.existsSync(pastaLCM)) {
        const arquivos = fs.readdirSync(pastaLCM).filter(arquivo => arquivo.endsWith('.js'));
        arquivos.forEach(arquivo => {
            const nomeScript = arquivo.replace('.js', '');
            try {
                const caminhoCompleto = path.resolve(__dirname, 'Treinamentos', 'LCM', arquivo);
                delete require.cache[caminhoCompleto];
                scriptsTreinamento[nomeScript] = require(`./Treinamentos/LCM/${arquivo}`);
                console.log(`📝 Script carregado: ${nomeScript}`);
            } catch (error) {
                console.error(`❌ Erro ao carregar script ${arquivo}:`, error);
            }
        });
    }
}
carregarScriptsTreinamento();

// Variáveis de controle
const emProcessamento = new Set();
const cacheContatos = new Map();
const CACHE_TIMEOUT = 2 * 60 * 1000;

// Constantes
const RESPOSTAS_POSITIVAS = ['sim', 'confirmar', 'vamos', 'começar', 'iniciar', 'pronto', 'ok', 'vamos nessa'];
const RESPOSTAS_NEGATIVAS = ['não', 'nao', 'depois', 'mais tarde', 'preciso me preparar'];

function verificarResposta(texto, tipo = 'positiva') {
    const textoLimpo = texto.toLowerCase().trim();
    const respostas = tipo === 'positiva' ? RESPOSTAS_POSITIVAS : RESPOSTAS_NEGATIVAS;
    return respostas.some(resposta => textoLimpo.includes(resposta));
}

function verificarRespostaQuiz(texto) {
    const textoLimpo = texto.toLowerCase().trim();
    return /^[abcd]\)|\b[abcd]\)|[abcd]$/.test(textoLimpo);
}

function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

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

async function verificarCadastro(sender) {
    const limpo = limparNumero(sender);
    const cacheKey = `contato_${limpo}`;
    
    if (cacheContatos.has(cacheKey)) {
        const cached = cacheContatos.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TIMEOUT) {
            return cached.contato;
        }
        cacheContatos.delete(cacheKey);
    }
    
    try {
        let contato = await Contato.findOne({
            where: { telefone: limpo },
            attributes: ['id', 'nome', 'nomeCompleto', 'email', 'telefone', 'empresaId', 'statusTreinamento', 'treinamentoId'],
            logging: false
        });
        
        if (!contato) {
            contato = await Contato.findOne({
                where: { telefone: { [Op.like]: `%${limpo.slice(-8)}` } },
                attributes: ['id', 'nome', 'nomeCompleto', 'email', 'telefone', 'empresaId', 'statusTreinamento', 'treinamentoId'],
                logging: false
            });
        }
        
        if (contato) {
            cacheContatos.set(cacheKey, {
                contato: contato,
                timestamp: Date.now()
            });
        }
        
        return contato;
    } catch (error) {
        console.error('Erro verificarCadastro:', error.message);
        return null;
    }
}

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

async function iniciarTreinamento(sender, contato) {
    await sendMessage(sender, 'send-message', {
        message: `👋 Olá, ${contato.nome}! Seja bem-vindo(a) ao sistema de treinamentos!`,
    });

    const treinamentos = await buscarTreinamentosEmpresa(contato.empresaId);
    
    if (treinamentos.length === 0) {
        await sendMessage(sender, 'send-message', {
            message: '⚠️ Não há treinamentos disponíveis. Entre em contato com o suporte.',
        });
        return;
    }

    const rows = treinamentos.map(treinamento => ({
        id: `treinamento_${treinamento.id}`,
        title: treinamento.nome,
        description: ''
    }));

    const listMsg = {
        title: '',
        description: 'Escolha seu treinamento:',
        buttonText: 'Selecionar',
        listType: 'SINGLE_SELECT',
        sections: [{ title: '', rows }]
    };

    await sendMessage(sender, 'send-list-message', listMsg);
    await salvarUltimaInteracao(sender, 'selecionar_treinamento', JSON.stringify(listMsg));
}

async function processarMensagem(message, client) {
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

        const contato = await verificarCadastro(sender);
        
        if (!contato) {
            await sendMessage(sender, 'send-message', {
                message: `🤖 Olá! Eu sou um bot de treinamentos! 🚀\n\nEstou aqui para aplicar treinamentos de segurança e saúde no trabalho.\n\n🤔 Humm, parece que você ainda não fez seu cadastro.\nClique no link abaixo para se cadastrar e iniciar seu treinamento:\n\n👉 https://abrir.link/kAgON`,
            });
            return;
        }
        
        if (contato.statusTreinamento === 'não iniciado') {
            await iniciarTreinamento(sender, contato);
            return;
        }

        // Processar SSMA
        const script = scriptsTreinamento['treinamentoSSMA'];
        if (script && script.processarRespostaSSMA) {
            if (selectedId === 'rever_modulo1' || selectedId === 'rever_modulo2' ||
                selectedId === 'iniciar_ssma' || selectedId === 'nao_iniciar_ssma' ||
                verificarResposta(text, 'positiva') || verificarResposta(text, 'negativa') ||
                verificarRespostaQuiz(text) ||
                selectedId?.includes('_q') || selectedId?.includes('_m2q')) {
                
                try {
                    const resultado = await script.processarRespostaSSMA(sender, text, selectedId, contato, sendMessage);
                    if (resultado) return;
                } catch (error) {
                    console.error(`Erro ao processar resposta SSMA:`, error);
                }
            }
        }

        // Seleção de treinamento
        if (selectedId.startsWith('treinamento_')) {
            const treinamentoId = selectedId.replace('treinamento_', '');
            const treinamento = await Treinamento.findByPk(treinamentoId);
            
            if (treinamento) {
                await contato.update({ 
                    statusTreinamento: 'em andamento',
                    treinamentoId: treinamento.id 
                });
                
                const script = scriptsTreinamento['treinamentoSSMA'];
                if (script && script.executarTreinamento) {
                    await script.executarTreinamento(sender, contato, sendMessage);
                    return;
                }
            }
        }

        // Finalizar treinamento
        if (selectedId === 'finalizar_treinamento') {
            await sendMessage(sender, 'send-message', {
                message: '👏 Muito bem! Ficamos felizes com sua participação. Até a próxima! 🚀',
            });
            return;
        }

        // Mensagem padrão
        await sendMessage(sender, 'send-message', {
            message: '🤔 Não entendi sua mensagem. Por favor, use as opções fornecidas.',
        });

    } catch (error) {
        console.error('❌ Erro processamento:', error.message);
    } finally {
        emProcessamento.delete(sender);
    }
}

module.exports = { 
    processarMensagem, 
    setWppClient, 
    sendMessage, 
    salvarUltimaInteracao, 
    obterUltimaInteracao
};