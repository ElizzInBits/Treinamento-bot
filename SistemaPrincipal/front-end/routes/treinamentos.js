const express = require('express');
const router = express.Router();
const { Treinamento } = require('../../BancoDeDados/models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de destino existe
const uploadDir = path.join(__dirname, '../../media/treinamentos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${unique}-${baseName}${extension}`);
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
router.post('/', (req, res) => {
  upload.array('midias', 10)(req, res, async (err) => {
    if (err) {
      console.error('❌ Erro no upload:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Arquivo muito grande. Limite: 20MB por arquivo.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Muitos arquivos. Limite: 10 arquivos.' });
        }
      }
      return res.status(400).json({ error: err.message || 'Erro no upload de arquivos' });
    }

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
        registroInstrutor = '',
        instrutoresAdicionais = '',
        responsavel,
        cargoResponsavel = '',
        registroResponsavel = '',
        areaResponsavel,
        observacoes = ''
      } = req.body;

      // Arquivos enviados
      const midias = req.files ? req.files.map(f => f.filename) : [];
      console.log('📁 Arquivos recebidos:', midias);

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
        cargaHoraria: parseInt(cargaHoraria),
        tipo,
        emConformidade,
        aproveitamento,
        conteudo: conteudoProgramatico,
        instrutor,
        qualificacaoInstrutor,
        registroInstrutor: registroInstrutor || 'N/A',
        instrutoresAdicionais,
        responsavel,
        cargoResponsavel,
        registroResponsavel: registroResponsavel || 'N/A',
        areaResponsavel,
        observacoes,
        midias: JSON.stringify(midias)
      });

      console.log('✅ Treinamento criado com sucesso:', novo.nome);
      return res.status(201).json(novo);

    } catch (err) {
      console.error('❌ Erro ao criar treinamento:', err);
      return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
    }
  });
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
      registroInstrutor = '',
      instrutoresAdicionais = '',
      responsavel,
      cargoResponsavel = '',
      registroResponsavel = '',
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
    treinamento.registroInstrutor = registroInstrutor || 'N/A';
    treinamento.instrutoresAdicionais = instrutoresAdicionais;
    treinamento.responsavel = responsavel;
    treinamento.cargoResponsavel = cargoResponsavel;
    treinamento.registroResponsavel = registroResponsavel || 'N/A';
    treinamento.areaResponsavel = areaResponsavel;
    treinamento.observacoes = observacoes;

    // Se enviou arquivos, adiciona às mídias existentes
    if (midias.length > 0) {
      let midiasExistentes = [];
      try {
        midiasExistentes = treinamento.midias ? JSON.parse(treinamento.midias) : [];
      } catch (e) {
        midiasExistentes = [];
      }
      
      const todasMidias = [...midiasExistentes, ...midias];
      treinamento.midias = JSON.stringify(todasMidias);
    }

    await treinamento.save();

    res.json({ treinamento });

  } catch (err) {
    console.error('Erro ao atualizar treinamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover mídia específica de um treinamento
router.delete('/:id/midia/:nomeArquivo', async (req, res) => {
  try {
    const { id, nomeArquivo } = req.params;
    
    const treinamento = await Treinamento.findByPk(id);
    if (!treinamento) {
      return res.status(404).json({ error: 'Treinamento não encontrado' });
    }
    
    // Parse das mídias existentes
    let midias = [];
    try {
      midias = treinamento.midias ? JSON.parse(treinamento.midias) : [];
    } catch (e) {
      midias = [];
    }
    
    // Remover a mídia da lista
    const novasMidias = midias.filter(m => m !== nomeArquivo);
    
    // Atualizar no banco
    treinamento.midias = JSON.stringify(novasMidias);
    await treinamento.save();
    
    // Tentar remover o arquivo físico
    try {
      const caminhoArquivo = path.join(uploadDir, nomeArquivo);
      if (fs.existsSync(caminhoArquivo)) {
        fs.unlinkSync(caminhoArquivo);
      }
    } catch (e) {
      console.warn('Não foi possível remover o arquivo físico:', e.message);
    }
    
    res.json({ message: 'Mídia removida com sucesso' });
    
  } catch (err) {
    console.error('Erro ao remover mídia:', err);
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