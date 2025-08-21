const express = require('express');
const router = express.Router();
const { Contato, Empresa } = require('../../BancoDeDados/models');
const { Op } = require('sequelize');
const { sequelize } = require('../../BancoDeDados/database');

// Função para limpar número (mesma do seu código)
function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

// Função para validar telefone - Apenas DDI+DDD (igual ao frontend)
function validarTelefone(telefone) {
    const cleaned = limparNumero(telefone);

    // Aceitar apenas números com 12 ou 13 dígitos (DDI+DDD+número)
    if (cleaned.length !== 12 && cleaned.length !== 13) {
        return false;
    }

    // Validar se os primeiros 2 dígitos são um DDI válido (10-99)
    const ddi = cleaned.slice(0, 2);
    if (parseInt(ddi) < 10 || parseInt(ddi) > 99) {
        return false;
    }

    // Validar se os próximos 2 dígitos são um DDD válido (11-99)
    const ddd = cleaned.slice(2, 4);
    if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
        return false;
    }

    // Validar se o número tem o tamanho correto após DDI+DDD
    const numero = cleaned.slice(4);
    if (numero.length !== 8 && numero.length !== 9) {
        return false;
    }

    return true;
}

// Função para validar CPF simples (apenas dígitos e tamanho)
function validarCPF(cpf) {
    if (!cpf) return true; // cpf opcional

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    return true;
}

// Função para gerar variações (atualizada para trabalhar com DDI+DDD)
function gerarVariacoes(numeroCompleto) {
    const limpo = limparNumero(numeroCompleto);

    // Se não tem pelo menos 12 dígitos, retorna apenas o número limpo
    if (limpo.length < 12) return [limpo];

    // Verifica se começa com DDI 55 (Brasil)
    if (!limpo.startsWith('55')) return [limpo];

    const ddd = limpo.slice(2, 4);
    const base = limpo.slice(4);

    let var1 = limpo;
    let var2 = limpo;

    // Gera variações com e sem o 9 no celular
    if (base.length === 9 && base[0] === '9') {
        // Remove o 9 do celular
        var2 = '55' + ddd + base.slice(1);
    } else if (base.length === 8) {
        // Adiciona o 9 no celular
        var2 = '55' + ddd + '9' + base;
    }

    return [var1, var2];
}

// Listar todos os contatos
router.get('/', async (req, res) => {
  try {
    const contatos = await Contato.findAll({
      include: {
        model: Empresa,
        as: 'empresaRef',
        attributes: ['razao_social']
      },
      order: [['nome', 'ASC']]
    });
    res.json(contatos);
  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    if (error.name === 'SequelizeConnectionRefusedError') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});



// Buscar contato por ID
router.get('/:id', async (req, res) => {
    try {
        const contato = await Contato.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }
        res.json(contato);
    } catch (error) {
        console.error('Erro ao buscar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Cadastrar novo contato com validação de email
router.post('/', async (req, res) => {
    try {
        console.log('📝 Dados recebidos no POST /api/contatos:');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('Body type:', typeof req.body);
        
        const { nome, telefone, cpf, empresaId, email } = req.body;

        // Validação básica
        if (!nome || !telefone || !email) {
            return res.status(400).json({
                error: 'Nome, telefone e email são obrigatórios'
            });
        }

        // Validar email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email inválido'
            });
        }

        // Validar CPF simples
        if (!validarCPF(cpf)) {
            return res.status(400).json({
                error: 'CPF inválido. Deve conter 11 dígitos numéricos.'
            });
        }

        // Limpar e validar telefone
        const telefoneLimpo = limparNumero(telefone);
        if (!validarTelefone(telefoneLimpo)) {
            return res.status(400).json({
                error: 'Por favor, insira um telefone válido com DDI+DDD+número (12 ou 13 dígitos)'
            });
        }

        // Verificar se já existe contato com este telefone
        const variacoesTelefone = gerarVariacoes(telefoneLimpo);
        const contatosExistentes = await Contato.findAll();

        const jaExiste = contatosExistentes.some(contato => {
            const variacoesContato = gerarVariacoes(contato.telefone);
            return variacoesTelefone.some(num => variacoesContato.includes(num));
        });

        if (jaExiste) {
            return res.status(400).json({
                error: 'Já existe um contato com este telefone'
            });
        }

        // Criar novo contato incluindo email
        const novoContato = await Contato.create({
            nome: nome.trim(),
            telefone: telefoneLimpo,
            cpf: cpf ? cpf.replace(/\D/g, '') : null,
            //empresa: (typeof empresa === 'string' && empresa.trim()) || null,
            empresaId: empresaId ? parseInt(empresaId, 10) : null,
            email: email.trim(),
            statusTreinamento: 'não iniciado'
        });

        // Emitir evento WebSocket para atualização em tempo real
        const io = req.app.get('io');
        if (io) {
            io.emit('novoContato', {
                contato: novoContato,
                empresaId: novoContato.empresaId
            });
            io.emit('notificacao', {
                tipo: 'contato_cadastrado',
                titulo: 'Novo Contato Cadastrado',
                mensagem: `${novoContato.nome} foi cadastrado no sistema`,
                timestamp: new Date()
            });
        }

        res.status(201).json({
            message: 'Contato cadastrado com sucesso',
            contato: novoContato
        });

    } catch (error) {
        console.error('Erro ao cadastrar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      nome,
      telefone,
      nomeCompleto,
      email,
      statusTreinamento,
      cpf,
      empresaId // ✅ usamos empresaId agora
    } = req.body;

    const contato = await Contato.findByPk(req.params.id);
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    // 🔍 Validação do telefone, se enviado
    if (telefone) {
      const telefoneLimpo = limparNumero(telefone);

      if (!validarTelefone(telefoneLimpo)) {
        return res.status(400).json({
          error: 'Por favor, insira um telefone válido com DDI+DDD+número (12 ou 13 dígitos)'
        });
      }

      // Verifica se outro contato já usa esse telefone
      const variacoesTelefone = gerarVariacoes(telefoneLimpo);
      const contatosExistentes = await Contato.findAll({
        where: { id: { [Op.ne]: req.params.id } }
      });

      const jaExiste = contatosExistentes.some(outro => {
        const variacoesContato = gerarVariacoes(outro.telefone);
        return variacoesTelefone.some(num => variacoesContato.includes(num));
      });

      if (jaExiste) {
        return res.status(400).json({
          error: 'Já existe outro contato com este telefone'
        });
      }
    }

    // 🔍 Validação do e-mail, se enviado
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }
    }

    // 🔍 Validação do CPF, se enviado
    if (cpf !== undefined) {
      if (!validarCPF(cpf)) {
        return res.status(400).json({
          error: 'CPF inválido. Deve conter 11 dígitos numéricos.'
        });
      }
    }

    // 🔧 Monta objeto com os campos a atualizar
    const camposParaAtualizar = {};
    if (nome) camposParaAtualizar.nome = nome.trim();
    if (telefone) camposParaAtualizar.telefone = limparNumero(telefone);
    if (nomeCompleto !== undefined) camposParaAtualizar.nomeCompleto = nomeCompleto;
    if (email !== undefined) camposParaAtualizar.email = email.trim();
    if (statusTreinamento) camposParaAtualizar.statusTreinamento = statusTreinamento;
    if (cpf !== undefined) camposParaAtualizar.cpf = cpf ? cpf.replace(/\D/g, '') : null;

    // ✅ Corrigido: atualiza a empresa corretamente via ID (chave estrangeira)
    if (empresaId !== undefined) {
      camposParaAtualizar.empresaId = empresaId ? parseInt(empresaId, 10) : null;
    }

    // ✨ Executa atualização
    await contato.update(camposParaAtualizar);

    res.json({
      message: 'Contato atualizado com sucesso',
      contato: contato
    });

  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Deletar contato
router.delete('/:id', async (req, res) => {
    try {
        const contato = await Contato.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        await contato.destroy();
        res.json({ message: 'Contato deletado com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
