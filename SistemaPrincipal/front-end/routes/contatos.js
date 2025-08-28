const express = require('express');
const router = express.Router();
const { Contato, Empresa } = require('../../BancoDeDados/models');
const { Op } = require('sequelize');
const { sequelize } = require('../../BancoDeDados/database');
// Função temporária para notificações (substituir por Firebase quando configurado)
const notificarNovoCadastro = async (contato) => {
    console.log('📱 NOTIFICAÇÃO GOOGLE (simulada):', {
        titulo: '🆕 Novo Cadastro Realizado',
        mensagem: `${contato.nome} se cadastrou no sistema de treinamentos`,
        dados: {
            tipo: 'novo_cadastro',
            contatoId: contato.id,
            nome: contato.nome,
            telefone: contato.telefone,
            email: contato.email
        }
    });
};

// Função para limpar número (mesma do seu código)
function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

// Função para validar telefone - MELHORADA
function validarTelefone(telefone) {
    const cleaned = limparNumero(telefone);
    console.log(`🔍 Validando telefone: "${telefone}" -> "${cleaned}" (${cleaned.length} dígitos)`);

    // Aceitar números com 10, 11, 12 ou 13 dígitos
    if (cleaned.length < 10 || cleaned.length > 13) {
        console.log(`❌ Tamanho inválido: ${cleaned.length} dígitos`);
        return false;
    }

    // Se tem 10 ou 11 dígitos (apenas DDD + número)
    if (cleaned.length === 10 || cleaned.length === 11) {
        const ddd = cleaned.slice(0, 2);
        if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
            console.log(`❌ DDD inválido: ${ddd}`);
            return false;
        }
        console.log(`✅ Telefone válido (DDD+número): ${cleaned}`);
        return true;
    }

    // Se tem 12 ou 13 dígitos (DDI + DDD + número)
    if (cleaned.length === 12 || cleaned.length === 13) {
        const ddi = cleaned.slice(0, 2);
        const ddd = cleaned.slice(2, 4);
        
        // Validar DDI (aceitar mais DDIs comuns)
        const ddisValidos = ['55', '1', '44', '33', '49', '39', '34', '351', '54', '56', '57', '51'];
        if (!ddisValidos.includes(ddi)) {
            console.log(`❌ DDI inválido: ${ddi}`);
            return false;
        }
        
        // Validar DDD
        if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
            console.log(`❌ DDD inválido: ${ddd}`);
            return false;
        }
        
        console.log(`✅ Telefone válido (DDI+DDD+número): ${cleaned}`);
        return true;
    }

    return false;
}

// Função para validar CPF simples (apenas dígitos e tamanho)
function validarCPF(cpf) {
    if (!cpf) return true; // cpf opcional

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    return true;
}

// Função para gerar variações - MELHORADA
function gerarVariacoes(numeroCompleto) {
    const limpo = limparNumero(numeroCompleto);
    const variacoes = [limpo];
    
    console.log(`🔄 Gerando variações para: ${limpo}`);

    // Se tem 10 dígitos (DDD + 8 dígitos)
    if (limpo.length === 10) {
        // Adicionar variação com 9
        const comNove = limpo.slice(0, 2) + '9' + limpo.slice(2);
        variacoes.push(comNove);
        
        // Adicionar variações com DDI 55
        variacoes.push('55' + limpo);
        variacoes.push('55' + comNove);
    }
    
    // Se tem 11 dígitos (DDD + 9 dígitos)
    else if (limpo.length === 11) {
        // Remover o 9 se estiver na posição correta
        if (limpo.charAt(2) === '9') {
            const semNove = limpo.slice(0, 2) + limpo.slice(3);
            variacoes.push(semNove);
        }
        
        // Adicionar variações com DDI 55
        variacoes.push('55' + limpo);
        if (limpo.charAt(2) === '9') {
            const semNove = limpo.slice(0, 2) + limpo.slice(3);
            variacoes.push('55' + semNove);
        }
    }
    
    // Se tem 12 dígitos (DDI + DDD + 8 dígitos)
    else if (limpo.length === 12) {
        // Adicionar variação com 9
        const comNove = limpo.slice(0, 4) + '9' + limpo.slice(4);
        variacoes.push(comNove);
        
        // Remover DDI se for 55
        if (limpo.startsWith('55')) {
            variacoes.push(limpo.slice(2));
            variacoes.push(limpo.slice(2, 4) + '9' + limpo.slice(4));
        }
    }
    
    // Se tem 13 dígitos (DDI + DDD + 9 dígitos)
    else if (limpo.length === 13) {
        // Remover o 9 se estiver na posição correta
        if (limpo.charAt(4) === '9') {
            const semNove = limpo.slice(0, 4) + limpo.slice(5);
            variacoes.push(semNove);
        }
        
        // Remover DDI se for 55
        if (limpo.startsWith('55')) {
            variacoes.push(limpo.slice(2));
            if (limpo.charAt(4) === '9') {
                const semNove = limpo.slice(2, 4) + limpo.slice(5);
                variacoes.push(semNove);
            }
        }
    }

    // Remover duplicatas
    const varicoesUnicas = [...new Set(variacoes)];
    console.log(`🔄 Variações geradas: ${varicoesUnicas.join(', ')}`);
    
    return varicoesUnicas;
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
        
        const { nome, telefone, cpf, empresaId, email, nomeEmpresa } = req.body;

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

        // Verificar duplicatas de telefone e CPF
        const variacoesTelefone = gerarVariacoes(telefoneLimpo);
        const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null;
        
        const contatosExistentes = await Contato.findAll();

        const telefoneExiste = contatosExistentes.some(contato => {
            const variacoesContato = gerarVariacoes(contato.telefone);
            return variacoesTelefone.some(num => variacoesContato.includes(num));
        });

        if (telefoneExiste) {
            return res.status(400).json({
                error: 'Já existe um contato com este telefone'
            });
        }

        // Verificar CPF duplicado se fornecido
        if (cpfLimpo) {
            const cpfExiste = await Contato.findOne({ where: { cpf: cpfLimpo } });
            if (cpfExiste) {
                return res.status(400).json({
                    error: 'Já existe um contato com este CPF'
                });
            }
        }

        // Criar novo contato
        const novoContato = await Contato.create({
            nome: nome.trim(),
            telefone: telefoneLimpo,
            cpf: cpfLimpo,
            empresaId: empresaId ? parseInt(empresaId, 10) : 1,
            email: email.trim(),
            nomeEmpresa: nomeEmpresa ? nomeEmpresa.trim() : null,
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

        // Enviar notificação do Google
        await notificarNovoCadastro(novoContato);

        res.status(201).json({
            message: 'Contato cadastrado com sucesso',
            contato: novoContato
        });

    } catch (error) {
        console.error('Erro ao cadastrar contato:', error);
        
        // Tratar erros específicos de duplicata
        if (error.name === 'SequelizeUniqueConstraintError') {
            const campo = error.errors[0]?.path;
            if (campo === 'cpf') {
                return res.status(400).json({ error: 'Já existe um contato com este CPF' });
            }
            if (campo === 'telefone') {
                return res.status(400).json({ error: 'Já existe um contato com este telefone' });
            }
            return res.status(400).json({ error: 'Dados já existem no sistema' });
        }
        
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
      empresaId, // ✅ usamos empresaId agora
      nomeEmpresa
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
    if (nomeEmpresa !== undefined) camposParaAtualizar.nomeEmpresa = nomeEmpresa ? nomeEmpresa.trim() : null;

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


// Restart de treinamento
router.post('/:id/restart-treinamento', async (req, res) => {
    try {
        const contato = await Contato.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        // Resetar status do treinamento
        await contato.update({
            statusTreinamento: 'não iniciado',
            treinamentoId: null
        });

        // Limpar todas as interações do usuário
        const { Interacao } = require('../../BancoDeDados/models');
        await Interacao.destroy({
            where: { telefone: contato.telefone }
        });

        // Limpar cache do contato
        const cacheContatos = require('../../BancoDeDados/cache-contatos');
        cacheContatos.invalidarContato(contato.telefone);

        res.json({ 
            message: 'Treinamento reiniciado com sucesso',
            contato: contato
        });

    } catch (error) {
        console.error('Erro ao reiniciar treinamento:', error);
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
