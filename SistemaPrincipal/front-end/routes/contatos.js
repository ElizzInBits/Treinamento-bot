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

// Função para gerar variações - SIMPLIFICADA
function gerarVariacoes(numeroCompleto) {
    const limpo = limparNumero(numeroCompleto);
    const variacoes = [limpo];
    
    // Se tem 10 dígitos (DDD + 8): adicionar com 9 e com DDI
    if (limpo.length === 10) {
        variacoes.push(limpo.slice(0, 2) + '9' + limpo.slice(2)); // com 9
        variacoes.push('55' + limpo); // com DDI
    }
    // Se tem 11 dígitos (DDD + 9): remover 9 e adicionar DDI
    else if (limpo.length === 11 && limpo.charAt(2) === '9') {
        variacoes.push(limpo.slice(0, 2) + limpo.slice(3)); // sem 9
        variacoes.push('55' + limpo); // com DDI
    }
    // Se tem 12 dígitos (DDI + DDD + 8): adicionar com 9 e remover DDI
    else if (limpo.length === 12 && limpo.startsWith('55')) {
        variacoes.push(limpo.slice(2)); // sem DDI
        variacoes.push(limpo.slice(0, 4) + '9' + limpo.slice(4)); // com 9
    }
    // Se tem 13 dígitos (DDI + DDD + 9): remover 9 e remover DDI
    else if (limpo.length === 13 && limpo.startsWith('55') && limpo.charAt(4) === '9') {
        variacoes.push(limpo.slice(2)); // sem DDI
        variacoes.push(limpo.slice(0, 4) + limpo.slice(5)); // sem 9
    }

    return [...new Set(variacoes)];
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
        
        const { nome, telefone, cpf, sexo, empresa_id, email, cargo, setor, cargo_id, setor_id, unidade_id } = req.body;

        console.log('🔍 DEBUG API - Cargo recebido:', cargo, '| Setor recebido:', setor);
        console.log('🔍 DEBUG API - Cargo ID:', cargo_id, '| Setor ID:', setor_id, '| Unidade ID:', unidade_id);
        console.log('🔍 DEBUG API - Sexo recebido:', sexo);
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

        // Verificar duplicatas de telefone
        const variacoesTelefone = gerarVariacoes(telefoneLimpo);
        const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null;
        
        console.log(`🔍 Verificando duplicatas para: ${telefoneLimpo}`);
        console.log(`🔍 Variações geradas: ${variacoesTelefone.join(', ')}`);
        
        // Buscar contatos com telefones que possam corresponder
        const contatosExistentes = await Usuario.findAll({
            where: {
                telefone: {
                    [Op.in]: variacoesTelefone
                }
            }
        });

        if (contatosExistentes.length > 0) {
            console.log(`❌ Telefone duplicado encontrado: ${contatosExistentes[0].telefone}`);
            return res.status(400).json({
                error: 'Já existe um contato com este telefone'
            });
        }
        
        console.log(`✅ Nenhum telefone duplicado encontrado`);

        // Verificar CPF duplicado se fornecido
        if (cpfLimpo) {
            const cpfExiste = await Usuario.findOne({ where: { cpf: cpfLimpo } });
            if (cpfExiste) {
                console.log(`❌ CPF duplicado encontrado: ${cpfLimpo}`);
                return res.status(400).json({
                    error: 'Já existe um contato com este CPF'
                });
            }
            console.log(`✅ CPF não duplicado`);
        }

        // Criar novo contato
        const novoContato = await Usuario.create({
            nome: nome.trim(),
            telefone: telefoneLimpo,
            cpf: cpfLimpo,
            sexo: sexo.trim(),
            empresa_id: empresa_id ? parseInt(empresa_id, 10) : 1,
            email: email.trim(),
            cargo_id: cargo_id ? parseInt(cargo_id, 10) : null,
            setor_id: setor_id ? parseInt(setor_id, 10) : null,
            unidade_id: unidade_id ? parseInt(unidade_id, 10) : null,
            status_treinamento: 'não iniciado'
        });

        // Emitir evento WebSocket para atualização em tempo real
        const io = req.app.get('io');
        if (io) {
            io.emit('novoUsuario', {
                usuario: novoContato,
                empresa_id: novoContato.empresaId
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
      status_treinamento,
      cpf,
      empresa_id,
      cargo,
      setor,
      treinamento_id
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
    if (status_treinamento) camposParaAtualizar.statusTreinamento = status_treinamento;
    if (cpf !== undefined) camposParaAtualizar.cpf = cpf ? cpf.replace(/\D/g, '') : null;
    if (cargo !== undefined) camposParaAtualizar.cargo = cargo ? cargo.trim() : null;
    if (setor !== undefined) camposParaAtualizar.setor = setor ? setor.trim() : null;

    if (empresa_id !== undefined) {
      camposParaAtualizar.empresaId = empresa_id ? parseInt(empresa_id, 10) : null;
    }

    if (treinamento_id !== undefined) {
        camposParaAtualizar.treinamentoId = treinamento_id
            ? parseInt(treinamento_id, 10)
            : null;
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
                    status_treinamento: 'não iniciado',
                    treinamento_id: null,
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
            status_treinamento: 'não iniciado',
            treinamento_id: null,
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

// Exportar conversa do WhatsApp (rota pública com token)
router.get('/:id/exportar-conversa', async (req, res) => {
    try {
        const contato = await Usuario.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        const { Interacao } = require('../../BancoDeDados/models');
        const variacoesTelefone = gerarVariacoes(contato.telefone);
        
        // Buscar todas as interações do contato
        const interacoes = await Interacao.findAll({
            where: {
                telefone: {
                    [Op.in]: variacoesTelefone
                }
            },
            order: [['created_at', 'ASC']]
        });

        if (interacoes.length === 0) {
            return res.status(404).send('Nenhuma conversa encontrada para este contato');
        }

        // Formatar conversa no estilo WhatsApp
        let conversaTxt = `Conversa com ${contato.nome}\n`;
        conversaTxt += `Telefone: ${formatarTelefoneExport(contato.telefone)}\n`;
        conversaTxt += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;
        conversaTxt += `Total de mensagens: ${interacoes.length}\n`;
        conversaTxt += `${'='.repeat(60)}\n\n`;

        interacoes.forEach(interacao => {
            const data = new Date(interacao.createdAt);
            const dataFormatada = data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const remetente = interacao.tipo === 'enviada' ? 'Bot' : contato.nome;
            const mensagemTexto = typeof interacao.mensagem === 'string' ? interacao.mensagem : JSON.stringify(interacao.mensagem);
            conversaTxt += `[${dataFormatada}] ${remetente}: ${mensagemTexto}\n`;
        });

        // Configurar headers para download
        const nomeArquivo = `conversa_${contato.nome.replace(/\s+/g, '_')}_${Date.now()}.txt`;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
        res.send(conversaTxt);

    } catch (error) {
        console.error('Erro ao exportar conversa:', error);
        res.status(500).send('Erro ao exportar conversa');
    }
});

function formatarTelefoneExport(telefone) {
    if (!telefone) return 'N/A';
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 13) {
        return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    } else if (cleaned.length === 12) {
        return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    } else if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return telefone;
}

// Transferir funcionário entre empresas
router.patch('/:id/transferir-empresa', async (req, res) => {
    try {
        const { novaEmpresaId } = req.body;
        
        if (!novaEmpresaId) {
            return res.status(400).json({ error: 'ID da nova empresa é obrigatório' });
        }

        const contato = await Usuario.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Funcionário não encontrado' });
        }

        const novaEmpresa = await Empresa.findByPk(novaEmpresaId);
        if (!novaEmpresa) {
            return res.status(404).json({ error: 'Nova empresa não encontrada' });
        }

        const empresaAntigaId = contato.empresaId;
        await contato.update({ empresa_id: novaEmpresaId });

        const io = req.app.get('io');
        if (io) {
            io.emit('usuarioTransferido', {
                usuario: contato,
                empresaAntigaId,
                novaEmpresaId,
                timestamp: new Date()
            });
            io.emit('notificacao', {
                tipo: 'usuario_transferido',
                titulo: 'Funcionário Transferido',
                mensagem: `${contato.nome} foi transferido para ${novaEmpresa.razaoSocial}`,
                timestamp: new Date()
            });
        }

        res.json({ 
            message: 'Funcionário transferido com sucesso',
            contato,
            empresaAntiga: empresaAntigaId,
            empresaNova: novaEmpresaId
        });

    } catch (error) {
        console.error('Erro ao transferir funcionário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Ativar/Desativar contato
router.patch('/:id/toggle-ativo', async (req, res) => {
    try {
        const contato = await Usuario.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        const { ativo } = req.body;
        await contato.update({ ativo: ativo });

        const io = req.app.get('io');
        if (io) {
            io.emit('usuarioAtualizado', {
                usuario: contato,
                empresa_id: contato.empresaId
            });
        }

        res.json({ 
            message: `Contato ${ativo === 1 ? 'ativado' : 'desativado'} com sucesso`,
            contato: contato
        });

    } catch (error) {
        console.error('Erro ao alterar status do contato:', error);
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

// Rota de teste para verificar se telefone está cadastrado
router.post('/verificar-telefone', async (req, res) => {
    try {
        const { telefone } = req.body;
        if (!telefone) {
            return res.status(400).json({ error: 'Telefone é obrigatório' });
        }

        const telefoneLimpo = limparNumero(telefone);
        const variacoes = gerarVariacoes(telefoneLimpo);
        
        console.log(`🔍 Verificando telefone: ${telefone}`);
        console.log(`📞 Telefone limpo: ${telefoneLimpo}`);
        console.log(`🔢 Variações: ${variacoes.join(', ')}`);
        
        const contatos = await Usuario.findAll({
            where: {
                telefone: {
                    [Op.in]: variacoes
                }
            }
        });
        
        if (contatos.length > 0) {
            console.log(`✅ Contato(s) encontrado(s): ${contatos.map(c => `${c.nome} (${c.telefone})`).join(', ')}`);
            res.json({
                encontrado: true,
                contatos: contatos.map(c => ({
                    id: c.id,
                    nome: c.nome,
                    telefone: c.telefone,
                    email: c.email,
                    status_treinamento: c.statusTreinamento
                })),
                variacoesTestadas: variacoes
            });
        } else {
            console.log(`❌ Nenhum contato encontrado`);
            res.json({
                encontrado: false,
                variacoesTestadas: variacoes,
                mensagem: 'Nenhum contato encontrado com este telefone'
            });
        }

    } catch (error) {
        console.error('Erro ao verificar telefone:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
