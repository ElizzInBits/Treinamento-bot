// certificados.js
const nodemailer = require('nodemailer');
const fs = require('fs');
const pdf = require('pdfkit');

// Função para gerar o certificado em PDF
async function gerarCertificado(nomeCompleto) {
  const path = './certificados/certificado_' + nomeCompleto.replace(/\s+/g, '_') + '.pdf';

  const doc = new pdf();
  doc.pipe(fs.createWriteStream(path));

  doc.fontSize(25).text('Certificado de Conclusão de Treinamento', { align: 'center' });
  doc.fontSize(20).text('Certificamos que', { align: 'center' });
  doc.fontSize(30).text(nomeCompleto, { align: 'center' });
  doc.fontSize(20).text('Concluiu com sucesso o Treinamento de SSMA', { align: 'center' });

  doc.end();

  return path;
}

// Função para enviar o e-mail com o certificado
async function enviarEmail(destinatario, arquivoPath) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'seuemail@gmail.com',  // Seu e-mail
      pass: 'suasenha',  // Sua senha do e-mail
    },
  });

  const mailOptions = {
    from: 'seuemail@gmail.com',
    to: destinatario,
    subject: 'Certificado de Treinamento',
    text: 'Parabéns, você concluiu o treinamento! Aqui está o seu certificado.',
    attachments: [
      {
        filename: 'certificado.pdf',
        path: arquivoPath,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
  }
}

// Exportando as funções para uso externo
module.exports = {
  gerarCertificado,
  enviarEmail,
};
