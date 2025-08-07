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
    const dados = await sequelize.query(`
      SELECT 
        e.id,
        e.razao_social,
        COUNT(c.telefone) as totalContatos,
        COUNT(CASE WHEN c.treinamentoId IS NOT NULL THEN 1 END) as contatosComTreinamento
      FROM empresas e
      LEFT JOIN contatos c ON e.id = c.empresaId
      GROUP BY e.id, e.razao_social
      HAVING COUNT(c.telefone) > 0
      ORDER BY COUNT(c.telefone) DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados empresas-contatos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados para gráfico de status de treinamento
router.get('/status-treinamento', async (req, res) => {
  try {
    const dados = await sequelize.query(`
      SELECT 
        CASE WHEN treinamentoId IS NOT NULL THEN 'Com Treinamento' ELSE 'Sem Treinamento' END as status,
        COUNT(telefone) as total
      FROM contatos
      GROUP BY CASE WHEN treinamentoId IS NOT NULL THEN 'Com Treinamento' ELSE 'Sem Treinamento' END
    `, { type: sequelize.QueryTypes.SELECT });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar status de treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados para gráfico de treinamentos por modalidade
router.get('/modalidades', async (req, res) => {
  try {
    // Como o campo modalidade não existe, retornamos dados simulados
    const dados = [
      { modalidade: 'EAD - Ensino à Distância', total: 15 },
      { modalidade: 'Presencial', total: 8 },
      { modalidade: 'Híbrido', total: 5 }
    ];

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Evolução mensal de cadastros
router.get('/evolucao-mensal', async (req, res) => {
  try {
    // Como não há campo de data de criação, vamos simular dados mensais
    const contatos = [
      { mes: '2024-08', total: 45 },
      { mes: '2024-09', total: 62 },
      { mes: '2024-10', total: 78 },
      { mes: '2024-11', total: 91 },
      { mes: '2024-12', total: 103 },
      { mes: '2025-01', total: 127 }
    ];

    const treinamentos = [
      { mes: '2024-08', total: 12 },
      { mes: '2024-09', total: 18 },
      { mes: '2024-10', total: 25 },
      { mes: '2024-11', total: 31 },
      { mes: '2024-12', total: 38 },
      { mes: '2025-01', total: 45 }
    ];

    res.json({ contatos, treinamentos });
  } catch (error) {
    console.error('Erro ao buscar evolução mensal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Top empresas por engajamento
router.get('/top-empresas', async (req, res) => {
  try {
    const dados = await sequelize.query(`
      SELECT 
        e.id,
        e.razao_social,
        COUNT(c.telefone) as totalContatos,
        COUNT(CASE WHEN c.treinamentoId IS NOT NULL THEN 1 END) as contatosComTreinamento,
        ROUND((COUNT(CASE WHEN c.treinamentoId IS NOT NULL THEN 1 END) / COUNT(c.telefone)) * 100, 1) as taxaEngajamento
      FROM empresas e
      LEFT JOIN contatos c ON e.id = c.empresaId
      GROUP BY e.id, e.razao_social
      HAVING COUNT(c.telefone) > 0
      ORDER BY taxaEngajamento DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar top empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;