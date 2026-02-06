// Sistema de cache otimizado para contatos
const { Usuario } = require('./models');

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
        
        console.log(`🔍 [CACHE] Buscando contato: ${telefone} -> ${numeroLimpo}`);
        
        // Verificar cache primeiro
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TIMEOUT) {
                console.log(`✅ [CACHE] Contato encontrado no cache: ${cached.contato.nome}`);
                return cached.contato;
            }
            this.cache.delete(cacheKey);
        }
        
        try {
            // Gerar variações do número (com e sem 9)
            const variacoes = this.gerarVariacoesNumero(numeroLimpo);
            console.log(`🔢 [CACHE] Variações geradas: ${variacoes.join(', ')}`);
            
            // Buscar por qualquer variação
            const contato = await Usuario.findOne({
                where: { 
                    telefone: {
                        [require('sequelize').Op.in]: variacoes
                    }
                },
                attributes: ['id', 'nome', 'nomeCompleto', 'email', 'telefone', 'empresa_id', 'status_treinamento', 'treinamento_id'],
                logging: false,
                raw: false
            });
            
            // Salvar no cache se encontrou
            if (contato) {
                console.log(`✅ [CACHE] Contato encontrado no BD: ${contato.nome} (${contato.telefone})`);
                this.cache.set(cacheKey, {
                    contato: contato,
                    timestamp: Date.now()
                });
            } else {
                console.log(`❌ [CACHE] Contato NÃO encontrado no BD`);
            }
            
            return contato;
        } catch (error) {
            console.error('❌ [CACHE] Erro buscarContato:', error.message);
            return null;
        }
    }

    // Pré-carregar contatos mais ativos
    async precarregarContatosAtivos() {
        try {
            const contatosAtivos = await Usuario.findAll({
                where: {
                    status_treinamento: ['em andamento', 'não iniciado']
                },
                attributes: ['id', 'nome', 'nomeCompleto', 'email', 'telefone', 'empresa_id', 'status_treinamento', 'treinamento_id'],
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
    
    // Adicionar contato manualmente ao cache (para contatos recém-encontrados)
    adicionarContato(telefone, contato) {
        const numeroLimpo = this.limparNumero(telefone);
        const cacheKey = `contato_${numeroLimpo}`;
        this.cache.set(cacheKey, {
            contato: contato,
            timestamp: Date.now()
        });
        console.log(`➕ Contato adicionado ao cache: ${contato.nome}`);
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
    
    // Gerar variações com e sem o 9
    gerarVariacoesNumero(numero) {
        const variacoes = [numero];
        
        // 10 dígitos (DDD + 8): adicionar 9 e DDI
        if (numero.length === 10) {
            variacoes.push(numero.slice(0, 2) + '9' + numero.slice(2)); // com 9
            variacoes.push('55' + numero); // com DDI
            variacoes.push('55' + numero.slice(0, 2) + '9' + numero.slice(2)); // DDI + 9
        }
        // 11 dígitos (DDD + 9): remover 9 e adicionar DDI
        else if (numero.length === 11 && numero.charAt(2) === '9') {
            variacoes.push(numero.slice(0, 2) + numero.slice(3)); // sem 9
            variacoes.push('55' + numero); // com DDI
            variacoes.push('55' + numero.slice(0, 2) + numero.slice(3)); // DDI sem 9
        }
        // 12 dígitos (DDI + DDD + 8): adicionar 9 e remover DDI
        else if (numero.length === 12 && numero.startsWith('55')) {
            variacoes.push(numero.slice(2)); // sem DDI
            variacoes.push(numero.slice(0, 4) + '9' + numero.slice(4)); // com 9
            variacoes.push(numero.slice(2, 4) + '9' + numero.slice(4)); // sem DDI com 9
        }
        // 13 dígitos (DDI + DDD + 9): remover 9 e remover DDI
        else if (numero.length === 13 && numero.startsWith('55') && numero.charAt(4) === '9') {
            variacoes.push(numero.slice(2)); // sem DDI
            variacoes.push(numero.slice(0, 4) + numero.slice(5)); // sem 9
            variacoes.push(numero.slice(2, 4) + numero.slice(5)); // sem DDI sem 9
        }
        
        return [...new Set(variacoes)];
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