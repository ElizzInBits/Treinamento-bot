const { Empresa, Contato, Treinamento, EmpresaTreinamento, EmpresaSenha, sequelize } = require('../../BancoDeDados/models');
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



// Opções para select no front-end (DEVE VIR ANTES DE /:id)
router.get('/select/options', async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      attributes: ['id', 'razao_social'],
      order: [['razao_social', 'ASC']]
    });
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.json([]);
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
    if (error.name === 'SequelizeConnectionRefusedError') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
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
    console.log('📥 Dados recebidos:', req.body);
    
    // Aceitar tanto camelCase quanto snake_case
    const { 
      razaoSocial, razao_social,
      cnpj, 
      porte, porte_empresa,
      endereco, 
      cep, 
      contato, 
      email,
      senha
    } = req.body;
    
    const razaoSocialFinal = razaoSocial || razao_social;
    const porteFinal = porte || porte_empresa;

    if (!razaoSocialFinal) {
      return res.status(400).json({ error: 'Razão social é obrigatória.' });
    }

    if (!senha || senha.length < 8) {
      return res.status(400).json({ error: 'Senha é obrigatória e deve ter pelo menos 8 caracteres.' });
    }

    let cnpjLimpo = null;
    if (cnpj) {
      cnpjLimpo = limparCNPJ(cnpj);
      const jaExiste = await Empresa.findOne({ where: { cnpj: cnpjLimpo } });
      if (jaExiste) {
        return res.status(400).json({ error: 'CNPJ já cadastrado.' });
      }
    }

    if (email) {
      const emailExiste = await Empresa.findOne({ where: { email } });
      if (emailExiste) {
        return res.status(400).json({ error: 'Email já cadastrado.' });
      }
    }

    const novaEmpresa = await Empresa.create({
      razaoSocial: razaoSocialFinal.trim().toUpperCase(),
      cnpj: cnpjLimpo,
      porteEmpresa: porteFinal ? porteFinal.toUpperCase() : null,
      endereco: endereco ? endereco.toUpperCase() : null,
      cep: cep || null,
      contato: contato || null,
      email: email || null,
      criadoEm: new Date()
    });

    console.log('✅ Empresa criada:', novaEmpresa.id);

    // Criar senha da empresa
    try {
      const novaSenha = await EmpresaSenha.create({
        empresaId: novaEmpresa.id,
        nomeEmpresa: novaEmpresa.razaoSocial,
        senha: senha
      });
      console.log('✅ Senha criada:', novaSenha.id);
    } catch (senhaError) {
      console.error('❌ Erro ao criar senha:', senhaError.message);
      console.error('❌ Stack:', senhaError.stack);
      throw new Error('Empresa criada mas erro ao salvar senha: ' + senhaError.message);
    }

    // Emitir evento para atualização em tempo real
    const io = req.app.get('io');
    if (io) {
      io.emit('nova_empresa', novaEmpresa);
      io.emit('notificacao', {
        tipo: 'empresa_cadastrada',
        titulo: 'Nova Empresa Cadastrada',
        mensagem: `${novaEmpresa.razaoSocial} foi cadastrada no sistema`,
        timestamp: new Date()
      });
    }

    res.status(201).json(novaEmpresa);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Atualizar empresa
router.put('/:id', async (req, res) => {
  try {
    console.log('📥 Dados recebidos para atualização:', req.body);
    
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Aceitar tanto camelCase quanto snake_case
    const { 
      razaoSocial, razao_social, 
      cnpj, 
      porte, porte_empresa,
      endereco, 
      cep, 
      contato, 
      email 
    } = req.body;
    
    const razaoSocialFinal = razaoSocial || razao_social;
    const porteFinal = porte || porte_empresa;

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

    // Atualizar campos
    if (razaoSocialFinal) empresa.razaoSocial = razaoSocialFinal.trim();
    if (porteFinal) empresa.porteEmpresa = porteFinal;
    if (endereco !== undefined) empresa.endereco = endereco;
    if (cep !== undefined) empresa.cep = cep;
    if (contato !== undefined) empresa.contato = contato;

    await empresa.save();
    
    console.log('✅ Empresa atualizada:', empresa.toJSON());

    res.json({ 
      message: 'Empresa atualizada com sucesso.', 
      empresa: empresa.toJSON()
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Deletar empresa
router.delete('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const empresa = await Empresa.findByPk(req.params.id);

    if (!empresa) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    console.log(`🗑️ Excluindo empresa: ${empresa.razaoSocial}`);
    
    // Excluir associações de treinamento
    await EmpresaTreinamento.destroy({
      where: { empresa_id: req.params.id },
      transaction
    });
    
    // Excluir contatos da empresa
    await Contato.destroy({
      where: { empresaId: req.params.id },
      transaction
    });
    
    // Excluir a empresa
    await empresa.destroy({ transaction });
    
    await transaction.commit();
    
    console.log(`✅ Empresa ${empresa.razaoSocial} excluída com sucesso`);
    res.json({ message: 'Empresa excluída com sucesso' });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro ao excluir empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
