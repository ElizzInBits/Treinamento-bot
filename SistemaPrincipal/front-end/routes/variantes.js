const express = require('express');
const router = express.Router();
const { TreinamentoVariante, Treinamento, Empresa } = require('../../BancoDeDados/models');

// Listar variantes de um treinamento
router.get('/:treinamentoId', async (req, res) => {
  try {
    const variantes = await TreinamentoVariante.findAll({
      where: { treinamentoBaseId: req.params.treinamentoId },
      include: [
        { model: Empresa, as: 'empresa', attributes: ['id', 'nome'] },
        { model: Treinamento, as: 'treinamentoBase', attributes: ['id', 'nome'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(variantes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar variante
router.post('/', async (req, res) => {
  try {
    const variante = await TreinamentoVariante.create(req.body);
    res.status(201).json(variante);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar variante
router.put('/:id', async (req, res) => {
  try {
    await TreinamentoVariante.update(req.body, { where: { id: req.params.id } });
    const variante = await TreinamentoVariante.findByPk(req.params.id);
    res.json(variante);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar variante
router.delete('/:id', async (req, res) => {
  try {
    await TreinamentoVariante.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
