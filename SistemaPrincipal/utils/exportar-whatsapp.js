const fs = require('fs');
const path = require('path');
const { Interacao, Usuario } = require('../BancoDeDados/models');
const { Op } = require('sequelize');

class ExportadorWhatsApp {
    constructor() {
        this.exportDir = path.join(__dirname, '..', 'exports-whatsapp');
        this.criarDiretorio();
    }

    criarDiretorio() {
        if (!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir, { recursive: true });
        }
    }

    async exportarConversa(telefone, limite = 1000) {
        try {
            // Limpar formato do telefone
            const telefoneFormatado = telefone.replace('@c.us', '');
            
            // Gerar variações do telefone (com e sem 9 extra)
            const variacoesTelefone = this.gerarVariacoesTelefone(telefoneFormatado);
            
            // Buscar usuário
            const usuario = await Usuario.findOne({ 
                where: { 
                    telefone: { [Op.in]: variacoesTelefone } 
                } 
            });
            
            // Buscar interações com diferentes formatos de telefone
            const condicoesOr = [];
            variacoesTelefone.forEach(tel => {
                condicoesOr.push({ telefone: tel });
                condicoesOr.push({ telefone: tel + '@c.us' });
            });
            
            let interacoes = await Interacao.findAll({
                where: { [Op.or]: condicoesOr },
                order: [['createdAt', 'ASC']],
                limit: limite
            });
            
            // Se não encontrou, buscar qualquer interação para debug
            if (interacoes.length === 0) {
                const totalInteracoes = await Interacao.count();
                const exemploInteracao = await Interacao.findOne({ order: [['createdAt', 'DESC']] });
                
                const msgUsuario = usuario ? `Usuário ${usuario.nome} encontrado, mas` : 'Usuário não encontrado e';
                
                return { 
                    sucesso: false, 
                    erro: `${msgUsuario} nenhuma interação registrada para ${telefoneFormatado}. Variações testadas: ${variacoesTelefone.join(', ')}. Total de interações no banco: ${totalInteracoes}. Exemplo: ${exemploInteracao?.telefone || 'N/A'}` 
                };
            }

            // Formatar no estilo WhatsApp
            const conteudo = this.formatarEstiloWhatsApp(interacoes, usuario);
            
            // Salvar arquivo
            const nomeArquivo = `WhatsApp_Chat_${telefoneFormatado.replace(/\D/g, '')}_${new Date().toISOString().slice(0, 10)}.txt`;
            const caminhoArquivo = path.join(this.exportDir, nomeArquivo);
            
            fs.writeFileSync(caminhoArquivo, conteudo, 'utf8');

            return {
                sucesso: true,
                arquivo: nomeArquivo,
                caminho: caminhoArquivo,
                totalMensagens: interacoes.length
            };

        } catch (error) {
            console.error('Erro ao exportar conversa:', error);
            return { sucesso: false, erro: error.message };
        }
    }

    formatarEstiloWhatsApp(interacoes, usuario) {
        let conteudo = '';
        const nomeUsuario = usuario?.nome || 'Usuário';
        
        interacoes.forEach(interacao => {
            const data = new Date(interacao.createdAt);
            const dataFormatada = data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // Extrair mensagem
            let mensagemTexto = '';
            let remetente = 'Bot Treinamento';
            
            try {
                // Verificar tipo da interação primeiro
                if (interacao.tipo === 'mensagem_usuario' || interacao.tipo === 'resposta_usuario') {
                    remetente = nomeUsuario;
                    
                    const mensagemObj = typeof interacao.mensagem === 'string' 
                        ? JSON.parse(interacao.mensagem) 
                        : interacao.mensagem;
                    
                    // Extrair texto da mensagem do usuário
                    mensagemTexto = mensagemObj.body || mensagemObj.text || mensagemObj.mensagem || '[Mensagem sem texto]';
                } else {
                    // Mensagem do bot
                    const mensagemObj = typeof interacao.mensagem === 'string' 
                        ? JSON.parse(interacao.mensagem) 
                        : interacao.mensagem;
                    
                    if (mensagemObj.body) {
                        mensagemTexto = mensagemObj.body;
                    } else if (mensagemObj.mensagem) {
                        mensagemTexto = mensagemObj.mensagem;
                    } else if (mensagemObj.text) {
                        mensagemTexto = mensagemObj.text;
                    } else if (typeof mensagemObj === 'string') {
                        mensagemTexto = mensagemObj;
                    } else {
                        // Traduzir códigos de etapa para mensagens legíveis
                        mensagemTexto = this.traduzirEtapa(interacao.tipo);
                    }
                }
                
            } catch (e) {
                mensagemTexto = this.traduzirEtapa(interacao.tipo);
            }
            
            conteudo += `[${dataFormatada}] ${remetente}: ${mensagemTexto}
`;
        });

        return conteudo;
    }

    gerarVariacoesTelefone(telefone) {
        const variacoes = [telefone];
        
        // Padrão: 55 + DDD (2 dígitos) + número
        // Ex: 553399595511 ou 5533999595511
        if (telefone.startsWith('55') && telefone.length >= 12) {
            const ddd = telefone.substring(2, 4);
            const resto = telefone.substring(4);
            
            // Se tem 11 dígitos após o 55+DDD (ex: 5533999595511)
            if (resto.length === 11 && resto.startsWith('9')) {
                // Adicionar versão sem o 9 extra: 553399595511
                variacoes.push('55' + ddd + resto.substring(1));
            }
            // Se tem 10 dígitos após o 55+DDD (ex: 553399595511)
            else if (resto.length === 10 && resto.startsWith('9')) {
                // Adicionar versão com 9 extra: 5533999595511
                variacoes.push('55' + ddd + '9' + resto);
            }
        }
        
        return variacoes;
    }

    traduzirEtapa(tipo) {
        const traducoes = {
            'saudacao_inicial': 'Olá! Como posso ajudar você hoje?',
            'treinamentos_pendentes': 'Você tem treinamentos pendentes. Gostaria de fazer algum?',
            'epc_epi_iniciado': 'Iniciando treinamento de EPC e EPI...',
            'epc_epi_introducao': 'Vamos falar sobre EPC e EPI. Você já ouviu falar deles?',
            'epc_epi_audio_confirmacao': 'Enviando áudio explicativo sobre EPC e EPI...',
            'epc_epi_perigo_risco': 'Vamos entender a diferença entre perigo e risco...',
            'epc_epi_pergunta_b': 'Qual a diferença entre EPC e EPI?',
            'finalizado': 'Treinamento finalizado com sucesso!',
            'menu_principal': 'Menu principal - Escolha uma opção:',
            'resposta_usuario': 'Resposta do usuário',
            'mensagem_usuario': 'Mensagem do usuário'
        };
        
        return traducoes[tipo] || `[${tipo}]`;
    }

    async listarExports() {
        try {
            const arquivos = fs.readdirSync(this.exportDir)
                .filter(arquivo => arquivo.endsWith('.txt'))
                .map(arquivo => {
                    const stats = fs.statSync(path.join(this.exportDir, arquivo));
                    return {
                        nome: arquivo,
                        tamanho: stats.size,
                        criado: stats.birthtime
                    };
                })
                .sort((a, b) => b.criado - a.criado);
            
            return { sucesso: true, arquivos };
        } catch (error) {
            return { sucesso: false, erro: error.message };
        }
    }
}

module.exports = ExportadorWhatsApp;