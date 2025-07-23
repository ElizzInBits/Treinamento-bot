// routes/treinamentos.js
const express = require('express');
const router = express.Router();
const Treinamento = require('../../BancoDeDados/models/treinamento'); 


// Listar todos os treinamentos
router.get('/', async (req, res) => {
  try {
    const treinamentos = await Treinamento.findAll({ order: [['nome', 'ASC']] });
    res.json(treinamentos);
  } catch (err) {
    console.error('Erro ao listar treinamentos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo treinamento

router.post('/', async (req, res) => {
  try {
    console.log('📝 Corpo da requisição:', req.body);  
    const {
      nome,
      descricao = '',   
      modalidade,
      cargaHoraria,
      tipo,
      emConformidade,
      aproveitamento,
      conteudoProgramatico,
      instrutor,
      qualificacaoInstrutor = '',
      instrutoresAdicionais = '',
      responsavel,
      cargoResponsavel = '',
      areaResponsavel,
      observacoes = ''
    } = req.body;

    // Validação mínima
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome do treinamento é obrigatório' });
    }
    if (!modalidade || !cargaHoraria || !tipo || !emConformidade || !aproveitamento || !conteudoProgramatico || !instrutor || !responsavel || !areaResponsavel) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    // Checar existência do nome
    const existente = await Treinamento.findOne({ where: { nome: nome.trim() } });
    if (existente) {
      return res.status(400).json({ error: 'Já existe um treinamento com este nome' });
    }

    const novo = await Treinamento.create({
      nome: nome.trim(),
      descricao,
      modalidade,
      cargaHoraria,
      tipo,
      emConformidade,
      aproveitamento,
      conteudo: conteudoProgramatico,
      instrutor,
      qualificacaoInstrutor,
      instrutoresAdicionais,
      responsavel,
      cargoResponsavel,
      areaResponsavel,
      observacoes
    });

    return res.status(201).json(novo);

  } catch (err) {
    console.error('❌ Erro ao criar treinamento:', err);
    return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
  }
});



// Atualizar treinamento pelo ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    const treinamento = await Treinamento.findByPk(id);
    if (!treinamento) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }

    if (nome && nome.trim() !== treinamento.nome) {
      // Verifica se o novo nome já existe
      const existente = await Treinamento.findOne({ where: { nome: nome.trim() } });
      if (existente && existente.id !== treinamento.id) {
        return res.status(400).json({ error: 'Já existe um treinamento com este nome' });
      }
      treinamento.nome = nome.trim();
    }

    if (descricao !== undefined) {
      treinamento.descricao = descricao;
    }

    await treinamento.save();

    res.json({ treinamento });

  } catch (err) {
    console.error('Erro ao atualizar treinamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover treinamento pelo ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const treinamento = await Treinamento.findByPk(id);
    if (!treinamento) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }

    await treinamento.destroy();

    res.json({ message: 'Treinamento removido com sucesso' });

  } catch (err) {
    console.error('Erro ao remover treinamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
