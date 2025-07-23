const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Treinamento = require('../BancoDeDados/models/treinamento'); // ajuste o caminho se necessário

// Função auxiliar para normalizar nome de arquivo (usada em várias rotas)
function normalizarNomeArquivo(nome) {
  return nome
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove caracteres especiais
    .replace(/\s+/g, '_') // espaços para _
    .toLowerCase();
}

// Função para criar arquivo de template
function criarArquivoTemplate(nomeArquivo, nomeTreinamento) {
  const caminhoArquivo = path.join(__dirname, '..', 'SistemaPrincipal', 'TemplatesMensagens', 'Treinamentos', `${nomeArquivo}.js`);

  // Cria o diretório se não existir
  const diretorio = path.dirname(caminhoArquivo);
  if (!fs.existsSync(diretorio)) {
    fs.mkdirSync(diretorio, { recursive: true });
  }

  // Conteúdo do template
  const conteudoTemplate = `// Template de mensagens para o treinamento: ${nomeTreinamento}
// Arquivo gerado automaticamente em ${new Date().toLocaleString('pt-BR')}

const ${nomeArquivo} = {
  // Mensagens de boas-vindas
  boasVindas: {
    inicial: \`Olá! Bem-vindo(a) ao treinamento "${nomeTreinamento}"! 🎉\`,
    confirmacao: \`Sua inscrição no treinamento "${nomeTreinamento}" foi confirmada com sucesso!\`,
    instrucoes: \`Você receberá todas as informações e materiais sobre o treinamento "${nomeTreinamento}" em breve.\`
  },

  // Mensagens de lembrete
  lembretes: {
    inicio: \`⏰ Lembrete: O treinamento "${nomeTreinamento}" começará em breve!\`,
    material: \`📚 Não se esqueça de baixar o material do treinamento "${nomeTreinamento}".\`,
    participacao: \`Sua participação no treinamento "${nomeTreinamento}" é muito importante!\`
  },

  // Mensagens de acompanhamento
  acompanhamento: {
    progresso: \`Como está sendo sua experiência no treinamento "${nomeTreinamento}"?\`,
    feedback: \`Gostaríamos de saber sua opinião sobre o treinamento "${nomeTreinamento}".\`,
    suporte: \`Precisa de ajuda com o treinamento "${nomeTreinamento}"? Estamos aqui para ajudar!\`
  },

  // Mensagens de encerramento
  encerramento: {
    conclusao: \`Parabéns por concluir o treinamento "${nomeTreinamento}"! 🎊\`,
    certificado: \`Seu certificado do treinamento "${nomeTreinamento}" está disponível.\`,
    agradecimento: \`Obrigado por participar do treinamento "${nomeTreinamento}"!\`
  },

  // Mensagens personalizadas (adicione suas próprias mensagens aqui)
  personalizadas: {
    // Exemplo:
    // motivacional: \`Continue firme no treinamento "${nomeTreinamento}"! Você está indo muito bem!\`
  }
};

// Função para obter mensagem por categoria e tipo
function obterMensagem(categoria, tipo) {
  if (${nomeArquivo}[categoria] && ${nomeArquivo}[categoria][tipo]) {
    return ${nomeArquivo}[categoria][tipo];
  }
  return \`Mensagem não encontrada para o treinamento "${nomeTreinamento}".\`;
}

// Função para obter todas as mensagens de uma categoria
function obterMensagensCategoria(categoria) {
  return ${nomeArquivo}[categoria] || {};
}

// Função para adicionar mensagem personalizada
function adicionarMensagemPersonalizada(chave, mensagem) {
  ${nomeArquivo}.personalizadas[chave] = mensagem;
}

module.exports = {
  templates: ${nomeArquivo},
  obterMensagem,
  obterMensagensCategoria,
  adicionarMensagemPersonalizada,
  nomeTreinamento: "${nomeTreinamento}",
  nomeArquivo: "${nomeArquivo}",
  dataCriacao: "${new Date().toISOString()}"
};
`;

  // Escreve o arquivo
  fs.writeFileSync(caminhoArquivo, conteudoTemplate, 'utf8');
  return caminhoArquivo;
}

// Função para excluir arquivo de template
function excluirArquivoTemplate(nomeArquivo) {
  const caminhoArquivo = path.join(__dirname, '..', 'SistemaPrincipal', 'TemplatesMensagens', 'Treinamentos', `${nomeArquivo}.js`);

  if (fs.existsSync(caminhoArquivo)) {
    fs.unlinkSync(caminhoArquivo);
    return true;
  }
  return false;
}

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
    const { nome, descricao } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome do treinamento é obrigatório' });
    }

    const nomeLimpo = nome.trim();

    // Verifica se já existe um treinamento com o mesmo nome
    const existente = await Treinamento.findOne({ where: { nome: nomeLimpo } });
    if (existente) {
      return res.status(400).json({ error: 'Já existe um treinamento com este nome' });
    }

    // Cria o novo treinamento no banco
    const novo = await Treinamento.create({
      nome: nomeLimpo,
      descricao: descricao || ''
    });

    res.status(201).json({
      sucesso: true,
      treinamento: novo,
      message: 'Treinamento criado com sucesso!'
    });

  } catch (err) {
    console.error('❌ Erro ao criar treinamento:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor', detalhes: err.message });
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

    const nomeAntigo = treinamento.nome;
    let arquivoRenomeado = false;

    if (nome && nome.trim() !== treinamento.nome) {
      // Verifica se o novo nome já existe
      const existente = await Treinamento.findOne({ where: { nome: nome.trim() } });
      if (existente && existente.id !== treinamento.id) {
        return res.status(400).json({ error: 'Já existe um treinamento com este nome' });
      }

      // Renomear arquivo de template
      try {
        const nomeArquivoAntigo = normalizarNomeArquivo(nomeAntigo);
        const nomeArquivoNovo = normalizarNomeArquivo(nome.trim());

        const caminhoAntigo = path.join(__dirname, '..', 'SistemaPrincipal', 'TemplatesMensagens', 'Treinamentos', `${nomeArquivoAntigo}.js`);
        const caminhoNovo = path.join(__dirname, '..', 'SistemaPrincipal', 'TemplatesMensagens', 'Treinamentos', `${nomeArquivoNovo}.js`);

        if (fs.existsSync(caminhoAntigo)) {
          // Lê o conteúdo do arquivo antigo
          let conteudo = fs.readFileSync(caminhoAntigo, 'utf8');

          // Atualiza as referências no conteúdo
          const regexNomeAntigo = new RegExp(nomeAntigo, 'g');
          const regexNomeArquivoAntigo = new RegExp(nomeArquivoAntigo, 'g');
          conteudo = conteudo.replace(regexNomeAntigo, nome.trim());
          conteudo = conteudo.replace(regexNomeArquivoAntigo, nomeArquivoNovo);

          // Escreve o novo arquivo
          fs.writeFileSync(caminhoNovo, conteudo, 'utf8');

          // Remove o arquivo antigo
          fs.unlinkSync(caminhoAntigo);

          arquivoRenomeado = true;
          console.log(`✅ Arquivo de template renomeado: ${caminhoAntigo} → ${caminhoNovo}`);
        }
      } catch (fileErr) {
        console.error('Erro ao renomear arquivo de template:', fileErr);
      }

      treinamento.nome = nome.trim();
    }

    if (descricao !== undefined) {
      treinamento.descricao = descricao;
    }

    await treinamento.save();

    res.json({
      treinamento,
      arquivoRenomeado,
      message: 'Treinamento atualizado com sucesso!'
    });

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

    const nomeTreinamento = treinamento.nome;
    const nomeArquivo = normalizarNomeArquivo(nomeTreinamento);

    // Remove o treinamento do banco de dados
    await treinamento.destroy();

    // Remove o arquivo de template
    try {
      const arquivoExcluido = excluirArquivoTemplate(nomeArquivo);
      if (arquivoExcluido) {
        console.log(`✅ Arquivo de template excluído: ${nomeArquivo}.js`);
      } else {
        console.log(`⚠️  Arquivo de template não encontrado: ${nomeArquivo}.js`);
      }
    } catch (fileErr) {
      console.error('Erro ao excluir arquivo de template:', fileErr);
    }

    res.json({
      message: 'Treinamento removido com sucesso',
      treinamento: nomeTreinamento,
      templateExcluido: true
    });

  } catch (err) {
    console.error('Erro ao remover treinamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
