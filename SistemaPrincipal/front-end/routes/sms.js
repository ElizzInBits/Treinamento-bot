const express = require('express');
const router = express.Router();
const { VerificacaoSms, Usuario } = require('../BancoDeDados/models');
const { gerarCodigo, enviarWhatsApp } = require('../services/whatsappVerificacao');
const { Op } = require('sequelize');

/**
 * POST /api/sms/enviar
 * Envia código de verificação por WhatsApp
 */
router.post('/enviar', async (req, res) => {
  try {
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({ erro: 'Telefone é obrigatório' });
    }

    // Remove caracteres não numéricos
    const telefoneLimpo = telefone.replace(/\D/g, '');

    // Valida se tem pelo menos 10 dígitos (DDD + número)
    if (telefoneLimpo.length < 10) {
      return res.status(400).json({ erro: 'Telefone inválido' });
    }

    // Verifica se já existe verificação recente (últimos 2 minutos)
    const verificacaoRecente = await VerificacaoSms.findOne({
      where: {
        telefone: telefoneLimpo,
        criado_em: {
          [Op.gte]: new Date(Date.now() - 2 * 60 * 1000) // 2 minutos atrás
        }
      },
      order: [['criado_em', 'DESC']]
    });

    if (verificacaoRecente) {
      return res.status(429).json({ 
        erro: 'Aguarde 2 minutos antes de solicitar novo código',
        aguardar: true
      });
    }

    // Gera código de 6 dígitos
    const codigo = gerarCodigo();

    // Define expiração para 10 minutos
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);

    // Envia WhatsApp
    const resultadoWhatsApp = await enviarWhatsApp(telefoneLimpo, codigo);

    if (!resultadoWhatsApp.sucesso) {
      return res.status(500).json({ 
        erro: 'Erro ao enviar WhatsApp. Tente novamente.',
        detalhes: resultadoWhatsApp.erro
      });
    }

    // Salva no banco
    await VerificacaoSms.create({
      telefone: telefoneLimpo,
      codigo: codigo,
      expira_em: expiraEm,
      verificado: false,
      tentativas: 0
    });

    res.json({ 
      sucesso: true,
      mensagem: 'Código enviado com sucesso via WhatsApp',
      expiraEm: expiraEm
    });

  } catch (error) {
    console.error('Erro ao enviar código WhatsApp:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/sms/validar
 * Valida código informado pelo usuário
 */
router.post('/validar', async (req, res) => {
  try {
    const { telefone, codigo } = req.body;

    if (!telefone || !codigo) {
      return res.status(400).json({ erro: 'Telefone e código são obrigatórios' });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    const codigoLimpo = codigo.replace(/\D/g, '');

    // Busca verificação mais recente não expirada
    const verificacao = await VerificacaoSms.findOne({
      where: {
        telefone: telefoneLimpo,
        verificado: false,
        expira_em: {
          [Op.gt]: new Date() // Não expirado
        }
      },
      order: [['criado_em', 'DESC']]
    });

    if (!verificacao) {
      return res.status(404).json({ 
        erro: 'Código não encontrado ou expirado',
        expirado: true
      });
    }

    // Verifica limite de tentativas
    if (verificacao.tentativas >= 3) {
      return res.status(403).json({ 
        erro: 'Limite de tentativas excedido. Solicite novo código.',
        limiteExcedido: true
      });
    }

    // Incrementa tentativas
    verificacao.tentativas += 1;
    await verificacao.save();

    // Valida código
    if (verificacao.codigo !== codigoLimpo) {
      return res.status(400).json({ 
        erro: 'Código incorreto',
        tentativasRestantes: 3 - verificacao.tentativas
      });
    }

    // Código correto! Marca como verificado
    verificacao.verificado = true;
    await verificacao.save();

    // Atualiza usuário se já existir
    await Usuario.update(
      { telefone_verificado: true },
      { where: { telefone: telefoneLimpo } }
    );

    res.json({ 
      sucesso: true,
      mensagem: 'Telefone verificado com sucesso',
      telefoneVerificado: true
    });

  } catch (error) {
    console.error('Erro ao validar código WhatsApp:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/sms/status/:telefone
 * Verifica se telefone já foi verificado
 */
router.get('/status/:telefone', async (req, res) => {
  try {
    const telefoneLimpo = req.params.telefone.replace(/\D/g, '');

    const verificacao = await VerificacaoSms.findOne({
      where: {
        telefone: telefoneLimpo,
        verificado: true
      },
      order: [['criado_em', 'DESC']]
    });

    res.json({ 
      verificado: !!verificacao,
      telefone: telefoneLimpo
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;
