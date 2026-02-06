const express = require('express');
const router = express.Router();
const { Setor, sequelize } = require('../../BancoDeDados/models');

// Listar todos os setores da empresa
router.get('/', async (req, res) => {
    try {
        const empresaId = req.user?.empresaId || 1;
        const setores = await Setor.findAll({
            where: { empresa_id, ativo: true },
            order: [['nome', 'ASC']]
        });
        res.json(setores);
    } catch (error) {
        console.error('Erro ao buscar setores:', error);
        res.status(500).json({ error: 'Erro ao buscar setores' });
    }
});

// Listar setores de uma unidade
router.get('/unidade/:unidadeId', async (req, res) => {
    try {
        const [setores] = await sequelize.query(
            `SELECT s.* FROM setores s 
             JOIN unidade_setores us ON s.id = us.setor_id 
             WHERE us.unidade_id = ? AND s.ativo = 1 
             ORDER BY s.nome ASC`,
            { replacements: [req.params.unidadeId] }
        );
        res.json(setores);
    } catch (error) {
        console.error('Erro ao buscar setores:', error);
        res.status(500).json({ error: 'Erro ao buscar setores' });
    }
});

// Criar setor
router.post('/', async (req, res) => {
    try {
        const empresaId = req.user?.empresaId || 1;
        const setor = await Setor.create({ ...req.body, empresa_id });
        res.json(setor);
    } catch (error) {
        console.error('Erro ao criar setor:', error);
        res.status(500).json({ error: 'Erro ao criar setor' });
    }
});

// Atualizar setor
router.put('/:id', async (req, res) => {
    try {
        await Setor.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar setor:', error);
        res.status(500).json({ error: 'Erro ao atualizar setor' });
    }
});

// Deletar setor (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        await Setor.update({ ativo: false }, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar setor:', error);
        res.status(500).json({ error: 'Erro ao deletar setor' });
    }
});

module.exports = router;
