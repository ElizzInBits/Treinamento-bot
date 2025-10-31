const express = require('express');
const router = express.Router();
const { Usuario, Empresa } = require('../../BancoDeDados/models');
const { Op } = require('sequelize');
const { sequelize } = require('../../BancoDeDados/database');
// Função para notificações do navegador
const notificarNovoCadastro = async (contato, io) => {
    const notificacao = {
        titulo: '🆕 Novo Cadastro Realizado',
        mensagem: `${contato.nome} se cadastrou no sistema de treinamentos`,
        dados: {
            tipo: 'novo_cadastro',
            contatoId: contato.id,
            nome: contato.nome,
            telefone: contato.telefone,
            email: contato.email,
            timestamp: new Date().toISOString()
        }
    };
    
    console.log('📱 NOTIFICAÇÃO BROWSER:', notificacao);
    console.log('🔌 WebSocket IO disponível:', !!io);
    
    // Enviar via WebSocket para o frontend mostrar notificação do navegador
    if (io) {
        console.log('📡 Enviando browser-notification via WebSocket');
        io.emit('browser-notification', notificacao);
        console.log('✅ browser-notification enviada');
    } else {
        console.log('❌ WebSocket IO não disponível');
    }
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
    const contatos = await Usuario.findAll({
      include: {
        model: Empresa,
        as: 'empresa',
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
        const contato = await Usuario.findByPk(req.params.id);
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
        
        const { nome, telefone, cpf, empresaId, email, cargo, setor } = req.body;

        console.log('🔍 DEBUG API - Cargo recebido:', cargo, '| Setor recebido:', setor);
        console.log('🔍 DEBUG API - Body completo:', JSON.stringify(req.body, null, 2));

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
        
        const contatosExistentes = await Usuario.findAll();

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
            const cpfExiste = await Usuario.findOne({ where: { cpf: cpfLimpo } });
            if (cpfExiste) {
                return res.status(400).json({
                    error: 'Já existe um contato com este CPF'
                });
            }
        }

        // Criar novo contato
        const novoContato = await Usuario.create({
            nome: nome.trim(),
            telefone: telefoneLimpo,
            cpf: cpfLimpo,
            empresaId: empresaId ? parseInt(empresaId, 10) : 1,
            email: email.trim(),
            cargo: cargo ? cargo.trim() : null,
            setor: setor ? setor.trim() : null,
            statusTreinamento: 'não iniciado'
        });

        // Emitir evento WebSocket para atualização em tempo real
        const io = req.app.get('io');
        if (io) {
            io.emit('novoUsuario', {
                usuario: novoContato,
                empresaId: novoContato.empresaId
            });
            io.emit('notificacao', {
                tipo: 'usuario_cadastrado',
                titulo: 'Novo Usuário Cadastrado',
                mensagem: `${novoContato.nome} foi cadastrado no sistema`,
                timestamp: new Date()
            });
        }

        // Enviar notificação do navegador
        await notificarNovoCadastro(novoContato, io);

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
      email,
      statusTreinamento,
      cpf,
      empresaId,
      cargo,
      setor
    } = req.body;

    const contato = await Usuario.findByPk(req.params.id);
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
      const contatosExistentes = await Usuario.findAll({
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
    if (email !== undefined) camposParaAtualizar.email = email.trim();
    if (statusTreinamento) camposParaAtualizar.statusTreinamento = statusTreinamento;
    if (cpf !== undefined) camposParaAtualizar.cpf = cpf ? cpf.replace(/\D/g, '') : null;
    if (cargo !== undefined) camposParaAtualizar.cargo = cargo ? cargo.trim() : null;
    if (setor !== undefined) camposParaAtualizar.setor = setor ? setor.trim() : null;

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


// Restart em lote de múltiplos contatos
router.post('/restart-lote', async (req, res) => {
    try {
        const { contatoIds } = req.body;
        
        if (!contatoIds || !Array.isArray(contatoIds) || contatoIds.length === 0) {
            return res.status(400).json({ error: 'Lista de IDs de contatos é obrigatória' });
        }

        console.log(`🔄 Iniciando restart em lote para ${contatoIds.length} contatos`);

        const resultados = [];
        const { Interacao } = require('../../BancoDeDados/models');

        for (const id of contatoIds) {
            try {
                const contato = await Usuario.findByPk(id);
                if (!contato) {
                    resultados.push({ id, status: 'erro', mensagem: 'Contato não encontrado' });
                    continue;
                }

                // Gerar variações do telefone
                const variacoesTelefone = gerarVariacoes(contato.telefone);

                // Resetar status
                await contato.update({
                    statusTreinamento: 'não iniciado',
                    treinamentoId: null,
                    dataUltimaInteracao: null
                });

                // Limpar interações
                for (const telefone of variacoesTelefone) {
                    await Interacao.destroy({ where: { telefone: telefone } });
                }

                // Limpar cache
                try {
                    const cacheContatos = require('../../BancoDeDados/cache-contatos');
                    for (const telefone of variacoesTelefone) {
                        cacheContatos.invalidarContato(telefone);
                    }
                } catch (cacheError) {
                    console.log(`⚠️ Erro no cache para ${contato.nome}:`, cacheError.message);
                }

                resultados.push({ 
                    id, 
                    status: 'sucesso', 
                    nome: contato.nome,
                    telefone: contato.telefone
                });

            } catch (error) {
                console.error(`❌ Erro ao reiniciar contato ${id}:`, error);
                resultados.push({ id, status: 'erro', mensagem: error.message });
            }
        }

        // Emitir evento WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('usuariosReiniciados', {
                total: contatoIds.length,
                sucessos: resultados.filter(r => r.status === 'sucesso').length,
                erros: resultados.filter(r => r.status === 'erro').length,
                timestamp: new Date()
            });
        }

        console.log(`✅ Restart em lote concluído: ${resultados.filter(r => r.status === 'sucesso').length}/${contatoIds.length} sucessos`);

        res.json({
            message: 'Restart em lote concluído',
            resultados: resultados,
            total: contatoIds.length,
            sucessos: resultados.filter(r => r.status === 'sucesso').length,
            erros: resultados.filter(r => r.status === 'erro').length
        });

    } catch (error) {
        console.error('❌ Erro no restart em lote:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Restart de treinamento
router.post('/:id/restart-treinamento', async (req, res) => {
    try {
        const contato = await Usuario.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        console.log(`🔄 Iniciando restart do contato: ${contato.nome} (${contato.telefone})`);

        // Gerar todas as variações do telefone para limpeza completa
        const variacoesTelefone = gerarVariacoes(contato.telefone);
        console.log(`📞 Variações do telefone para limpeza: ${variacoesTelefone.join(', ')}`);

        // Resetar status do treinamento
        await contato.update({
            statusTreinamento: 'não iniciado',
            treinamentoId: null,
            dataUltimaInteracao: null
        });
        console.log('✅ Status do contato resetado');

        // Limpar todas as interações do usuário (todas as variações do telefone)
        const { Interacao } = require('../../BancoDeDados/models');
        for (const telefone of variacoesTelefone) {
            const interacoesRemovidas = await Interacao.destroy({
                where: { telefone: telefone }
            });
            if (interacoesRemovidas > 0) {
                console.log(`🗑️ Removidas ${interacoesRemovidas} interações para ${telefone}`);
            }
        }

        // Limpar cache do contato (tentar com todas as variações)
        try {
            const cacheContatos = require('../../BancoDeDados/cache-contatos');
            for (const telefone of variacoesTelefone) {
                cacheContatos.invalidarContato(telefone);
            }
            console.log('🧹 Cache limpo para todas as variações');
        } catch (cacheError) {
            console.log('⚠️ Cache não disponível ou erro ao limpar:', cacheError.message);
        }

        // Emitir evento WebSocket para atualização em tempo real
        const io = req.app.get('io');
        if (io) {
            io.emit('usuarioReiniciado', {
                usuario: contato,
                timestamp: new Date()
            });
            io.emit('notificacao', {
                tipo: 'usuario_reiniciado',
                titulo: 'Usuário Reiniciado',
                mensagem: `${contato.nome} teve o treinamento reiniciado`,
                timestamp: new Date()
            });
            console.log('📡 Eventos WebSocket enviados');
        }

        console.log(`✅ Restart completo do contato ${contato.nome}`);

        res.json({ 
            message: 'Treinamento reiniciado com sucesso',
            contato: contato,
            variacoesLimpas: variacoesTelefone
        });

    } catch (error) {
        console.error('❌ Erro ao reiniciar treinamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Deletar contato
router.delete('/:id', async (req, res) => {
    try {
        const contato = await Usuario.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        // Deletar primeiro as assinaturas de certificados relacionadas
        const { AssinaturaCertificado } = require('../../BancoDeDados/models');
        await AssinaturaCertificado.destroy({
            where: { usuarioId: req.params.id }
        });

        await contato.destroy();
        res.json({ message: 'Contato deletado com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
