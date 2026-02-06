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
    const treinamentos = await Treinamento.findAll({ 
      order: [['nome', 'ASC']]
    });
    res.json(treinamentos);
  } catch (err) {
    console.error('Erro ao listar treinamentos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo treinamento com upload de arquivos
router.post('/', async (req, res) => {
  console.log('📝 Dados recebidos no POST /api/treinamentos:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Content-Type:', req.get('Content-Type'));
  
  // Se é multipart/form-data, usar multer
  if (req.get('Content-Type')?.includes('multipart/form-data')) {
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
      
      return await criarTreinamento(req, res);
    });
  } else {
    // Se é application/json, processar diretamente
    return await criarTreinamento(req, res);
  }
});

// Função auxiliar para criar treinamento
async function criarTreinamento(req, res) {
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
        observacoes = '',
        tipoGamificado = false,
        configQuiz = null
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
        carga_horaria: parseInt(cargaHoraria),
        tipo,
        em_conformidade: emConformidade,
        aproveitamento_conteudo: aproveitamento,
        conteudo_programatico: conteudoProgramatico,
        instrutor_principal: instrutor,
        qualificacao_instrutor: qualificacaoInstrutor,
        registro_instrutor: registroInstrutor || 'N/A',
        responsavel_treinamento: responsavel,
        cargo_responsavel: cargoResponsavel,
        registro_responsavel: registroResponsavel || 'N/A',
        area_responsavel: areaResponsavel,
        midias_treinamento: JSON.stringify(midias),
        tipo_gamificado: tipoGamificado === 'true' || tipoGamificado === true,
        config_quiz: configQuiz ? (typeof configQuiz === 'string' ? configQuiz : JSON.stringify(configQuiz)) : null
      });

      console.log('✅ Treinamento criado com sucesso:', novo.nome);
      return res.status(201).json(novo);

    } catch (err) {
      console.error('❌ Erro ao criar treinamento:', err);
      return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
    }
}

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
    treinamento.carga_horaria = cargaHoraria;
    treinamento.tipo = tipo;
    treinamento.em_conformidade = emConformidade;
    treinamento.aproveitamento_conteudo = aproveitamento;
    treinamento.conteudo_programatico = conteudoProgramatico;
    treinamento.instrutor_principal = instrutor;
    treinamento.qualificacao_instrutor = qualificacaoInstrutor;
    treinamento.registro_instrutor = registroInstrutor || 'N/A';
    treinamento.responsavel_treinamento = responsavel;
    treinamento.cargo_responsavel = cargoResponsavel;
    treinamento.registro_responsavel = registroResponsavel || 'N/A';
    treinamento.area_responsavel = areaResponsavel;

    // Se enviou arquivos, adiciona às mídias existentes
    if (midias.length > 0) {
      let midiasExistentes = [];
      try {
        midiasExistentes = treinamento.midias_treinamento ? JSON.parse(treinamento.midias_treinamento) : [];
      } catch (e) {
        midiasExistentes = [];
      }
      
      const todasMidias = [...midiasExistentes, ...midias];
      treinamento.midias_treinamento = JSON.stringify(todasMidias);
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
      midias = treinamento.midias_treinamento ? JSON.parse(treinamento.midias_treinamento) : [];
    } catch (e) {
      midias = [];
    }
    
    // Remover a mídia da lista
    const novasMidias = midias.filter(m => m !== nomeArquivo);
    
    // Atualizar no banco
    treinamento.midias_treinamento = JSON.stringify(novasMidias);
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