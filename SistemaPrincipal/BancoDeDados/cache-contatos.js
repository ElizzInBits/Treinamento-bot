// Sistema de cache otimizado para contatos
const { Contato } = require('./models');

class CacheContatos {
    constructor() {
        this.cache = new Map();
        this.CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutos
        this.preloadedNumbers = new Set();
        
        // Limpeza automática a cada 10 minutos
        setInterval(() => this.limpezaAutomatica(), 10 * 60 * 1000);
    }

    // Busca super otimizada com cache inteligente
    async buscarContato(telefone) {
        const numeroLimpo = this.limparNumero(telefone);
        const cacheKey = `contato_${numeroLimpo}`;
        
        // Verificar cache primeiro
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TIMEOUT) {
                return cached.contato;
            }
            this.cache.delete(cacheKey);
        }
        
        try {
            // Gerar variações do número (com e sem 9)
            const variacoes = this.gerarVariacoesNumero(numeroLimpo);
            
            // Buscar por qualquer variação
            const contato = await Contato.findOne({
                where: { 
                    telefone: {
                        [require('sequelize').Op.in]: variacoes
                    }
                },
                attributes: ['id', 'nome', 'nomeCompleto', 'email', 'telefone', 'empresaId', 'statusTreinamento', 'treinamentoId'],
                logging: false,
                raw: false
            });
            
            // Salvar no cache se encontrou
            if (contato) {
                this.cache.set(cacheKey, {
                    contato: contato,
                    timestamp: Date.now()
                });
            }
            
            return contato;
        } catch (error) {
            console.error('Erro buscarContato:', error.message);
            return null;
        }
    }

    // Pré-carregar contatos mais ativos
    async precarregarContatosAtivos() {
        try {
            const contatosAtivos = await Contato.findAll({
                where: {
                    statusTreinamento: ['em andamento', 'não iniciado']
                },
                attributes: ['id', 'nome', 'nomeCompleto', 'email', 'telefone', 'empresaId', 'statusTreinamento', 'treinamentoId'],
                limit: 100,
                logging: false
            });
            
            contatosAtivos.forEach(contato => {
                const cacheKey = `contato_${contato.telefone}`;
                this.cache.set(cacheKey, {
                    contato: contato,
                    timestamp: Date.now()
                });
                this.preloadedNumbers.add(contato.telefone);
            });
            
            console.log(`📋 Pré-carregados ${contatosAtivos.length} contatos ativos no cache`);
        } catch (error) {
            console.error('Erro ao pré-carregar contatos:', error.message);
        }
    }

    // Invalidar cache de um contato específico
    invalidarContato(telefone) {
        const numeroLimpo = this.limparNumero(telefone);
        const cacheKey = `contato_${numeroLimpo}`;
        this.cache.delete(cacheKey);
    }

    // Atualizar contato no cache
    atualizarContato(telefone, contato) {
        const numeroLimpo = this.limparNumero(telefone);
        const cacheKey = `contato_${numeroLimpo}`;
        this.cache.set(cacheKey, {
            contato: contato,
            timestamp: Date.now()
        });
    }

    // Limpeza automática do cache
    limpezaAutomatica() {
        const now = Date.now();
        let removidos = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.CACHE_TIMEOUT) {
                this.cache.delete(key);
                removidos++;
            }
        }
        
        if (removidos > 0) {
            console.log(`🧹 Cache limpo: ${removidos} entradas removidas. Ativas: ${this.cache.size}`);
        }
    }

    // Limpar número de telefone
    limparNumero(numero) {
        return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
    }
    
    // Gerar variações do número (com e sem 9)
    gerarVariacoesNumero(numero) {
        const variacoes = [numero];
        
        // Se número tem 13 dígitos (55 + DDD + 9 + 8 dígitos)
        if (numero.length === 13 && numero.startsWith('55')) {
            const semNove = numero.substring(0, 4) + numero.substring(5);
            variacoes.push(semNove);
        }
        // Se número tem 12 dígitos (55 + DDD + 8 dígitos)
        else if (numero.length === 12 && numero.startsWith('55')) {
            const comNove = numero.substring(0, 4) + '9' + numero.substring(4);
            variacoes.push(comNove);
        }
        // Se número tem 11 dígitos (DDD + 9 + 8 dígitos)
        else if (numero.length === 11) {
            const semNove = numero.substring(0, 2) + numero.substring(3);
            variacoes.push(semNove);
        }
        // Se número tem 10 dígitos (DDD + 8 dígitos)
        else if (numero.length === 10) {
            const comNove = numero.substring(0, 2) + '9' + numero.substring(2);
            variacoes.push(comNove);
        }
        
        return variacoes;
    }

    // Estatísticas do cache
    getEstatisticas() {
        return {
            totalEntradas: this.cache.size,
            precarregados: this.preloadedNumbers.size,
            timeout: this.CACHE_TIMEOUT / 1000 / 60 // em minutos
        };
    }
}

// Instância singleton
const cacheContatos = new CacheContatos();

// Pré-carregar contatos na inicialização
setTimeout(() => {
    cacheContatos.precarregarContatosAtivos();
}, 5000); // Aguardar 5 segundos após inicialização

module.exports = cacheContatos;