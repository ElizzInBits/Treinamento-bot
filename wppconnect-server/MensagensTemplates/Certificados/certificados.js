const fs = require('fs');
const pdf = require('pdfkit');
const nodemailer = require('nodemailer');

// Função para gerar o certificado em PDF
async function gerarCertificado(nomeCompleto) {
  const path = './Certificados/certificado_' + nomeCompleto.replace(/\s+/g, '_') + '.pdf';

  const doc = new pdf();
  const stream = fs.createWriteStream(path);
  doc.pipe(stream);

  doc.fontSize(25).text('Certificado de Conclusão de Treinamento', { align: 'center' });
  doc.fontSize(20).text('Certificamos que', { align: 'center' });
  doc.fontSize(30).text(nomeCompleto, { align: 'center' });
  doc.fontSize(20).text('Concluiu com sucesso o Treinamento de SSMA', { align: 'center' });

  doc.end();

  // Aguarda o final da escrita no disco para garantir arquivo válido
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return path;
}

// Função para enviar o e-mail com o certificado usando Gmail + Nodemailer
async function enviarEmail(destinatario, arquivoPath) {
  // Configurar o transporter do Nodemailer com Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'elizabethmirandaa302@gmail.com',  // Seu e-mail Gmail
      pass: 'vbfe fbax zpsg swsx',             // Sua senha de app do Gmail
    },
  });

  // Ler o arquivo PDF como buffer
  const pdfBuffer = fs.readFileSync(arquivoPath);

  const mailOptions = {
    from: 'elizabethmirandaa302@gmail.com',
    to: destinatario,
    subject: 'Certificado de Treinamento',
    text: 'Parabéns, você concluiu o treinamento! Aqui está o seu certificado.',
    attachments: [
      {
        filename: 'certificado.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
  }
}

module.exports = {
  gerarCertificado,
  enviarEmail,
};
