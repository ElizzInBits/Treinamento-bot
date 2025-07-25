// routes/contatos.js
const express = require('express');
const router = express.Router();
const { Contato } = require('../BancoDeDados/models/index');
const { sequelize } = require('../BancoDeDados/database');
const { Op } = require('sequelize');

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

// Função para gerar variações (atualizada para trabalhar com DDI+DDD)
function gerarVariacoes(numeroCompleto) {
  const limpo = limparNumero(numeroCompleto);
  if (limpo.length < 12) return [limpo];
  if (!limpo.startsWith('55')) return [limpo];

  const ddd = limpo.slice(2, 4);
  const base = limpo.slice(4);

  if (base.length === 9 && base.startsWith('9')) {
    return [limpo, '55' + ddd + base.slice(1)];
  } else if (base.length === 8) {
    return [limpo, '55' + ddd + '9' + base];
  }

  return [limpo];
}


// POST /api/contatos - VERSÃO DEBUG AJUSTADA
router.post('/', async (req, res) => {
    try {
        console.log('=== INÍCIO DEBUG POST /api/contatos ===');
        console.log('1. Dados recebidos no req.body:', req.body);

        const { nome, telefone, empresaId, treinamentoId, cpf, email } = req.body;

        console.log('2. Dados extraídos:');
        console.log('   - nome:', nome);
        console.log('   - telefone:', telefone);
        console.log('   - empresaId:', empresaId, '(tipo:', typeof empresaId, ')');
        console.log('   - treinamentoId:', treinamentoId);
        console.log('   - cpf:', cpf);
        console.log('   - email:', email);

        // Validação simples dos campos obrigatórios
        if (!nome || !telefone) {
            console.log('3. ERRO: Campos obrigatórios faltando');
            return res.status(400).json({
                error: 'Nome e telefone são obrigatórios'
            });
        }

        console.log('3. Validação inicial: OK');

        // Limpar telefone
        const telefoneLimpo = limparNumero(telefone);
        console.log('4. Telefone limpo:', telefoneLimpo);

        // Validar telefone
        if (!validarTelefone(telefoneLimpo)) {
            console.log('5. ERRO: Telefone inválido');
            return res.status(400).json({
                error: 'Por favor, insira um telefone válido com DDI+DDD+número (12 ou 13 dígitos)'
            });
        }

        console.log('5. Validação telefone: OK');

        // Verificar se empresaId existe (se fornecido)
        if (empresaId) {
            console.log('6. Verificando se empresaId existe...');
            const empresaExiste = await sequelize.query(
                'SELECT id FROM empresas WHERE id = ?',
                {
                    replacements: [empresaId],
                    type: sequelize.QueryTypes.SELECT
                }
            );

            console.log('   - Resultado da busca empresa:', empresaExiste);

            if (empresaExiste.length === 0) {
                console.log('7. ERRO: EmpresaId não encontrado');
                return res.status(400).json({
                    error: `Empresa com ID ${empresaId} não encontrada`
                });
            }
        }

        console.log('6. Verificação empresa: OK');

        // Verificar se já existe contato com este telefone
        console.log('7. Verificando contatos existentes...');
        const variacoesTelefone = gerarVariacoes(telefoneLimpo);
        console.log('   - Variações do telefone:', variacoesTelefone);

        const contatosExistentes = await Contato.findAll({
            where: {
                telefone: {
                    [Op.in]: variacoesTelefone
                }
            }
        });

        console.log('   - Total de contatos existentes:', contatosExistentes.length);

        const jaExiste = contatosExistentes.some(contato => {
            const variacoesContato = gerarVariacoes(contato.telefone);
            return variacoesTelefone.some(num => variacoesContato.includes(num));
        });

        if (jaExiste) {
            console.log('8. ERRO: Telefone já existe');
            return res.status(400).json({
                error: 'Já existe um contato com este telefone'
            });
        }

        console.log('8. Verificação duplicata: OK');

        // Preparar dados para criação
        const dadosParaCriacao = {
            nome: nome.trim(),
            telefone: telefoneLimpo,
            statusTreinamento: 'não iniciado',
            treinamentoId: treinamentoId ? parseInt(treinamentoId, 10) : null,
            cpf: cpf || null,
            email: email || null
        };

        // Só adicionar empresaId se foi fornecido
        if (empresaId) {
            dadosParaCriacao.empresaId = parseInt(empresaId, 10);

        }

        console.log('9. Dados preparados para criação:', dadosParaCriacao);

        // Criar novo contato
        console.log('10. Criando contato no banco...');
        const novoContato = await Contato.create(dadosParaCriacao);
        console.log('11. Contato criado com sucesso:', novoContato.toJSON());

        res.status(201).json({
            message: 'Contato cadastrado com sucesso',
            contato: novoContato,
            id: novoContato.id
        });

        console.log('=== FIM DEBUG POST /api/contatos - SUCESSO ===');

    } catch (err) {
        console.error('=== ERRO NO POST /api/contatos ===');
        console.error('Erro completo:', err);
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);

        // Se for erro do Sequelize, mostrar detalhes específicos
        if (err.name === 'SequelizeValidationError') {
            console.error('Erros de validação:', err.errors);
        }
        if (err.name === 'SequelizeUniqueConstraintError') {
            console.error('Erro de constraint única:', err.errors);
        }
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            console.error('Erro de foreign key:', err.parent);
        }

        res.status(500).json({
            error: 'Erro interno do servidor',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Listar todos os contatos
router.get('/', async (req, res) => {
    try {
        const contatos = await Contato.findAll({
            order: [['nome', 'ASC']]
        });
        res.json(contatos);
    } catch (error) {
        console.error('Erro ao listar contatos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
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

// Atualizar contato
router.put('/:id', async (req, res) => {
    try {
        const { nome, telefone, nomeCompleto, email, statusTreinamento, cpf } = req.body;

        const contato = await Contato.findByPk(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        if (telefone) {
            const telefoneLimpo = limparNumero(telefone);

            if (!validarTelefone(telefoneLimpo)) {
                return res.status(400).json({
                    error: 'Por favor, insira um telefone válido com DDI+DDD+número (12 ou 13 dígitos)'
                });
            }

            const variacoesTelefone = gerarVariacoes(telefoneLimpo);
            const contatosExistentes = await Contato.findAll({
                where: {
                    id: { [Op.ne]: req.params.id },
                    telefone: { [Op.in]: variacoesTelefone }
                }
            });

            if (contatosExistentes.length > 0) {
                return res.status(400).json({
                    error: 'Já existe outro contato com este telefone'
                });
            }
        }


        // Atualizar campos
        const camposParaAtualizar = {};
        if (nome) camposParaAtualizar.nome = nome.trim();
        if (telefone) camposParaAtualizar.telefone = limparNumero(telefone);
        if (nomeCompleto !== undefined) camposParaAtualizar.nomeCompleto = nomeCompleto;
        if (email !== undefined) camposParaAtualizar.email = email;
        if (cpf !== undefined) camposParaAtualizar.cpf = cpf;
        if (statusTreinamento) camposParaAtualizar.statusTreinamento = statusTreinamento;

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

// Buscar contatos por status de treinamento
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const statusValidos = ['não iniciado', 'em andamento', 'concluído'];

        if (!statusValidos.includes(status)) {
            return res.status(400).json({
                error: 'Status inválido. Use: não iniciado, em andamento ou concluído'
            });
        }

        const contatos = await Contato.findAll({
            where: { statusTreinamento: status },
            order: [['nome', 'ASC']]
        });

        res.json(contatos);

    } catch (error) {
        console.error('Erro ao buscar contatos por status:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar contatos por nome (pesquisa)
router.get('/search/:termo', async (req, res) => {
    try {
        const { termo } = req.params;
        const { Op } = require('sequelize');

        const contatos = await Contato.findAll({
            where: {
                [Op.or]: [
                    { nome: { [Op.like]: `%${termo}%` } },
                    { telefone: { [Op.like]: `%${termo}%` } },
                    { nomeCompleto: { [Op.like]: `%${termo}%` } },
                    { email: { [Op.like]: `%${termo}%` } },
                    { cpf: { [Op.like]: `%${termo}%` } }
                ]
            },
            order: [['nome', 'ASC']]
        });

        res.json(contatos);

    } catch (error) {
        console.error('Erro ao pesquisar contatos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;