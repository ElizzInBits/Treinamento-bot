const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const nodemailer = require('nodemailer');

// Função para preencher e gerar o certificado com base no modelo PDF
async function gerarCertificadoPDF(dados, nomeCompleto, emailDestinatario) {
  const templatePath = './Modelo Certificado-Base.pdf';
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.getPages()[0];
  const cor = rgb(0, 0, 0);
  const tamanho = 11;

  // Ajuste das coordenadas baseado na estrutura visual do seu PDF
  page.drawText(nomeCompleto, { x: 180, y: 455, size: 14, font: helvetica, color: cor });
  page.drawText(dados.documento || '---', { x: 180, y: 432, size: tamanho, font: helvetica, color: cor });
  page.drawText(dados.nome || '---', { x: 180, y: 410, size: tamanho, font: helvetica, color: cor });
  page.drawText('SALUBRITÁ TREINAMENTOS LTDA.', { x: 180, y: 388, size: tamanho, font: helvetica, color: cor });
  page.drawText(dados.modalidade || '---', { x: 180, y: 365, size: tamanho, font: helvetica, color: cor });
  page.drawText(dados.tipo || '---', { x: 180, y: 342, size: tamanho, font: helvetica, color: cor });
  page.drawText(`${dados.cargaHoraria} horas`, { x: 180, y: 320, size: tamanho, font: helvetica, color: cor });
  page.drawText(dados.periodo || '---', { x: 180, y: 297, size: tamanho, font: helvetica, color: cor });

  // Texto longo
  const textoFormatado = dados.emConformidade || '';
  page.drawText(textoFormatado, {
    x: 50,
    y: 265,
    size: 9,
    font: helvetica,
    color: cor,
    maxWidth: 500,
    lineHeight: 11,
  });

  // Gera novo PDF
  const pdfBytes = await pdfDoc.save();

  if (!fs.existsSync('./Certificados')) {
    fs.mkdirSync('./Certificados');
  }

  const nomeArquivo = nomeCompleto.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
  const caminhoArquivo = `./Certificados/certificado_${nomeArquivo}.pdf`;
  fs.writeFileSync(caminhoArquivo, pdfBytes);

  console.log('✅ Certificado gerado em:', caminhoArquivo);

  // Envia por e-mail
  await enviarEmail(emailDestinatario, caminhoArquivo);
}

// Gera certificado com base no modelo existente
async function gerarCertificado(nomeCompleto, dadosTreinamento = {}) {
  const templatePath = './Modelo Certificado-Base.pdf';
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0];

  const cor = rgb(0, 0, 0);
  const tamanho = 11;

  const {
    nome = 'Treinamento Desconhecido',
    modalidade = '---',
    cargaHoraria = '---',
    tipo = '---',
    emConformidade = '---',
    documento = '---',
    periodo = '---',
  } = dadosTreinamento;

  // Posicionamento dos campos no PDF
  page.drawText(nomeCompleto, { x: 180, y: 455, size: 14, font, color: cor });
  page.drawText(documento, { x: 180, y: 432, size: tamanho, font, color: cor });
  page.drawText(nome, { x: 180, y: 410, size: tamanho, font, color: cor });
  page.drawText('SALUBRITÁ TREINAMENTOS LTDA.', { x: 180, y: 388, size: tamanho, font, color: cor });
  page.drawText(modalidade, { x: 180, y: 365, size: tamanho, font, color: cor });
  page.drawText(tipo, { x: 180, y: 342, size: tamanho, font, color: cor });
  page.drawText(`${cargaHoraria} horas`, { x: 180, y: 320, size: tamanho, font, color: cor });
  page.drawText(periodo, { x: 180, y: 297, size: tamanho, font, color: cor });
  page.drawText(emConformidade, {
    x: 50,
    y: 265,
    size: 9,
    font,
    color: cor,
    maxWidth: 500,
    lineHeight: 11,
  });

  const pdfBytes = await pdfDoc.save();

  if (!fs.existsSync('./Certificados')) {
    fs.mkdirSync('./Certificados');
  }

  const nomeArquivo = nomeCompleto.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
  const caminho = `./Certificados/certificado_${nomeArquivo}.pdf`;
  fs.writeFileSync(caminho, pdfBytes);

  return caminho;
}

// Função para enviar o PDF por e-mail
async function enviarEmail(destinatario, arquivoPath) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'elizabethmirandaa302@gmail.com',
      pass: 'kncv imth bajt bhar',
    },
  });

  const mailOptions = {
    from: 'elizabethmirandaa302@gmail.com',
    to: destinatario,
    subject: 'Certificado de Conclusão de Treinamento',
    text: 'Parabéns por concluir o treinamento! Segue seu certificado em anexo.',
    attachments: [
      {
        filename: path.basename(arquivoPath),
        path: arquivoPath,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 E-mail enviado com sucesso para:', destinatario);
  } catch (error) {
    console.error('❌ Erro ao enviar o e-mail:', error);
  }
}

module.exports = {
  gerarCertificado,
  gerarCertificadoPDF,
  enviarEmail,
};