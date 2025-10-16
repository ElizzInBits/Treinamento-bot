const express = require('express');
const router = express.Router();
const LimpezaSessoes = require('../../BancoDeDados/limpezaSessoes');

// Executar limpeza manual
router.post('/sessoes', async (req, res) => {
  try {
    const resultado = await LimpezaSessoes.executarLimpeza();
    res.json({
      success: true,
      message: 'Limpeza executada com sucesso',
      resultado
    });
  } catch (error) {
    console.error('❌ Erro na limpeza manual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao executar limpeza',
      message: error.message
    });
  }
});

// Status da limpeza automática
router.get('/status', async (req, res) => {
  try {
    const { SessaoTreinamento } = require('../../BancoDeDados/models');
    
    const total = await SessaoTreinamento.count();
    const ativas = await SessaoTreinamento.count({ where: { ativo: true } });
    const inativas = total - ativas;
    
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    
    const antigas = await SessaoTreinamento.count({
      where: {
        ultimaAtualizacao: { [require('sequelize').Op.lt]: seteDiasAtras }
      }
    });
    
    res.json({
      total,
      ativas,
      inativas,
      antigas,
      proximaLimpeza: 'A cada 6 horas'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;