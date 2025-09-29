const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Configuração do email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'inovacao.tecnologiasalub@gmail.com',
    pass: 'qefl onhz wrgo mobt'
  }
});

async function gerarCertificado(nome, email, sendMessage = null, sender = null) {
  try {
    // Carregar modelo do certificado
    const templatePath = path.join(__dirname, 'certificado-modelo-generico.pdf');
    if (!fs.existsSync(templatePath)) {
      throw new Error('❌ Modelo de certificado não encontrado.');
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    // Nome em CAPS LOCK centralizado
    const nomeCompleto = nome.toUpperCase();
    const nomeSize = 20;
    const { width: larguraPagina } = page.getSize();
    const larguraNome = helvetica.widthOfTextAtSize(nomeCompleto, nomeSize);
    const nomeX = (larguraPagina / 2) - (larguraNome / 2);
    
    page.drawText(nomeCompleto, { 
      x: nomeX, 
      y: 300, 
      size: nomeSize, 
      font: helvetica, 
      color: rgb(0, 0, 0) 
    });

    // Salvar PDF
    const certificadosDir = path.join(__dirname, 'Certificados');
    if (!fs.existsSync(certificadosDir)) {
      fs.mkdirSync(certificadosDir, { recursive: true });
    }

    const nomeArquivo = `certificado_${nome.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(certificadosDir, nomeArquivo);
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(caminhoArquivo, pdfBytes);

    // Enviar por email
    if (email) {
      await enviarCertificadoPorEmail(email, nome, caminhoArquivo);
    }

    // Enviar no chat se sendMessage foi fornecido
    if (sendMessage && sender) {
      await sendMessage(sender, 'send-file', {
        path: caminhoArquivo,
        filename: `certificado_${nome.replace(/\s+/g, '_')}.pdf`,
        caption: '🎓 Seu Certificado de Participação'
      });
    }

    return {
      sucesso: true,
      arquivo: caminhoArquivo,
      mensagem: `✅ Certificado gerado para ${nome}`
    };

  } catch (error) {
    return {
      sucesso: false,
      erro: error.message
    };
  }
}

async function enviarCertificadoPorEmail(email, nome, caminhoArquivo) {
  const mailOptions = {
    from: 'inovacao.tecnologiasalub@gmail.com',
    to: email,
    subject: 'Seu Certificado de Participação',
    html: `
      <h2>Certificado de Participação</h2>
      <p>Olá ${nome},</p>
      <p>Segue em anexo seu certificado de participação no treinamento.</p>
      <p>Atenciosamente,<br>Equipe Salubrita</p>
    `,
    attachments: [{
      filename: `certificado_${nome.replace(/\s+/g, '_')}.pdf`,
      path: caminhoArquivo
    }]
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { gerarCertificado };