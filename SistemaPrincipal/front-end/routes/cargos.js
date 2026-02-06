const express = require('express');
const router = express.Router();
const { Cargo } = require('../../BancoDeDados/models');

// Listar todos os cargos da empresa
router.get('/', async (req, res) => {
    try {
        const empresaId = req.user?.empresaId || 1;
        const cargos = await Cargo.findAll({
            where: { empresa_id, ativo: true },
            order: [['nome', 'ASC']]
        });
        res.json(cargos);
    } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        res.status(500).json({ error: 'Erro ao buscar cargos' });
    }
});

// Listar cargos de uma unidade (mantido para compatibilidade)
router.get('/unidade/:unidadeId', async (req, res) => {
    try {
        const cargos = await Cargo.findAll({
            where: { unidadeId: req.params.unidadeId, ativo: true },
            order: [['nome', 'ASC']]
        });
        res.json(cargos);
    } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        res.status(500).json({ error: 'Erro ao buscar cargos' });
    }
});

// Criar cargo
router.post('/', async (req, res) => {
    try {
        const empresaId = req.user?.empresaId || 1;
        const cargo = await Cargo.create({ ...req.body, empresa_id });
        res.json(cargo);
    } catch (error) {
        console.error('Erro ao criar cargo:', error);
        res.status(500).json({ error: 'Erro ao criar cargo' });
    }
});

// Atualizar cargo
router.put('/:id', async (req, res) => {
    try {
        await Cargo.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar cargo:', error);
        res.status(500).json({ error: 'Erro ao atualizar cargo' });
    }
});

// Deletar cargo (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        await Cargo.update({ ativo: false }, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar cargo:', error);
        res.status(500).json({ error: 'Erro ao deletar cargo' });
    }
});

module.exports = router;
