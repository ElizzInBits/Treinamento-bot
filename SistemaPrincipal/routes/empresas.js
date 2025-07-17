const express = require('express');
const router = express.Router();

const Empresa = require('../BancoDeDados/models/empresas');
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
