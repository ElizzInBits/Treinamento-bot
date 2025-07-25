const express = require('express');
const router = express.Router();

const { Empresa } = require('../BancoDeDados/models/index');
const { Op } = require('sequelize');

const { cnpj: cnpjValidator } = require('cpf-cnpj-validator');


// Limpar CNPJ (remove qualquer caractere não numérico)
function limparCNPJ(cnpj) {
  return cnpj.replace(/\D/g, '');
}

// POST - Criar nova empresa
router.post('/', async (req, res) => {
  try {
    const { razaoSocial, cnpj, porte, endereco, cep, contato } = req.body;

    if (!razaoSocial || !cnpj || !porte || !endereco || !cep || !contato) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const cnpjLimpo = limparCNPJ(cnpj);

    if (!cnpjValidator.isValid(cnpjLimpo)) {
      return res.status(400).json({ error: 'CNPJ inválido.' });
    }


    const jaExiste = await Empresa.findOne({ where: { cnpj: cnpjLimpo } });

    if (jaExiste) {
      return res.status(400).json({ error: 'CNPJ já cadastrado.' });
    }

    const novaEmpresa = await Empresa.create({
      razao_social: razaoSocial.trim(),
      cnpj: cnpjLimpo,
      porte_empresa: porte,
      endereco,
      cep,
      contato,
      criado_em: new Date()
    });

    res.status(201).json(novaEmpresa);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET - Listar todas as empresas
router.get('/', async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      order: [['razao_social', 'ASC']]
    });
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET - Opções de empresas para select
router.get('/select/options', async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      attributes: ['id', 'razao_social'],
      order: [['razao_social', 'ASC']]
    });

    res.json(empresas);
  } catch (error) {
    console.error('Erro ao buscar opções de empresas:', error);
    res.status(500).json({ error: 'Erro ao carregar opções de empresas.' });
  }
});

// GET - Buscar empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }
    res.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// PUT - Atualizar empresa
router.put('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    const { razaoSocial, cnpj, porte, endereco, cep, contato } = req.body;

    if (cnpj) {
      const cnpjLimpo = limparCNPJ(cnpj);
      const existeOutro = await Empresa.findOne({
        where: {
          cnpj: cnpjLimpo,
          id: { [require('sequelize').Op.ne]: req.params.id }
        }
      });

      if (existeOutro) {
        return res.status(400).json({ error: 'CNPJ já cadastrado por outra empresa.' });
      }

      empresa.cnpj = cnpjLimpo;
    }

    if (razaoSocial) empresa.razao_social = razaoSocial.trim();
    if (porte) empresa.porte_empresa = porte;
    if (endereco) empresa.endereco = endereco;
    if (cep) empresa.cep = cep;
    if (contato) empresa.contato = contato;

    await empresa.save();

    res.json({ message: 'Empresa atualizada com sucesso.', empresa });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET - Buscar dados completos da empresa (contatos e treinamentos)
router.get('/:id/completo', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Buscar contatos da empresa
    const { Contato } = require('../BancoDeDados/models/index');
    const contatos = await Contato.findAll({
      where: { empresaId: req.params.id },
      attributes: ['id', 'nome', 'telefone', 'email', 'statusTreinamento']
    });

    // Buscar treinamentos atribuídos
    const { EmpresaTreinamento } = require('../BancoDeDados/models/index');
    const Treinamento = require('../BancoDeDados/models/treinamento');
    
    const empresaTreinamentos = await EmpresaTreinamento.findAll({
      where: { empresa_id: req.params.id }
    });
    
    const treinamentosIds = empresaTreinamentos.map(et => et.treinamento_id);
    const treinamentos = treinamentosIds.length > 0 ? await Treinamento.findAll({
      where: { id: treinamentosIds },
      attributes: ['id', 'nome', 'modalidade', 'cargaHoraria']
    }) : [];

    res.json({
      ...empresa.toJSON(),
      contatos,
      treinamentos
    });
  } catch (error) {
    console.error('Erro ao buscar dados completos da empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET - Listar treinamentos disponíveis para atribuição
router.get('/treinamentos/disponiveis', async (req, res) => {
  try {
    const Treinamento = require('../BancoDeDados/models/treinamento');
    const treinamentos = await Treinamento.findAll({
      attributes: ['id', 'nome', 'modalidade', 'cargaHoraria', 'tipo'],
      order: [['nome', 'ASC']]
    });
    
    res.json(treinamentos);
  } catch (error) {
    console.error('Erro ao buscar treinamentos disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST - Atribuir treinamentos à empresa
router.post('/:id/treinamentos', async (req, res) => {
  try {
    const { id } = req.params;
    const { treinamentosIds } = req.body;

    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    if (!Array.isArray(treinamentosIds)) {
      return res.status(400).json({ error: 'treinamentosIds deve ser um array.' });
    }

    const { EmpresaTreinamento } = require('../BancoDeDados/models/index');
    
    // Remove treinamentos existentes
    await EmpresaTreinamento.destroy({ where: { empresa_id: id } });
    
    // Adiciona novos treinamentos
    if (treinamentosIds.length > 0) {
      const registros = treinamentosIds.map(treinamentoId => ({
        empresa_id: id,
        treinamento_id: treinamentoId
      }));
      await EmpresaTreinamento.bulkCreate(registros);
    }

    res.json({ message: 'Treinamentos atribuídos com sucesso.', empresa });
  } catch (error) {
    console.error('Erro ao atribuir treinamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// DELETE - Deletar empresa
router.delete('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    await empresa.destroy();
    res.json({ message: 'Empresa deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
