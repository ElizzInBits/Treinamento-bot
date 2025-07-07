const fs = require('fs');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

// Função para gerar o certificado em PDF
async function gerarCertificado(nomeCompleto) {
  // Cria a pasta "Certificados" se não existir
  if (!fs.existsSync('./Certificados')) {
    fs.mkdirSync('./Certificados');
  }

  // Sanitiza o nome do arquivo
  const fileName = nomeCompleto.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
  const path = `./Certificados/certificado_${fileName}.pdf`;

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
  const stream = fs.createWriteStream(path);
  doc.pipe(stream);

  // Moldura
  doc.lineWidth(2).strokeColor('#000080');
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

  // Título
  doc.fillColor('#000080').fontSize(28).font('Helvetica-Bold')
    .text('CERTIFICADO DE CONCLUSÃO', { align: 'center', underline: true });

  doc.moveDown(1.5);

  // Subtítulo
  doc.fontSize(20).font('Helvetica')
    .text('Certificamos que', { align: 'center' });

  doc.moveDown(1);

  // Nome do participante
  doc.fontSize(30).font('Helvetica-Bold')
    .text(nomeCompleto, { align: 'center' });

  doc.moveDown(1);

  // Descrição
  doc.fontSize(18).font('Helvetica')
    .text('Concluiu com êxito o Treinamento de Segurança, Saúde, Meio Ambiente e Qualidade (SSMA)', {
      align: 'center',
      lineGap: 6,
    });

  doc.moveDown(2);

  // Data de emissão
  const data = new Date().toLocaleDateString('pt-BR');
  doc.fontSize(14).text(`Emitido em: ${data}`, {
    align: 'center',
  });

  doc.moveDown(4);

  // Espaço para assinatura
  doc.moveTo(150, 400).lineTo(350, 400).stroke();
  doc.fontSize(14).fillColor('black')
    .text('Responsável pelo Treinamento', 150, 410, { align: 'left' });

  // Logo (opcional)
  if (fs.existsSync('./logo.png')) {
    doc.image('./logo.png', doc.page.width - 150, 40, { width: 100 });
  }

  // Rodapé institucional
  doc.fontSize(10).fillColor('gray')
    .text('Este certificado é válido apenas com a assinatura do responsável.', 50, doc.page.height - 50, {
      align: 'center',
    });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return path;
}

// Função para enviar o e-mail com o certificado usando Gmail + Nodemailer
async function enviarEmail(destinatario, arquivoPath) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'elizabethmirandaa302@gmail.com',  // Seu e-mail
      pass: 'kncv imth bajt bhar',             // Senha de app (não a senha normal!)
    },
  });

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
