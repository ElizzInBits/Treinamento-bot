// routes/contatos.js
const express = require('express');
const router = express.Router();
const Contato = require('../../BancoDeDados/models/contato');

// Função para limpar número (mesma do seu código)
function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

// Função para validar telefone - Apenas DDI+DDD (igual ao frontend)
function validarTelefone(telefone) {
    const cleaned = limparNumero(telefone);
    
    // Aceitar apenas números com 12 ou 13 dígitos (DDI+DDD+número)
    if (cleaned.length !== 12 && cleaned.length !== 13) {
        return false;
    }
    
    // Validar se os primeiros 2 dígitos são um DDI válido (10-99)
    const ddi = cleaned.slice(0, 2);
    if (parseInt(ddi) < 10 || parseInt(ddi) > 99) {
        return false;
    }
    
    // Validar se os próximos 2 dígitos são um DDD válido (11-99)
    const ddd = cleaned.slice(2, 4);
    if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
        return false;
    }
    
    // Validar se o número tem o tamanho correto após DDI+DDD
    const numero = cleaned.slice(4);
    if (numero.length !== 8 && numero.length !== 9) {
        return false;
    }
    
    return true;
}

// Função para gerar variações (atualizada para trabalhar com DDI+DDD)
function gerarVariacoes(numeroCompleto) {
    const limpo = limparNumero(numeroCompleto);
    
    // Se não tem pelo menos 12 dígitos, retorna apenas o número limpo
    if (limpo.length < 12) return [limpo];
    
    // Verifica se começa com DDI 55 (Brasil)
    if (!limpo.startsWith('55')) return [limpo];
    
    const ddd = limpo.slice(2, 4);
    const base = limpo.slice(4);
    
    let var1 = limpo;
    let var2 = limpo;
    
    // Gera variações com e sem o 9 no celular
    if (base.length === 9 && base[0] === '9') {
        // Remove o 9 do celular
        var2 = '55' + ddd + base.slice(1);
    } else if (base.length === 8) {
        // Adiciona o 9 no celular
        var2 = '55' + ddd + '9' + base;
    }
    
    return [var1, var2];
}


// POST /api/contatos
router.post('/', async (req, res) => {
  try {
    const { nome, telefone, treinamentoId } = req.body;
    const novoContato = await Contato.create({ nome, telefone, treinamentoId });
    res.status(201).json(novoContato);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Erro ao criar contato.' });
  }
});

// Listar todos os contatos
router.get('/', async (req, res) => {
    try {
        const contatos = await Contato.findAll({
            order: [['nome', 'ASC']]
        });
        res.json(contatos);
    } catch (error) {
        console.error('Erro ao listar contatos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar contato por ID
router.get('/:id', async (req, res) => {
    try {
        const contato = await Contato.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }
        res.json(contato);
    } catch (error) {
        console.error('Erro ao buscar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Cadastrar novo contato
router.post('/', async (req, res) => {
    try {
        const { nome, telefone } = req.body;

        // Validação básica
        if (!nome || !telefone) {
            return res.status(400).json({ 
                error: 'Nome e telefone são obrigatórios' 
            });
        }

        // Limpar e validar telefone
        const telefoneLimpo = limparNumero(telefone);
        
        // Validar usando a mesma função do frontend
        if (!validarTelefone(telefoneLimpo)) {
            return res.status(400).json({ 
                error: 'Por favor, insira um telefone válido com DDI+DDD+número (12 ou 13 dígitos)' 
            });
        }

        // Verificar se já existe contato com este telefone
        const variacoesTelefone = gerarVariacoes(telefoneLimpo);
        const contatosExistentes = await Contato.findAll();
        
        const jaExiste = contatosExistentes.some(contato => {
            const variacoesContato = gerarVariacoes(contato.telefone);
            return variacoesTelefone.some(num => variacoesContato.includes(num));
        });

        if (jaExiste) {
            return res.status(400).json({ 
                error: 'Já existe um contato com este telefone' 
            });
        }

        // Criar novo contato
        const novoContato = await Contato.create({
            nome: nome.trim(),
            telefone: telefoneLimpo,
            statusTreinamento: 'não iniciado'
        });

        res.status(201).json({
            message: 'Contato cadastrado com sucesso',
            contato: novoContato
        });

    } catch (error) {
        console.error('Erro ao cadastrar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar contato
router.put('/:id', async (req, res) => {
    try {
        const { nome, telefone, nomeCompleto, email, statusTreinamento } = req.body;
        
        const contato = await Contato.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        // Validar telefone se fornecido
        if (telefone) {
            const telefoneLimpo = limparNumero(telefone);
            
            // Validar usando a mesma função do frontend
            if (!validarTelefone(telefoneLimpo)) {
                return res.status(400).json({ 
                    error: 'Por favor, insira um telefone válido com DDI+DDD+número (12 ou 13 dígitos)' 
                });
            }

            // Verificar se já existe outro contato com este telefone
            const variacoesTelefone = gerarVariacoes(telefoneLimpo);
            const contatosExistentes = await Contato.findAll({
                where: { id: { [require('sequelize').Op.ne]: req.params.id } }
            });
            
            const jaExiste = contatosExistentes.some(outroContato => {
                const variacoesContato = gerarVariacoes(outroContato.telefone);
                return variacoesTelefone.some(num => variacoesContato.includes(num));
            });

            if (jaExiste) {
                return res.status(400).json({ 
                    error: 'Já existe outro contato com este telefone' 
                });
            }
        }

        // Atualizar campos
        const camposParaAtualizar = {};
        if (nome) camposParaAtualizar.nome = nome.trim();
        if (telefone) camposParaAtualizar.telefone = limparNumero(telefone);
        if (nomeCompleto !== undefined) camposParaAtualizar.nomeCompleto = nomeCompleto;
        if (email !== undefined) camposParaAtualizar.email = email;
        if (statusTreinamento) camposParaAtualizar.statusTreinamento = statusTreinamento;

        await contato.update(camposParaAtualizar);

        res.json({
            message: 'Contato atualizado com sucesso',
            contato: contato
        });

    } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Deletar contato
router.delete('/:id', async (req, res) => {
    try {
        const contato = await Contato.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        await contato.destroy();
        res.json({ message: 'Contato deletado com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar contatos por status de treinamento
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const statusValidos = ['não iniciado', 'em andamento', 'concluído'];
        
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ 
                error: 'Status inválido. Use: não iniciado, em andamento ou concluído' 
            });
        }

        const contatos = await Contato.findAll({
            where: { statusTreinamento: status },
            order: [['nome', 'ASC']]
        });

        res.json(contatos);

    } catch (error) {
        console.error('Erro ao buscar contatos por status:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar contatos por nome (pesquisa)
router.get('/search/:termo', async (req, res) => {
    try {
        const { termo } = req.params;
        const { Op } = require('sequelize');

        const contatos = await Contato.findAll({
            where: {
                [Op.or]: [
                    { nome: { [Op.like]: `%${termo}%` } },
                    { telefone: { [Op.like]: `%${termo}%` } },
                    { nomeCompleto: { [Op.like]: `%${termo}%` } },
                    { email: { [Op.like]: `%${termo}%` } }
                ]
            },
            order: [['nome', 'ASC']]
        });

        res.json(contatos);

    } catch (error) {
        console.error('Erro ao pesquisar contatos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;