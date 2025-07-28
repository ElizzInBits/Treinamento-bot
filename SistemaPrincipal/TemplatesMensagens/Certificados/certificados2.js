const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Contato, Treinamento } = require('../../BancoDeDados/models'); // ajuste conforme sua estrutura de arquivos

async function gerarCertificadoBanco(contatoId) {
  try {
    // Buscar o contato e o treinamento
    const contato = await Contato.findByPk(contatoId, {
      include: {
        model: Treinamento,
        as: 'treinamento',
      },
    });

    if (!contato || !contato.treinamento) {
      throw new Error('❌ Contato ou Treinamento não encontrado.');
    }

    const treinamento = contato.treinamento;

    // Carregar modelo do certificado
    const templatePath = path.join(__dirname, 'Modelo Certificado-Base.pdf');
    if (!fs.existsSync(templatePath)) {
      throw new Error('❌ Modelo de certificado não encontrado.');
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];
    const cor = rgb(0, 0, 0);
    const tamanho = 11;

    // Preencher dados no certificado
    page.drawText(contato.nomeCompleto || contato.nome, { x: 180, y: 455, size: 14, font: helvetica, color: cor });
    page.drawText(`CPF: ${formatarCPF(contato.cpf)}`, { x: 180, y: 432, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.nome, { x: 180, y: 410, size: tamanho, font: helvetica, color: cor });
    page.drawText('SALUBRITÁ TREINAMENTOS LTDA.', { x: 180, y: 388, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.modalidade, { x: 180, y: 365, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.tipo, { x: 180, y: 342, size: tamanho, font: helvetica, color: cor });
    page.drawText(`${treinamento.cargaHoraria} horas`, { x: 180, y: 320, size: tamanho, font: helvetica, color: cor });
    page.drawText(new Date().toLocaleDateString('pt-BR'), { x: 180, y: 297, size: tamanho, font: helvetica, color: cor });

    page.drawText(treinamento.emConformidade, {
      x: 50,
      y: 265,
      size: 9,
      font: helvetica,
      color: cor,
      maxWidth: 500,
      lineHeight: 11,
    });

    // Salvar PDF
    const certificadosDir = path.join(__dirname, 'Certificados');
    if (!fs.existsSync(certificadosDir)) {
      fs.mkdirSync(certificadosDir, { recursive: true });
    }

    const nomeArquivo = contato.nomeCompleto.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    const caminhoArquivo = path.join(certificadosDir, `certificado_${nomeArquivo}.pdf`);
    fs.writeFileSync(caminhoArquivo, await pdfDoc.save());

    console.log('✅ Certificado gerado com sucesso:', caminhoArquivo);

    // Enviar por e-mail
    if (contato.email) {
      await enviarEmail(contato.email, caminhoArquivo);
    }

    return caminhoArquivo;
  } catch (error) {
    console.error('❌ Erro ao gerar certificado:', error.message);
    throw error;
  }
}

function formatarCPF(cpf) {
  if (!cpf || cpf.length !== 11) return '***.***.***-**';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

async function enviarEmail(destinatario, arquivoPath) {
  try {
    if (!fs.existsSync(arquivoPath)) {
      throw new Error('❌ Arquivo de certificado não encontrado.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'elizabethmirandaa302@gmail.com', // <<== coloque seu e-mail
        pass: 'kncv imth bajt bhar', // <<== coloque sua senha de app aqui
      },
    });

    const mailOptions = {
      from: 'elizabethmirandaa302@gmail.com',
      to: destinatario,
      subject: '🎓 Certificado de Conclusão - Treinamento SSMA',
      html: `
        <h2>🎉 Parabéns pela conclusão do treinamento!</h2>
        <p>Você concluiu com sucesso o <strong>Treinamento Básico de SSMA</strong>.</p>
        <p>Seu certificado está em anexo neste e-mail.</p>
        <br>
        <p>Atenciosamente,<br>
        <strong>Equipe LCM - Salubritá Treinamentos</strong></p>
      `,
      attachments: [
        {
          filename: path.basename(arquivoPath),
          path: arquivoPath,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 E-mail enviado com sucesso para:', destinatario);
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error.message);
    throw error;
  }
}

module.exports = {
  gerarCertificado: gerarCertificadoBanco,
  gerarCertificadoBanco,
  enviarEmail,
};
