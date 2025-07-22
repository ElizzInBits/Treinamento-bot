const { Empresa, Contato, sequelize } = require('../../BancoDeDados/models');
const { fn, col } = require('sequelize');
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

module.exports = router;
