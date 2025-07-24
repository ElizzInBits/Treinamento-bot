const express = require('express');
const router = express.Router();
const Treinamento = require('../../BancoDeDados/models/treinamento');
const multer = require('multer');
const path = require('path');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../media/treinamentos'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB por arquivo
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/', 'video/', 'audio/', 'application/pdf'
    ];
    if (allowed.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

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

// Criar novo treinamento com upload de arquivos
router.post('/', upload.array('midias', 10), async (req, res) => {
  try {
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

    // Arquivos enviados
    const midias = req.files ? req.files.map(f => f.filename) : [];

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
      observacoes,
      midias: JSON.stringify(midias)
    });

    return res.status(201).json(novo);

  } catch (err) {
    console.error('❌ Erro ao criar treinamento:', err);
    return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
  }
});

// Atualizar treinamento pelo ID com upload de arquivos
router.put('/:id', upload.array('midias', 10), async (req, res) => {
  try {
    const { id } = req.params;
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

    const midias = req.files ? req.files.map(f => f.filename) : [];

    const treinamento = await Treinamento.findByPk(id);
    if (!treinamento) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }

    // Verifica se o novo nome já existe em outro registro
    if (nome && nome.trim() !== treinamento.nome) {
      const existente = await Treinamento.findOne({ where: { nome: nome.trim() } });
      if (existente && existente.id !== treinamento.id) {
        return res.status(400).json({ error: 'Já existe um treinamento com este nome' });
      }
      treinamento.nome = nome.trim();
    }

    // Atualiza todos os campos
    treinamento.descricao = descricao;
    treinamento.modalidade = modalidade;
    treinamento.cargaHoraria = cargaHoraria;
    treinamento.tipo = tipo;
    treinamento.emConformidade = emConformidade;
    treinamento.aproveitamento = aproveitamento;
    treinamento.conteudo = conteudoProgramatico;
    treinamento.instrutor = instrutor;
    treinamento.qualificacaoInstrutor = qualificacaoInstrutor;
    treinamento.instrutoresAdicionais = instrutoresAdicionais;
    treinamento.responsavel = responsavel;
    treinamento.cargoResponsavel = cargoResponsavel;
    treinamento.areaResponsavel = areaResponsavel;
    treinamento.observacoes = observacoes;

    // Se enviou arquivos, atualiza o campo midias
    if (midias.length > 0) {
      treinamento.midias = JSON.stringify(midias);
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