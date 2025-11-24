const express = require('express');
const router = express.Router();
const { Fluxo } = require('../../BancoDeDados/models');

// Listar todos os fluxos
router.get('/', async (req, res) => {
    try {
        const fluxos = await Fluxo.findAll({ where: { ativo: true }, order: [['criadoEm', 'DESC']] });
        res.json(fluxos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buscar fluxo por ID
router.get('/:id', async (req, res) => {
    try {
        const fluxo = await Fluxo.findByPk(req.params.id);
        if (!fluxo) return res.status(404).json({ error: 'Fluxo não encontrado' });
        res.json(fluxo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar novo fluxo
router.post('/', async (req, res) => {
    try {
        const fluxo = await Fluxo.create(req.body);
        res.status(201).json(fluxo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Atualizar fluxo
router.put('/:id', async (req, res) => {
    try {
        const fluxo = await Fluxo.findByPk(req.params.id);
        if (!fluxo) return res.status(404).json({ error: 'Fluxo não encontrado' });
        await fluxo.update({ ...req.body, atualizadoEm: new Date() });
        res.json(fluxo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar fluxo (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const fluxo = await Fluxo.findByPk(req.params.id);
        if (!fluxo) return res.status(404).json({ error: 'Fluxo não encontrado' });
        await fluxo.update({ ativo: false });
        res.json({ message: 'Fluxo deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
