const express = require('express');
const router = express.Router();

const { Empresa } = require('../BancoDeDados/models');
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

// GET - Listar todas as empresas com dados completos
router.get('/', async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      include: [{
        association: 'contatos',
        attributes: ['id', 'nome', 'telefone', 'email', 'statusTreinamento']
      }],
      order: [['razao_social', 'ASC']]
    });

    // Buscar treinamentos para cada empresa
    const Treinamento = require('../BancoDeDados/models/treinamento');
    const empresasCompletas = await Promise.all(empresas.map(async (empresa) => {
      let treinamentos = [];
      if (empresa.treinamentos_ids) {
        try {
          const treinamentosIds = JSON.parse(empresa.treinamentos_ids);
          treinamentos = await Treinamento.findAll({
            where: { id: treinamentosIds },
            attributes: ['id', 'nome', 'modalidade', 'cargaHoraria']
          });
        } catch (e) {
          console.error('Erro ao buscar treinamentos para empresa:', e);
        }
      }
      return {
        ...empresa.toJSON(),
        treinamentos
      };
    }));

    res.json(empresasCompletas);
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

// GET - Buscar empresa por ID com contatos e treinamentos
router.get('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findByPk(req.params.id, {
      include: [{
        association: 'contatos',
        attributes: ['id', 'nome', 'telefone', 'email', 'statusTreinamento']
      }]
    });
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Buscar treinamentos atribuídos
    let treinamentos = [];
    if (empresa.treinamentos_ids) {
      try {
        const treinamentosIds = JSON.parse(empresa.treinamentos_ids);
        const Treinamento = require('../BancoDeDados/models/treinamento');
        treinamentos = await Treinamento.findAll({
          where: { id: treinamentosIds },
          attributes: ['id', 'nome', 'modalidade', 'cargaHoraria']
        });
      } catch (e) {
        console.error('Erro ao buscar treinamentos:', e);
      }
    }

    res.json({
      ...empresa.toJSON(),
      treinamentos
    });
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

    // Atualiza os treinamentos da empresa
    empresa.treinamentos_ids = JSON.stringify(treinamentosIds);
    await empresa.save();

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
