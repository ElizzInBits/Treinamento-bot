require('dotenv').config({ path: '../../../.env' });
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Contato } = require('../../BancoDeDados/models');
const Treinamento = require('../../BancoDeDados/models/treinamento');

async function gerarCertificadoBanco(contatoId) {
  try {
    // Buscar apenas o contato
    const contato = await Contato.findByPk(contatoId);

    if (!contato) {
      throw new Error('❌ Contato não encontrado.');
    }

    // Buscar treinamento pelo ID 32 (CIPA)
    const treinamento = await Treinamento.findByPk(32);

    if (!treinamento) {
      throw new Error('❌ Treinamento ID 32 não encontrado no banco de dados.');
    }

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
    const tamanho = 13;

    // Nome da pessoa (posição superior direita)
    page.drawText('Conferido a:', { x: 350, y: 435, size: tamanho, font: helvetica, color: cor });
    page.drawText(contato.nomeCompleto || contato.nome, { x: 350, y: 420, size: tamanho, font: helvetica, color: cor });

    // COLUNA ESQUERDA
    // CPF/Documento
    page.drawText('Documento de', { x: 50, y: 390, size: tamanho, font: helvetica, color: cor });
    page.drawText('Identificação:', { x: 50, y: 375, size: tamanho, font: helvetica, color: cor });
    page.drawText(formatarCPF(contato.cpf), { x: 50, y: 360, size: tamanho, font: helvetica, color: cor });

    // Nome do Curso
    page.drawText('Nome do Curso:', { x: 50, y: 330, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.nome, { x: 50, y: 315, size: tamanho, font: helvetica, color: cor });

    // Empresa
    page.drawText('Empresa:', { x: 50, y: 285, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.empresa || '', { x: 50, y: 270, size: tamanho, font: helvetica, color: cor });

    // Modalidade de treinamento
    page.drawText('Modalidade de', { x: 50, y: 240, size: tamanho, font: helvetica, color: cor });
    page.drawText('treinamento:', { x: 50, y: 225, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.modalidade || '', { x: 50, y: 210, size: tamanho, font: helvetica, color: cor });

    // COLUNA DIREITA
    // Tipo de Treinamento
    page.drawText('Tipo de', { x: 300, y: 390, size: tamanho, font: helvetica, color: cor });
    page.drawText('Treinamento:', { x: 300, y: 375, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.tipo || 'TEÓRICO E PRÁTICO', { x: 300, y: 360, size: tamanho, font: helvetica, color: cor });

    // Carga Horária
    page.drawText('Carga Horária', { x: 300, y: 330, size: tamanho, font: helvetica, color: cor });
    page.drawText('Realizada:', { x: 300, y: 315, size: tamanho, font: helvetica, color: cor });
    page.drawText(`${treinamento.cargaHoraria} HORAS`, { x: 300, y: 300, size: tamanho, font: helvetica, color: cor });

    // Período de Treinamento
    page.drawText('Período de', { x: 300, y: 270, size: tamanho, font: helvetica, color: cor });
    page.drawText('Treinamento:', { x: 300, y: 255, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.periodo || '', { x: 300, y: 240, size: tamanho, font: helvetica, color: cor });

    // Em conformidade (spanning full width)
    page.drawText('Em conformidade:', { x: 50, y: 190, size: tamanho, font: helvetica, color: cor });
    page.drawText(
      treinamento.emConformidade || '',
      { x: 50, y: 175, size: 9, font: helvetica, color: cor, maxWidth: 460, lineHeight: 12 }
    );

    // Data de conclusão (bottom right, similar to right certificate)
    page.drawText(`Data de conclusão: ${new Date().toLocaleDateString('pt-BR')}`, {
      x: 380, y: 85, size: 9, font: helvetica, color: cor
    });
    // Conteúdo programático
    /* page.drawText('CONTEÚDO PROGRAMÁTICO APLICADO:', { x: 70, y: 300, size: tamanho, font: helvetica, color: cor });
     page.drawText(
       treinamento.conteudo || 'Conteúdo não informado',
       { x: 70, y: 280, size: 9, font: helvetica, color: cor, maxWidth: 460, lineHeight: 11 }
     ); */

    // Instrutores
    /*  page.drawText('INFORMAÇÕES DOS INSTRUTORES:', { x: 70, y: 150, size: tamanho, font: helvetica, color: cor });
      const instrutorInfo = `${treinamento.instrutor || ''} – ${treinamento.qualificacaoInstrutor || ''}`;
      page.drawText(instrutorInfo, { x: 70, y: 135, size: 9, font: helvetica, color: cor });
  
      if (treinamento.instrutoresAdicionais) {
        page.drawText(`Instrutores adicionais: ${treinamento.instrutoresAdicionais}`, {
          x: 70, y: 120, size: 9, font: helvetica, color: cor, maxWidth: 460
        });
      }
  
      // Responsável
      page.drawText('INFORMAÇÕES SOBRE RESPONSABILIDADE:', { x: 70, y: 100, size: tamanho, font: helvetica, color: cor });
      const responsavelInfo = `${treinamento.responsavel || ''} – ${treinamento.cargoResponsavel || ''}`;
      page.drawText(responsavelInfo, { x: 70, y: 85, size: 9, font: helvetica, color: cor });
  
      // Aproveitamento
      page.drawText('APROVEITAMENTO DE CONTEÚDO:', { x: 70, y: 70, size: tamanho, font: helvetica, color: cor });
      page.drawText(treinamento.aproveitamento || 'Não há aproveitamento de conteúdo a ser considerado para esta capacitação.', {
        x: 70, y: 55, size: 9, font: helvetica, color: cor
      }); */





    // Salvar PDF
    const certificadosDir = path.join(__dirname, 'Certificados');
    if (!fs.existsSync(certificadosDir)) {
      fs.mkdirSync(certificadosDir, { recursive: true });
    }

    const nomeArquivo = (contato.nomeCompleto || contato.nome || 'certificado').replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
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
        user: process.env.EMAIL_USER || 'seu-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'sua-senha-app',
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'seu-email@gmail.com',
      to: destinatario,
      subject: '🎓 Certificado de Conclusão - Treinamento CIPA',
      html: `
        <h2>🎉 Parabéns pela conclusão do treinamento!</h2>
        <p>Você concluiu com sucesso o <strong>Curso de Formação de Membros de CIPA</strong>.</p>
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