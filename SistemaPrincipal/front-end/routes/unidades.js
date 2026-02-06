const express = require('express');
const router = express.Router();
const { Unidade, Setor, sequelize } = require('../../BancoDeDados/models');

// Listar todas as unidades da empresa logada
router.get('/', async (req, res) => {
    try {
        const empresaId = req.user?.empresaId || 1; // Ajustar conforme autenticação
        const unidades = await Unidade.findAll({
            where: { empresa_id, ativo: true },
            order: [['nome', 'ASC']]
        });
        res.json(unidades);
    } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        res.status(500).json({ error: 'Erro ao buscar unidades' });
    }
});

// Listar unidades de uma empresa específica
router.get('/empresa/:empresa_id', async (req, res) => {
    try {
        const unidades = await Unidade.findAll({
            where: { empresa_id: req.params.empresaId, ativo: true },
            order: [['nome', 'ASC']]
        });
        res.json(unidades);
    } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        res.status(500).json({ error: 'Erro ao buscar unidades' });
    }
});

// Criar unidade
router.post('/', async (req, res) => {
    try {
        const unidade = await Unidade.create(req.body);
        res.json(unidade);
    } catch (error) {
        console.error('Erro ao criar unidade:', error);
        res.status(500).json({ error: 'Erro ao criar unidade' });
    }
});

// Atualizar unidade
router.put('/:id', async (req, res) => {
    try {
        await Unidade.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar unidade:', error);
        res.status(500).json({ error: 'Erro ao atualizar unidade' });
    }
});

// Deletar unidade (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        await Unidade.update({ ativo: false }, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar unidade:', error);
        res.status(500).json({ error: 'Erro ao deletar unidade' });
    }
});

// Vincular setor à unidade
router.post('/vincular-setor', async (req, res) => {
    try {
        const { unidadeId, setorId } = req.body;
        await sequelize.query(
            'INSERT IGNORE INTO unidade_setores (unidade_id, setor_id) VALUES (?, ?)',
            { replacements: [unidadeId, setorId] }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao vincular setor:', error);
        res.status(500).json({ error: 'Erro ao vincular setor' });
    }
});

// Desvincular setor da unidade
router.delete('/desvincular-setor', async (req, res) => {
    try {
        const { unidadeId, setorId } = req.body;
        await sequelize.query(
            'DELETE FROM unidade_setores WHERE unidade_id = ? AND setor_id = ?',
            { replacements: [unidadeId, setorId] }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao desvincular setor:', error);
        res.status(500).json({ error: 'Erro ao desvincular setor' });
    }
});

module.exports = router;
