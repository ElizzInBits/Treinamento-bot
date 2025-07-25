const express = require('express');
const router = express.Router();

const { Empresa } = require('../BancoDeDados/models/index');
const { Op } = require('sequelize');

const { cnpj: cnpjValidator } = require('cpf-cnpj-validator');


// Limpar CNPJ (remove qualquer caractere não numérico)
function limparCNPJ(cnpj) {
  return cnpj.replace(/\D/g, '');
}

// GET - Teste simples
router.get('/teste', (req, res) => {
  res.json({ message: 'Rota de empresas funcionando!' });
});

// GET - Contatos por empresa (para gráfico)
router.get('/contatos-por-empresa', async (req, res) => {
  try {
    const { Contato } = require('../BancoDeDados/models/index');
    const empresas = await Empresa.findAll({
      attributes: ['id', 'razao_social'],
      include: [{
        model: Contato,
        as: 'contatos',
        attributes: ['id']
      }]
    });
    
    const resultado = empresas.map(empresa => ({
      razao_social: empresa.razao_social,
      totalContatos: empresa.contatos ? empresa.contatos.length : 0
    }));
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar contatos por empresa:', error);
    res.json([]);
  }
});

// GET - Listar treinamentos disponíveis para atribuição
router.get('/treinamentos/disponiveis', async (req, res) => {
  try {
    console.log('=== BUSCANDO TREINAMENTOS DISPONÍVEIS ===');
    const Treinamento = require('../BancoDeDados/models/treinamento');
    console.log('Modelo Treinamento carregado:', !!Treinamento);
    
    const treinamentos = await Treinamento.findAll({
      attributes: ['id', 'nome', 'modalidade', 'cargaHoraria', 'tipo'],
      order: [['nome', 'ASC']]
    });
    
    console.log('Treinamentos encontrados:', treinamentos.length);
    console.log('Dados:', treinamentos.map(t => ({ id: t.id, nome: t.nome })));
    
    res.json(treinamentos);
  } catch (error) {
    console.error('Erro ao buscar treinamentos disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor.', details: error.message });
  }
});

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
    console.log('=== BUSCANDO EMPRESA COMPLETA ===');
    console.log('ID da empresa:', req.params.id);
    
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      console.log('Empresa não encontrada');
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }
    
    console.log('Empresa encontrada:', empresa.razao_social);

    // Buscar contatos da empresa
    const { Contato } = require('../BancoDeDados/models/index');
    const contatos = await Contato.findAll({
      where: { empresaId: req.params.id },
      attributes: ['id', 'nome', 'telefone', 'email', 'statusTreinamento']
    });

    // Buscar treinamentos atribuídos
    const { sequelize } = require('../BancoDeDados/database');
    
    const treinamentos = await sequelize.query(`
      SELECT t.id, t.nome, t.modalidade, t.carga_horaria as cargaHoraria
      FROM treinamento t
      INNER JOIN empresa_treinamentos et ON t.id = et.treinamento_id
      WHERE et.empresa_id = ?
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('Treinamentos encontrados via SQL:', treinamentos.length);
    
    console.log('Treinamentos da empresa:', treinamentos.length);
    console.log('Contatos da empresa:', contatos.length);

    const resultado = {
      ...empresa.toJSON(),
      contatos,
      treinamentos
    };
    
    console.log('Enviando resultado completo');
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar dados completos da empresa:', error);
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

    const { sequelize } = require('../BancoDeDados/database');
    
    // Remove treinamentos existentes
    await sequelize.query('DELETE FROM empresa_treinamentos WHERE empresa_id = ?', {
      replacements: [id],
      type: sequelize.QueryTypes.DELETE
    });
    
    // Adiciona novos treinamentos
    if (treinamentosIds.length > 0) {
      const values = treinamentosIds.map(treinamentoId => `(${id}, ${treinamentoId})`).join(',');
      await sequelize.query(`INSERT INTO empresa_treinamentos (empresa_id, treinamento_id) VALUES ${values}`);
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
