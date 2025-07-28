const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Contato } = require('../../BancoDeDados/models');
const Treinamento = require('../../BancoDeDados/models/treinamento');

async function gerarCertificadoBanco(contatoId) {
  try {
    const contato = await Contato.findByPk(contatoId);
    if (!contato) throw new Error('❌ Contato não encontrado.');

    const treinamento = await Treinamento.findByPk(32);
    if (!treinamento) throw new Error('❌ Treinamento ID 32 não encontrado no banco.');

    const templatePath = path.join(__dirname, 'Certificado_SSMA.pdf');
    if (!fs.existsSync(templatePath)) throw new Error('❌ Modelo de certificado não encontrado.');

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];
    const black = rgb(0, 0, 0);

    // Estilo padrão
    const style = { font, color: black };

    // Posicionar os textos baseando-se nas seções do certificado enviado
    page.drawText(contato.nomeCompleto || contato.nome, { x: 155, y: 490, size: 12, ...style }); // Conferido a
    page.drawText(formatarCPF(contato.cpf), { x: 210, y: 453, size: 11, ...style }); // Documento de identificação
    page.drawText(treinamento.nome, { x: 160, y: 420, size: 11, ...style }); // Nome do curso
    page.drawText(treinamento.modalidade, { x: 165, y: 385, size: 11, ...style }); // Modalidade
    page.drawText(treinamento.tipoTreinamento || '', { x: 165, y: 360, size: 11, ...style }); // Tipo
    page.drawText(`${treinamento.cargaHoraria} horas`, { x: 180, y: 330, size: 11, ...style }); // Carga Horária
    page.drawText(treinamento.periodo || '', { x: 165, y: 305, size: 11, ...style }); // Período
    page.drawText(treinamento.emConformidade || '', { x: 50, y: 275, size: 9, maxWidth: 500, lineHeight: 11, ...style }); // Conformidade
    page.drawText(treinamento.conteudo || '', { x: 50, y: 225, size: 9, maxWidth: 500, lineHeight: 11, ...style }); // Conteúdo programático

    // Informações dos instrutores
    const instrutores = `${treinamento.instrutor || ''} - ${treinamento.qualificacaoInstrutor || ''}`;
    const adicionais = treinamento.instrutoresAdicionais ? `. Instrutores adicionais: ${treinamento.instrutoresAdicionais}` : '';
    page.drawText(`${instrutores}${adicionais}`, {
      x: 50, y: 185, size: 9, maxWidth: 500, lineHeight: 11, ...style
    });

    // Responsável técnico
    page.drawText(`${treinamento.responsavel || ''} - ${treinamento.cargoResponsavel || ''}`, {
      x: 50, y: 145, size: 9, maxWidth: 500, lineHeight: 11, ...style
    });

    // Aproveitamento
    page.drawText(treinamento.aproveitamento || '', {
      x: 50, y: 110, size: 9, maxWidth: 500, lineHeight: 11, ...style
    });

    // Salvar PDF
    const certificadosDir = path.join(__dirname, 'Certificados');
    if (!fs.existsSync(certificadosDir)) fs.mkdirSync(certificadosDir, { recursive: true });

    const nomeArquivo = (contato.nomeCompleto || contato.nome || 'certificado')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_');
    const caminhoArquivo = path.join(certificadosDir, `certificado_${nomeArquivo}.pdf`);
    fs.writeFileSync(caminhoArquivo, await pdfDoc.save());

    console.log('✅ Certificado gerado com sucesso:', caminhoArquivo);

    if (contato.email) await enviarEmail(contato.email, caminhoArquivo);
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
    if (!fs.existsSync(arquivoPath)) throw new Error('❌ Arquivo do certificado não encontrado.');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'elizabethmirandaa302@gmail.com',
        pass: 'kncv imth bajt bhar', // senha de app
      },
    });

    await transporter.sendMail({
      from: 'elizabethmirandaa302@gmail.com',
      to: destinatario,
      subject: '🎓 Certificado de Conclusão - Treinamento SSMA',
      html: `
        <h2>🎉 Parabéns pela conclusão do treinamento!</h2>
        <p>Você concluiu com sucesso o <strong>${treinamento.nome}</strong>.</p>
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
    });

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
