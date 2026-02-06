const express = require('express');
const router = express.Router();
const { Empresa, Usuario, Treinamento, EmpresaTreinamento, sequelize } = require('../../BancoDeDados/models');
const { Op, fn, col, literal } = require('sequelize');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', message: 'API funcionando corretamente' });
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({ status: 'error', message: 'Erro de conexão com o banco' });
  }
});



// Estatísticas gerais do dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalEmpresas = await Empresa.count();
    const totalContatos = await Usuario.count();
    const totalTreinamentos = await Treinamento.count();
    const contatosComTreinamento = await Usuario.count({ where: { treinamento_id: { [Op.not]: null } } });
    
    // Contar empresas que têm pelo menos um usuário
    const empresasComContatos = await Empresa.findAll({
      include: [{
        model: Usuario,
        as: 'usuarios',
        required: true
      }]
    });
    const empresasAtivas = empresasComContatos.length;
    
    const certificadosEmitidos = await Usuario.count({ where: { status_treinamento: 'concluído' } });

    const taxaTreinamento = totalContatos > 0 ? ((contatosComTreinamento / totalContatos) * 100).toFixed(1) : 0;
    const mediaContatosPorEmpresa = totalEmpresas > 0 ? (totalContatos / totalEmpresas).toFixed(1) : 0;

    const stats = {
      totalEmpresas,
      totalContatos,
      totalTreinamentos,
      contatosComTreinamento,
      empresasAtivas,
      certificadosEmitidos,
      taxaTreinamento: parseFloat(taxaTreinamento),
      mediaContatosPorEmpresa: parseFloat(mediaContatosPorEmpresa)
    };
    
    console.log('📊 Stats calculadas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados para gráfico de contatos por empresa
router.get('/empresas-contatos', async (req, res) => {
  try {
    const empresas = await Empresa.findAll();
    const dados = [];
    
    for (const empresa of empresas) {
      const totalContatos = await Usuario.count({ where: { empresa_id: empresa.id } });
      const contatosComTreinamento = await Usuario.count({ 
        where: { 
          empresa_id: empresa.id,
          treinamento_id: { [Op.not]: null }
        }
      });
      
      if (totalContatos > 0) {
        dados.push({
          id: empresa.id,
          razao_social: empresa.razaoSocial,
          totalContatos,
          contatosComTreinamento
        });
      }
    }
    
    dados.sort((a, b) => b.totalContatos - a.totalContatos);
    res.json(dados.slice(0, 10));
  } catch (error) {
    console.error('Erro ao buscar dados empresas-contatos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados para gráfico de status de treinamento
router.get('/status-treinamento', async (req, res) => {
  try {
    const comTreinamento = await Usuario.count({ where: { treinamento_id: { [Op.not]: null } } });
    const semTreinamento = await Usuario.count({ where: { treinamento_id: null } });
    
    const dados = [
      { status: 'Com Treinamento', total: comTreinamento },
      { status: 'Sem Treinamento', total: semTreinamento }
    ].filter(item => item.total > 0);

    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar status de treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dados para gráfico de treinamentos por modalidade
router.get('/modalidades', async (req, res) => {
  try {
    const treinamentos = await Treinamento.findAll({
      attributes: ['modalidade']
    });
    
    console.log('Treinamentos encontrados:', treinamentos.length);
    console.log('Dados dos treinamentos:', treinamentos.map(t => ({ modalidade: t.modalidade })));
    
    const modalidadeCount = {};
    
    treinamentos.forEach(t => {
      const modalidade = t.modalidade || 'Não informado';
      modalidadeCount[modalidade] = (modalidadeCount[modalidade] || 0) + 1;
    });
    
    const dados = Object.entries(modalidadeCount).map(([modalidade, total]) => ({
      modalidade,
      total
    })).sort((a, b) => b.total - a.total);

    console.log('Modalidades processadas:', dados);
    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Evolução mensal de cadastros
router.get('/evolucao-mensal', async (req, res) => {
  try {
    // Dados simplificados para o mês atual
    const totalContatos = await Usuario.count();
    const totalTreinamentos = await Treinamento.count();
    
    const mesAtual = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const contatos = [{ mes: mesAtual, total: totalContatos }];
    const treinamentos = [{ mes: mesAtual, total: totalTreinamentos }];
    
    res.json({ contatos, treinamentos });
  } catch (error) {
    console.error('Erro ao buscar evolução mensal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Contatos em treinamento
router.get('/contatos-em-treinamento', async (req, res) => {
  try {
    const total = await Usuario.count({ 
      where: { treinamento_id: { [Op.not]: null } } 
    });
    
    res.json({ total });
  } catch (error) {
    console.error('Erro ao buscar contatos em treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Top empresas por engajamento
router.get('/top-empresas', async (req, res) => {
  try {
    const empresas = await Empresa.findAll();
    const dados = [];
    
    for (const empresa of empresas) {
      const totalContatos = await Usuario.count({ where: { empresa_id: empresa.id } });
      const contatosComTreinamento = await Usuario.count({ 
        where: { 
          empresa_id: empresa.id,
          treinamento_id: { [Op.not]: null }
        }
      });
      
      if (totalContatos > 0) {
        const taxaEngajamento = Math.round((contatosComTreinamento / totalContatos) * 100 * 10) / 10;
        dados.push({
          id: empresa.id,
          razao_social: empresa.razaoSocial,
          totalContatos,
          contatosComTreinamento,
          taxaEngajamento
        });
      }
    }
    
    dados.sort((a, b) => b.taxaEngajamento - a.taxaEngajamento);
    res.json(dados.slice(0, 5));
  } catch (error) {
    console.error('Erro ao buscar top empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;