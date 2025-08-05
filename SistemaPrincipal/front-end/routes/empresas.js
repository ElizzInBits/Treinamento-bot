const { Empresa, Contato, Treinamento, EmpresaTreinamento, sequelize } = require('../../BancoDeDados/models');
const { fn, col, Op } = require('sequelize');
const express = require('express');
const router = express.Router();

function limparCNPJ(cnpj) {
  return cnpj.replace(/\D/g, '');
}

// ➕ Rota para gráfico de contatos por empresa (ANTES de /:id)
router.get('/contatos-por-empresa', async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      attributes: [
        'id',
        'razao_social',
        [sequelize.fn('COUNT', sequelize.col('contatos.id')), 'totalContatos']
      ],
      include: [{
        model: Contato,
        as: 'contatos',
        attributes: []
      }],
      group: ['empresas.id'],
      order: [['razao_social', 'ASC']],
      raw: true
    });

    res.json(empresas);

  } catch (error) {
    console.error('Erro ao carregar dados para o gráfico:', error.stack || error);
    res.status(500).json({ error: 'Erro ao carregar dados para o gráfico' });
  }
});



// Listar todas as empresas
router.get('/', async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      order: [['razao_social', 'ASC']]
    });
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova empresa
router.post('/', async (req, res) => {
  try {
    const { razaoSocial, cnpj, porte, endereco, cep, contato, email } = req.body;

    if (!razaoSocial || !cnpj || !porte || !endereco || !cep || !email) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    const cnpjLimpo = limparCNPJ(cnpj);

    const jaExiste = await Empresa.findOne({ where: { cnpj: cnpjLimpo } });
    if (jaExiste) {
      return res.status(400).json({ error: 'CNPJ já cadastrado.' });
    }

    const emailExiste = await Empresa.findOne({ where: { email } });
    if (emailExiste) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const novaEmpresa = await Empresa.create({
      razao_social: razaoSocial.trim(),
      cnpj: cnpjLimpo,
      porte_empresa: porte,
      endereco,
      cep,
      contato,
      email,
      criado_em: new Date()
    });

    res.status(201).json(novaEmpresa);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Atualizar empresa
router.put('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    const { razaoSocial, cnpj, porte, endereco, cep, contato, email } = req.body;

    if (cnpj) {
      const cnpjLimpo = limparCNPJ(cnpj);
      const existeOutro = await Empresa.findOne({
        where: {
          cnpj: cnpjLimpo,
          id: { [Op.ne]: req.params.id }
        }
      });
      if (existeOutro) {
        return res.status(400).json({ error: 'CNPJ já cadastrado por outra empresa.' });
      }
      empresa.cnpj = cnpjLimpo;
    }

    if (email) {
      const emailExiste = await Empresa.findOne({
        where: {
          email,
          id: { [Op.ne]: req.params.id }
        }
      });
      if (emailExiste) {
        return res.status(400).json({ error: 'Email já cadastrado por outra empresa.' });
      }
      empresa.email = email;
    }

    if (razaoSocial) empresa.razao_social = razaoSocial.trim();
    if (porte) empresa.porte_empresa = porte;
    if (endereco) empresa.endereco = endereco;
    if (cep) empresa.cep = cep;
    if (contato !== undefined) empresa.contato = contato;

    await empresa.save();

    res.json({ message: 'Empresa atualizada com sucesso.', empresa });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Deletar empresa
router.delete('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    await empresa.destroy();
    res.json({ message: 'Empresa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Opções para select no front-end
router.get('/select/options', async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      attributes: ['id', 'razao_social'],
      order: [['razao_social', 'ASC']]
    });
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ error: 'Erro ao carregar empresas' });
  }
});

// Buscar empresa completa com treinamentos e contatos
router.get('/:id/completo', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id, {
      include: [
        {
          model: Contato,
          as: 'contatos'
        },
        {
          model: Treinamento,
          as: 'treinamentos',
          through: { attributes: [] }
        }
      ]
    });
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    res.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar empresa completa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar treinamentos disponíveis para uma empresa específica
router.get('/:id/treinamentos/disponiveis', async (req, res) => {
  try {
    const empresaId = req.params.id;
    
    // Buscar IDs dos treinamentos já atribuídos à empresa
    const treinamentosAtribuidos = await EmpresaTreinamento.findAll({
      where: { empresa_id: empresaId },
      attributes: ['treinamento_id']
    });
    
    const idsAtribuidos = treinamentosAtribuidos.map(t => t.treinamento_id);
    
    // Buscar treinamentos não atribuídos
    let whereClause = {};
    if (idsAtribuidos.length > 0) {
      whereClause = {
        id: {
          [Op.notIn]: idsAtribuidos
        }
      };
    }
    
    const treinamentosDisponiveis = await Treinamento.findAll({
      where: whereClause,
      order: [['nome', 'ASC']]
    });
    
    res.json(treinamentosDisponiveis);
  } catch (error) {
    console.error('Erro ao buscar treinamentos disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar treinamentos já atribuídos à empresa
router.get('/:id/treinamentos/atribuidos', async (req, res) => {
  try {
    const empresaId = req.params.id;
    
    // Buscar IDs dos treinamentos atribuídos
    const empresaTreinamentos = await EmpresaTreinamento.findAll({
      where: { empresa_id: empresaId },
      attributes: ['treinamento_id']
    });
    
    const idsAtribuidos = empresaTreinamentos.map(et => et.treinamento_id);
    
    if (idsAtribuidos.length === 0) {
      return res.json([]);
    }
    
    // Buscar os treinamentos pelos IDs
    const treinamentosAtribuidos = await Treinamento.findAll({
      where: {
        id: {
          [Op.in]: idsAtribuidos
        }
      },
      order: [['nome', 'ASC']]
    });
    
    res.json(treinamentosAtribuidos);
  } catch (error) {
    console.error('Erro ao buscar treinamentos atribuídos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover treinamento específico da empresa
router.delete('/:empresaId/treinamentos/:treinamentoId', async (req, res) => {
  try {
    const { empresaId, treinamentoId } = req.params;
    
    await EmpresaTreinamento.destroy({
      where: {
        empresa_id: empresaId,
        treinamento_id: treinamentoId
      }
    });
    
    res.json({ message: 'Treinamento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atribuir treinamento específico à empresa
router.post('/:empresaId/treinamentos/:treinamentoId', async (req, res) => {
  try {
    const { empresaId, treinamentoId } = req.params;
    
    // Verificar se empresa existe
    const empresa = await Empresa.findByPk(empresaId);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    // Verificar se treinamento existe
    const treinamento = await Treinamento.findByPk(treinamentoId);
    if (!treinamento) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }
    
    // Verificar se já está atribuído
    const jaAtribuido = await EmpresaTreinamento.findOne({
      where: {
        empresa_id: empresaId,
        treinamento_id: treinamentoId
      }
    });
    
    if (jaAtribuido) {
      return res.status(400).json({ error: 'Treinamento já atribuído a esta empresa' });
    }
    
    // Criar associação
    await EmpresaTreinamento.create({
      empresa_id: empresaId,
      treinamento_id: treinamentoId
    });
    
    res.json({ message: 'Treinamento atribuído com sucesso' });
  } catch (error) {
    console.error('Erro ao atribuir treinamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
