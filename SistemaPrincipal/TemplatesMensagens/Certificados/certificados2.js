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
    const tamanho = 11;

    // Preencher dados no certificado com posições adequadas

    // Conferido a: (nome do contato)
    page.drawText(contato.nomeCompleto || contato.nome, { x: 180, y: 595, size: 12, font: helvetica, color: cor });

    // Documento de Identificação: (CPF)
    page.drawText(formatarCPF(contato.cpf), { x: 180, y: 565, size: tamanho, font: helvetica, color: cor });

    // Nome do curso
    page.drawText(treinamento.nome, { x: 180, y: 535, size: tamanho, font: helvetica, color: cor });

    // Modalidade de Treinamento
    page.drawText(treinamento.modalidade, { x: 180, y: 505, size: tamanho, font: helvetica, color: cor });

    // Carga Horária Realizada
    page.drawText(`${treinamento.cargaHoraria} horas`, { x: 180, y: 445, size: tamanho, font: helvetica, color: cor });

    // Em conformidade
    page.drawText(treinamento.emConformidade || '', {
      x: 80, y: 415, size: 9, font: helvetica, color: cor, maxWidth: 450, lineHeight: 12
    });

    // Conteúdo programático aplicado
    page.drawText(treinamento.conteudo || '', {
      x: 80, y: 330, size: 9, font: helvetica, color: cor, maxWidth: 450, lineHeight: 12
    });

    // Informações dos instrutores
    const instrutorInfo = `${treinamento.instrutor || ''} - ${treinamento.qualificacaoInstrutor || ''}`;
    page.drawText(instrutorInfo, {
      x: 80, y: 295, size: 9, font: helvetica, color: cor, maxWidth: 450, lineHeight: 12
    });

    // Instrutores adicionais (se houver)
    if (treinamento.instrutoresAdicionais) {
      page.drawText(`Instrutores adicionais: ${treinamento.instrutoresAdicionais}`, {
        x: 80, y: 280, size: 9, font: helvetica, color: cor, maxWidth: 450, lineHeight: 12
      });
    }

    // Informações sobre responsabilidade
    const responsavelInfo = `${treinamento.responsavel || ''} - ${treinamento.cargoResponsavel || ''}`;
    page.drawText(responsavelInfo, {
      x: 80, y: 250, size: 9, font: helvetica, color: cor, maxWidth: 450, lineHeight: 12
    });

    // Aproveitamento de conteúdo
    page.drawText(treinamento.aproveitamento || '', {
      x: 80, y: 220, size: 9, font: helvetica, color: cor, maxWidth: 450, lineHeight: 12
    });

    // Data de conclusão
    page.drawText(`Data de conclusão: ${new Date().toLocaleDateString('pt-BR')}`, {
      x: 80, y: 190, size: 9, font: helvetica, color: cor
    });


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
        user: 'elizabethmirandaa302@gmail.com',
        pass: 'kncv imth bajt bhar',
      },
    });

    const mailOptions = {
      from: 'elizabethmirandaa302@gmail.com',
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