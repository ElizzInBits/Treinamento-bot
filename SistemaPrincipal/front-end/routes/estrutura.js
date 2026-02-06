const express = require('express');
const router = express.Router();
const { Empresa } = require('../../BancoDeDados/models');

// Obter estrutura de uma empresa
router.get('/:empresaId', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.empresaId);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
    
    res.json({
      unidades: empresa.unidades || [],
      setores: empresa.setores || [],
      cargos: empresa.cargos || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar estrutura de uma empresa
router.put('/:empresaId', async (req, res) => {
  try {
    const { unidades, setores, cargos } = req.body;
    
    await Empresa.update({
      unidades: unidades || [],
      setores: setores || [],
      cargos: cargos || []
    }, {
      where: { id: req.params.empresaId }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
