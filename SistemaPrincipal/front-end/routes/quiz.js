const express = require('express');
const router = express.Router();
const { QuizScore, QuizRanking, Usuario, Treinamento, sequelize } = require('../../BancoDeDados/models');
const { Op } = require('sequelize');

// Registrar pontuação do quiz
router.post('/score', async (req, res) => {
  try {
    const { usuario_id, treinamento_id, acertos, total_questoes, tempo_resposta } = req.body;

    if (!usuario_id || !treinamento_id || acertos === undefined || !total_questoes) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const data_quiz = new Date().toISOString().split('T')[0];

    // Buscar configuração do treinamento
    const treinamento = await Treinamento.findByPk(treinamento_id);
    if (!treinamento || !treinamento.tipo_gamificado) {
      return res.status(400).json({ error: 'Treinamento não é gamificado' });
    }

    const config = treinamento.config_quiz || { pontos_por_acerto: 10 };
    const pontuacao = acertos * config.pontos_por_acerto;

    // Salvar ou atualizar score do dia
    const [score, created] = await QuizScore.upsert({
      usuario_id,
      treinamento_id,
      data_quiz,
      acertos,
      total_questoes,
      pontuacao,
      tempo_resposta: tempo_resposta || 0
    }, {
      returning: true
    });

    // Atualizar ranking
    await atualizarRanking(usuario_id, treinamento_id);

    res.json({ 
      success: true, 
      score,
      created,
      message: created ? 'Pontuação registrada!' : 'Pontuação atualizada!'
    });

  } catch (error) {
    console.error('Erro ao registrar score:', error);
    res.status(500).json({ error: 'Erro ao registrar pontuação' });
  }
});

// Buscar ranking de um treinamento
router.get('/ranking/:treinamento_id', async (req, res) => {
  try {
    const { treinamento_id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const ranking = await QuizRanking.findAll({
      where: { treinamento_id },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nome', 'telefone']
      }],
      order: [['total_pontos', 'DESC']],
      limit
    });

    res.json(ranking);

  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

// Buscar histórico de um usuário em um treinamento
router.get('/historico/:usuario_id/:treinamento_id', async (req, res) => {
  try {
    const { usuario_id, treinamento_id } = req.params;
    const dias = parseInt(req.query.dias) || 30;

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const historico = await QuizScore.findAll({
      where: {
        usuario_id,
        treinamento_id,
        data_quiz: {
          [Op.gte]: dataInicio.toISOString().split('T')[0]
        }
      },
      order: [['data_quiz', 'DESC']]
    });

    const ranking = await QuizRanking.findOne({
      where: { usuario_id, treinamento_id }
    });

    res.json({ historico, ranking });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Buscar estatísticas de um treinamento gamificado
router.get('/stats/:treinamento_id', async (req, res) => {
  try {
    const { treinamento_id } = req.params;

    const totalParticipantes = await QuizRanking.count({
      where: { treinamento_id }
    });

    const mediaAcertos = await QuizRanking.findOne({
      where: { treinamento_id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('total_acertos')), 'media_acertos'],
        [sequelize.fn('AVG', sequelize.col('total_pontos')), 'media_pontos']
      ],
      raw: true
    });

    const hoje = new Date().toISOString().split('T')[0];
    const participantesHoje = await QuizScore.count({
      where: {
        treinamento_id,
        data_quiz: hoje
      }
    });

    res.json({
      total_participantes: totalParticipantes,
      media_acertos: parseFloat(mediaAcertos?.media_acertos || 0).toFixed(1),
      media_pontos: parseFloat(mediaAcertos?.media_pontos || 0).toFixed(0),
      participantes_hoje: participantesHoje
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Função auxiliar para atualizar ranking
async function atualizarRanking(usuario_id, treinamento_id) {
  const scores = await QuizScore.findAll({
    where: { usuario_id, treinamento_id },
    order: [['data_quiz', 'DESC']]
  });

  const total_acertos = scores.reduce((sum, s) => sum + s.acertos, 0);
  const total_questoes = scores.reduce((sum, s) => sum + s.total_questoes, 0);
  const total_pontos = scores.reduce((sum, s) => sum + s.pontuacao, 0);

  // Calcular dias consecutivos
  let dias_consecutivos = 0;
  let melhor_sequencia = 0;
  let sequencia_atual = 0;
  
  for (let i = 0; i < scores.length; i++) {
    if (i === 0) {
      sequencia_atual = 1;
    } else {
      const dataAtual = new Date(scores[i].data_quiz);
      const dataAnterior = new Date(scores[i - 1].data_quiz);
      const diffDias = Math.floor((dataAnterior - dataAtual) / (1000 * 60 * 60 * 24));
      
      if (diffDias === 1) {
        sequencia_atual++;
      } else {
        melhor_sequencia = Math.max(melhor_sequencia, sequencia_atual);
        sequencia_atual = 1;
      }
    }
  }
  
  melhor_sequencia = Math.max(melhor_sequencia, sequencia_atual);
  dias_consecutivos = sequencia_atual;

  const ultima_participacao = scores.length > 0 ? scores[0].data_quiz : null;

  await QuizRanking.upsert({
    usuario_id,
    treinamento_id,
    total_acertos,
    total_questoes,
    total_pontos,
    dias_consecutivos,
    melhor_sequencia,
    ultima_participacao
  });
}

module.exports = router;
