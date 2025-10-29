const express = require('express');
const ExportadorWhatsApp = require('../../utils/exportar-whatsapp');
const router = express.Router();

// Exportar conversa
router.post('/exportar', async (req, res) => {
    try {
        const { telefone, limite } = req.body;
        
        if (!telefone) {
            return res.status(400).json({ erro: 'Telefone é obrigatório' });
        }

        const exportador = new ExportadorWhatsApp();
        const resultado = await exportador.exportarConversa(telefone, limite);
        
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Baixar arquivo exportado
router.get('/download/:arquivo', (req, res) => {
    try {
        const { arquivo } = req.params;
        const exportador = new ExportadorWhatsApp();
        const caminhoArquivo = require('path').join(exportador.exportDir, arquivo);
        const fs = require('fs');
        
        if (!fs.existsSync(caminhoArquivo)) {
            return res.status(404).json({ erro: 'Arquivo não encontrado' });
        }
        
        // Configurar cabeçalhos para forçar download
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${arquivo}"`);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Enviar arquivo
        const fileStream = fs.createReadStream(caminhoArquivo);
        fileStream.pipe(res);
        
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Listar arquivos exportados
router.get('/listar', async (req, res) => {
    try {
        const exportador = new ExportadorWhatsApp();
        const resultado = await exportador.listarExports();
        
        res.json(resultado.sucesso ? resultado.arquivos : []);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;