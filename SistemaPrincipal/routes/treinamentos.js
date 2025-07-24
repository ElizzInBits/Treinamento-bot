const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Treinamento = require('../BancoDeDados/models/treinamento'); // ajuste o caminho se precisar

// Config multer para salvar arquivos na pasta uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'media', 'treinamentos');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// LISTAR todos os treinamentos
router.get('/', async (req, res) => {
  try {
    const treinamentos = await Treinamento.findAll({ order: [['nome', 'ASC']] });
    const treinamentosComMidias = treinamentos.map(t => {
      let midias = [];
      if (t.midias) {
        try {
          midias = JSON.parse(t.midias);
        } catch {
          midias = [];
        }
      }
      return { ...t.toJSON(), midias };
    });
    res.json(treinamentosComMidias);
  } catch (err) {
    console.error('Erro ao listar treinamentos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRIAR novo treinamento com upload de arquivos
router.post('/', upload.array('midias'), async (req, res) => {
  try {
    const {
      nome, descricao, modalidade, cargaHoraria, tipo,
      emConformidade, aproveitamento, conteudo,
      instrutor, qualificacaoInstrutor, instrutoresAdicionais,
      responsavel, cargoResponsavel, areaResponsavel, observacoes
    } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome do treinamento é obrigatório' });
    }

    const nomeLimpo = nome.trim();

    // Verifica se já existe
    const existente = await Treinamento.findOne({ where: { nome: nomeLimpo } });
    if (existente) {
      return res.status(400).json({ error: 'Já existe um treinamento com este nome' });
    }

    // Extrai nomes dos arquivos enviados
    const midiasNomes = (req.files || []).map(file => file.filename);

    const novo = await Treinamento.create({
      nome: nomeLimpo,
      descricao: descricao || '',
      modalidade,
      cargaHoraria,
      tipo,
      emConformidade,
      aproveitamento,
      conteudo,
      instrutor,
      qualificacaoInstrutor,
      instrutoresAdicionais,
      responsavel,
      cargoResponsavel,
      areaResponsavel,
      observacoes,
      midias: JSON.stringify(midiasNomes)
    });

    res.status(201).json({
      sucesso: true,
      treinamento: novo,
      arquivosRecebidos: midiasNomes.length,
      message: 'Treinamento criado com arquivos!'
    });

  } catch (err) {
    console.error('Erro ao criar treinamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ATUALIZAR treinamento pelo ID (sem alterar arquivos)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, descricao, modalidade, cargaHoraria, tipo,
      emConformidade, aproveitamento, conteudo,
      instrutor, qualificacaoInstrutor, instrutoresAdicionais,
      responsavel, cargoResponsavel, areaResponsavel, observacoes
    } = req.body;

    const treinamento = await Treinamento.findByPk(id);
    if (!treinamento) return res.status(404).json({ error: 'Treinamento não encontrado' });

    // Verifica duplicidade de nome se for alterado
    if (nome && nome.trim() !== treinamento.nome) {
      const existente = await Treinamento.findOne({ where: { nome: nome.trim() } });
      if (existente && existente.id !== treinamento.id) {
        return res.status(400).json({ error: 'Já existe um treinamento com este nome' });
      }
      treinamento.nome = nome.trim();
    }

    treinamento.descricao = descricao !== undefined ? descricao : treinamento.descricao;
    treinamento.modalidade = modalidade !== undefined ? modalidade : treinamento.modalidade;
    treinamento.cargaHoraria = cargaHoraria !== undefined ? cargaHoraria : treinamento.cargaHoraria;
    treinamento.tipo = tipo !== undefined ? tipo : treinamento.tipo;
    treinamento.emConformidade = emConformidade !== undefined ? emConformidade : treinamento.emConformidade;
    treinamento.aproveitamento = aproveitamento !== undefined ? aproveitamento : treinamento.aproveitamento;
    treinamento.conteudo = conteudo !== undefined ? conteudo : treinamento.conteudo;
    treinamento.instrutor = instrutor !== undefined ? instrutor : treinamento.instrutor;
    treinamento.qualificacaoInstrutor = qualificacaoInstrutor !== undefined ? qualificacaoInstrutor : treinamento.qualificacaoInstrutor;
    treinamento.instrutoresAdicionais = instrutoresAdicionais !== undefined ? instrutoresAdicionais : treinamento.instrutoresAdicionais;
    treinamento.responsavel = responsavel !== undefined ? responsavel : treinamento.responsavel;
    treinamento.cargoResponsavel = cargoResponsavel !== undefined ? cargoResponsavel : treinamento.cargoResponsavel;
    treinamento.areaResponsavel = areaResponsavel !== undefined ? areaResponsavel : treinamento.areaResponsavel;
    treinamento.observacoes = observacoes !== undefined ? observacoes : treinamento.observacoes;

    await treinamento.save();

    res.json({ treinamento, message: 'Treinamento atualizado com sucesso!' });

  } catch (err) {
    console.error('Erro ao atualizar treinamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETAR treinamento e seus arquivos de mídia
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const treinamento = await Treinamento.findByPk(id);
    if (!treinamento) return res.status(404).json({ error: 'Treinamento não encontrado' });

    // Excluir arquivos de mídia do servidor
    if (treinamento.midias) {
      try {
        const midias = JSON.parse(treinamento.midias);
        midias.forEach(nomeArquivo => {
          const caminhoArquivo = path.join(__dirname, '..', 'uploads', nomeArquivo);
          if (fs.existsSync(caminhoArquivo)) {
            fs.unlinkSync(caminhoArquivo);
            console.log(`Arquivo de mídia excluído: ${nomeArquivo}`);
          }
        });
      } catch (e) {
        console.error('Erro ao excluir arquivos de mídia:', e);
      }
    }

    await treinamento.destroy();

    res.json({ message: 'Treinamento removido com sucesso', treinamento: treinamento.nome });

  } catch (err) {
    console.error('Erro ao remover treinamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
