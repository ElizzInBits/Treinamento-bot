const express = require('express');
const router = express.Router();
const Empresa = require('../../BancoDeDados/models/empresas');

// Listar todas as empresas
router.get('/', async (req, res) => {
    try {
        const empresas = await Empresa.findAll({ order: [['nome', 'ASC']] });
        res.json(empresas);
    } catch (error) {
        console.error('Erro ao listar empresas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar empresa por ID
router.get('/:id', async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id);
        if (!empresa) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }
        res.json(empresa);
    } catch (error) {
        console.error('Erro ao buscar empresa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar nova empresa
router.post('/', async (req, res) => {
    try {
        const { nome, cnpj, telefone, endereco } = req.body;

        if (!nome || !cnpj) {
            return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios' });
        }

        // Aqui você pode adicionar validações específicas para CNPJ, telefone, etc

        const novaEmpresa = await Empresa.create({
            nome: nome.trim(),
            cnpj: cnpj.replace(/\D/g, ''),
            telefone: telefone ? telefone.trim() : null,
            endereco: endereco ? endereco.trim() : null,
        });

        res.status(201).json({
            message: 'Empresa criada com sucesso',
            empresa: novaEmpresa
        });
    } catch (error) {
        console.error('Erro ao criar empresa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar empresa
router.put('/:id', async (req, res) => {
    try {
        const { nome, cnpj, telefone, endereco } = req.body;
        const empresa = await Empresa.findByPk(req.params.id);

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        const camposParaAtualizar = {};
        if (nome) camposParaAtualizar.nome = nome.trim();
        if (cnpj) camposParaAtualizar.cnpj = cnpj.replace(/\D/g, '');
        if (telefone !== undefined) camposParaAtualizar.telefone = telefone ? telefone.trim() : null;
        if (endereco !== undefined) camposParaAtualizar.endereco = endereco ? endereco.trim() : null;

        await empresa.update(camposParaAtualizar);

        res.json({
            message: 'Empresa atualizada com sucesso',
            empresa: empresa
        });
    } catch (error) {
        console.error('Erro ao atualizar empresa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Deletar empresa
router.delete('/:id', async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id);

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        await empresa.destroy();
        res.json({ message: 'Empresa deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar empresa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
