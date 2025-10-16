const express = require('express');
const router = express.Router();
const AssinaturaCertificadoService = require('../../TemplatesMensagens/Certificados/assinaturaCertificado');
const path = require('path');
const fs = require('fs');

// Rota para obter dados da assinatura
router.get('/dados/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const dados = await AssinaturaCertificadoService.obterDadosAssinatura(token);
    
    if (dados.erro) {
      return res.status(400).json({ erro: dados.erro });
    }
    
    res.json(dados);
  } catch (error) {
    console.error('❌ Erro ao obter dados da assinatura:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Rota para salvar assinatura
router.post('/salvar/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { assinatura } = req.body;
    
    if (!assinatura) {
      return res.status(400).json({ erro: 'Assinatura é obrigatória' });
    }
    
    const resultado = await AssinaturaCertificadoService.salvarAssinatura(token, assinatura);
    
    res.json({
      sucesso: true,
      mensagem: 'Certificado assinado com sucesso!',
      certificado: path.basename(resultado.certificadoAssinado)
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar assinatura:', error);
    res.status(400).json({ erro: error.message });
  }
});

// Rota para download do certificado assinado
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const certificadosDir = path.join(__dirname, '../../TemplatesMensagens/Certificados/Certificados');
    const filePath = path.join(certificadosDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('❌ Erro ao fazer download:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;