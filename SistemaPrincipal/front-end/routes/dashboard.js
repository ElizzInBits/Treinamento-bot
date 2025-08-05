const express = require('express');
const router = express.Router();
const { Empresa, Contato, Treinamento, EmpresaTreinamento, sequelize } = require('../../BancoDeDados/models');
const { Op, fn, col, literal } = require('sequelize');

// Estatísticas gerais do dashboard
router.get('/stats', async (req, res) => {
  try {
    const [
      totalEmpresas,
      totalContatos,
      totalTreinamentos,
      contatosComTreinamento,
      empresasAtivas,
      certificadosEmitidos
    ] = await Promise.all([
      Empresa.count(),
      Contato.count(),
      Treinamento.count(),
      Contato.count({ where: { treinamentoId: { [Op.not]: null } } }),
      Empresa.count({
        include: [{
          model: Contato,
          as: 'contatos',
          required: true
        }]
      }),
      Contato.count({ where: { statusTreinamento: 'concluído' } })
    ]);

    const taxaTreinamento = totalContatos > 0 ? ((contatosComTreinamento / totalContatos) * 100).toFixed(1) : 0;
    const mediaContatosPorEmpresa = empresasAtivas > 0 ? (totalContatos / empresasAtivas).toFixed(1) : 0;

    res.json({
      totalEmpresas,
      totalContatos,
      totalTreinamentos,
      contatosComTreinamento,
      empresasAtivas,
      certificadosEmitidos,
      taxaTreinamento: parseFloat(taxaTreinamento),
      mediaContatosPorEmpresa: parseFloat(mediaContatosPorEmpresa)
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados para gráfico de contatos por empresa
router.get('/empresas-contatos', async (req, res) => {
  try {
    const dados = await Empresa.findAll({
      attributes: [
        'id',
        'razao_social',
        [fn('COUNT', col('contatos.id')), 'totalContatos'],
        [fn('COUNT', literal('CASE WHEN contatos.treinamentoId IS NOT NULL THEN 1 END')), 'contatosComTreinamento']
      ],
      include: [{
        model: Contato,
        as: 'contatos',
        attributes: []
      }],
      group: ['empresas.id', 'empresas.razao_social'],
      having: literal('COUNT(contatos.id) > 0'),
      order: [[fn('COUNT', col('contatos.id')), 'DESC']],
      limit: 10
    });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados empresas-contatos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados para gráfico de status de treinamento
router.get('/status-treinamento', async (req, res) => {
  try {
    const dados = await Contato.findAll({
      attributes: [
        [literal('CASE WHEN treinamentoId IS NOT NULL THEN "Com Treinamento" ELSE "Sem Treinamento" END'), 'status'],
        [fn('COUNT', col('id')), 'total']
      ],
      group: [literal('CASE WHEN treinamentoId IS NOT NULL THEN "Com Treinamento" ELSE "Sem Treinamento" END')]
    });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar status de treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados para gráfico de treinamentos por modalidade
router.get('/modalidades', async (req, res) => {
  try {
    const dados = await Treinamento.findAll({
      attributes: [
        'modalidade',
        [fn('COUNT', col('id')), 'total']
      ],
      group: ['modalidade'],
      order: [[fn('COUNT', col('id')), 'DESC']]
    });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Evolução mensal de cadastros
router.get('/evolucao-mensal', async (req, res) => {
  try {
    const contatos = await Contato.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'mes'],
        [fn('COUNT', col('id')), 'total']
      ],
      where: {
        createdAt: {
          [Op.gte]: literal('DATE_SUB(NOW(), INTERVAL 6 MONTH)')
        }
      },
      group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'ASC']]
    });

    const treinamentos = await Treinamento.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'mes'],
        [fn('COUNT', col('id')), 'total']
      ],
      where: {
        createdAt: {
          [Op.gte]: literal('DATE_SUB(NOW(), INTERVAL 6 MONTH)')
        }
      },
      group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'ASC']]
    });

    res.json({ contatos, treinamentos });
  } catch (error) {
    console.error('Erro ao buscar evolução mensal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Top empresas por engajamento
router.get('/top-empresas', async (req, res) => {
  try {
    const dados = await Empresa.findAll({
      attributes: [
        'id',
        'razao_social',
        [fn('COUNT', col('contatos.id')), 'totalContatos'],
        [fn('COUNT', literal('CASE WHEN contatos.treinamentoId IS NOT NULL THEN 1 END')), 'contatosComTreinamento'],
        [literal('ROUND((COUNT(CASE WHEN contatos.treinamentoId IS NOT NULL THEN 1 END) / COUNT(contatos.id)) * 100, 1)'), 'taxaEngajamento']
      ],
      include: [{
        model: Contato,
        as: 'contatos',
        attributes: []
      }],
      group: ['empresas.id', 'empresas.razao_social'],
      having: literal('COUNT(contatos.id) > 0'),
      order: [[literal('taxaEngajamento'), 'DESC']],
      limit: 5
    });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar top empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;