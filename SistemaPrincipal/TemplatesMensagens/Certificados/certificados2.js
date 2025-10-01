require('dotenv').config({ path: '../../../.env' });
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Contato, Empresa, Treinamento } = require('../../BancoDeDados/models');

async function gerarCertificadoBanco(contatoId) {
  try {
    // Buscar contato e empresa
    const contato = await Contato.findByPk(contatoId);

    if (!contato) {
      throw new Error('❌ Contato não encontrado.');
    }

    // Buscar empresa do contato
    let empresa = null;
    if (contato.empresaId) {
      empresa = await Empresa.findByPk(contato.empresaId);
    }

    // Usar treinamento padrão ID 15
    const treinamento = await Treinamento.findByPk(15);

    if (!treinamento) {
      throw new Error(`❌ Treinamento não encontrado no banco de dados.`);
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
    const tamanho = 12;

    // Função para formatar data do período
    function formatarDataPeriodo(periodoStr) {
      if (!periodoStr) return "";
      
      const dataLimpa = periodoStr.includes(' ') ? periodoStr.split(' ')[0] : periodoStr;
      
      // Se a data já está no formato brasileiro (dd/mm/yyyy), mantém
      if (dataLimpa.includes('/') && dataLimpa.split('/').length === 3) {
        return dataLimpa;
      }
      
      // Tenta converter outros formatos
      try {
        const data = new Date(dataLimpa);
        if (!isNaN(data.getTime())) {
          return data.toLocaleDateString('pt-BR');
        }
      } catch (error) {
        // Se não conseguir converter, retorna original
      }
      
      return dataLimpa;
    }

    // Função para quebrar texto em linhas com medição precisa
    function quebrarTexto(texto, fonte, tamanhoFonte, larguraMax) {
      if (!texto) return [''];
      
      const palavras = texto.split(' ');
      const linhas = [];
      let linhaAtual = '';
      
      for (const palavra of palavras) {
        const testeLinhaAtual = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
        const larguraReal = fonte.widthOfTextAtSize(testeLinhaAtual, tamanhoFonte);
        
        if (larguraReal <= larguraMax) {
          linhaAtual = testeLinhaAtual;
        } else {
          if (linhaAtual) {
            linhas.push(linhaAtual);
            linhaAtual = palavra;
          } else {
            linhas.push(palavra);
          }
        }
      }
      
      if (linhaAtual) {
        linhas.push(linhaAtual);
      }
      
      return linhas;
    }

    // PRIMEIRA PÁGINA - Formatação idêntica ao código Python
    
    // "Conferido a:" 
    page.drawText('Conferido a:', { x: 270, y: 630, size: tamanho, font: helvetica, color: cor });

    // Nome (centralizado automaticamente) - EM MAIÚSCULAS
    const nomeCompleto = (contato.nomeCompleto || contato.nome).toUpperCase();
    const nomeSize = 16;
    const larguraPagina = 595.28; // A4 width in points
    const larguraNome = helvetica.widthOfTextAtSize(nomeCompleto, nomeSize);
    const nomeX = (larguraPagina / 2) - (larguraNome / 2);
    page.drawText(nomeCompleto, { x: nomeX, y: 600, size: nomeSize, font: helvetica, color: cor });

    // Documento de Identificação
    page.drawText('Documento de', { x: 60, y: 519, size: tamanho, font: helvetica, color: cor });
    page.drawText('Identificação:', { x: 60, y: 506, size: tamanho, font: helvetica, color: cor });
    page.drawText(formatarCPF(contato.cpf), { x: 166, y: 513, size: tamanho, font: helvetica, color: cor });

    // Nome do Curso
    page.drawText('Nome do Curso:', { x: 60, y: 467, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.nome, { x: 166, y: 467, size: tamanho, font: helvetica, color: cor });

    // Empresa
    page.drawText('Empresa:', { x: 60, y: 429, size: tamanho, font: helvetica, color: cor });
    const nomeEmpresa = empresa ? empresa.razaoSocial : 'SALUBRITÁ TREINAMENTOS LTDA';
    page.drawText(nomeEmpresa, { x: 166, y: 427, size: tamanho, font: helvetica, color: cor });

    // Modalidade
    page.drawText('Modalidade de', { x: 60, y: 382, size: tamanho, font: helvetica, color: cor });
    page.drawText('treinamento:', { x: 60, y: 367, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.modalidade || '', { x: 166, y: 374, size: tamanho, font: helvetica, color: cor });

    // TIPO
    page.drawText('Tipo de', { x: 310, y: 386, size: tamanho, font: helvetica, color: cor });
    page.drawText('Treinamento:', { x: 310, y: 371, size: tamanho, font: helvetica, color: cor });
    page.drawText(treinamento.tipo || 'TEÓRICO E PRÁTICO', { x: 400, y: 380, size: tamanho, font: helvetica, color: cor });

    // Carga Horária e Período
    page.drawText('Carga Horária', { x: 60, y: 336, size: tamanho, font: helvetica, color: cor });
    page.drawText('Realizada:', { x: 60, y: 321, size: tamanho, font: helvetica, color: cor });
    const cargaHoraria = treinamento.carga_horaria || treinamento.cargaHoraria || '4';
    page.drawText(`${cargaHoraria} HORAS`, { x: 166, y: 328, size: tamanho, font: helvetica, color: cor });

    // Período de Treinamento
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    page.drawText('Período de', { x: 310, y: 336, size: tamanho, font: helvetica, color: cor });
    page.drawText('Treinamento:', { x: 310, y: 321, size: tamanho, font: helvetica, color: cor });
    page.drawText(dataAtual, { x: 400, y: 328, size: tamanho, font: helvetica, color: cor });

    // Conformidade
    page.drawText('Em conformidade:', { x: 60, y: 285, size: 12, font: helvetica, color: cor });
    
    const linhasConformidade = quebrarTexto(treinamento.em_conformidade || '', helvetica, 10, 470);
    let yConformidade = 270;
    linhasConformidade.forEach(linha => {
      if (yConformidade > 150) { // Evita sair da página
        page.drawText(linha, { x: 60, y: yConformidade, size: 10, font: helvetica, color: cor });
        yConformidade -= 12;
      }
    });

    // Data de conclusão (posição mantida)
   /* page.drawText(`Data de conclusão: ${new Date().toLocaleDateString('pt-BR')}`, {
      x: 380, y: 85, size: 9, font: helvetica, color: cor
    }); */

    // SEGUNDA PÁGINA - Formatação baseada no código Python
    const paginas = pdfDoc.getPages();
    let segundaPagina;

    if (paginas.length >= 2) {
      segundaPagina = paginas[1];
    }

    if (segundaPagina) {
      // Conteúdo Programático
      const linhasConteudo = quebrarTexto(treinamento.conteudo_programatico || 'Conteúdo não informado', helvetica, tamanho, 520);
      let yConteudo = 660;
      
      linhasConteudo.forEach(linha => {
        if (yConteudo < 450) { // Ajusta para não sobrepor outras informações
          return;
        }
        segundaPagina.drawText(linha, { x: 40, y: yConteudo, size: tamanho, font: helvetica, color: cor });
        yConteudo -= 16;
      });

      // Instrutor
      const instrutorInfo = `${treinamento.instrutor_principal || ''} - ${treinamento.qualificacao_instrutor || ''} - ${treinamento.registro_instrutor || ''}`;
      segundaPagina.drawText(instrutorInfo, { x: 40, y: 430, size: tamanho, font: helvetica, color: cor });

      // Responsável
      const responsavelInfo = `${treinamento.responsavel_treinamento || ''} - ${treinamento.cargo_responsavel || ''} - ${treinamento.registro_responsavel || ''}`;
      segundaPagina.drawText(responsavelInfo, { x: 40, y: 320, size: tamanho, font: helvetica, color: cor });

      // Aproveitamento
      segundaPagina.drawText(treinamento.aproveitamento_conteudo || 'Não há aproveitamento de conteúdo a ser considerado para esta capacitação.', {
        x: 40, y: 220, size: tamanho, font: helvetica, color: cor, maxWidth: 500
      });
    }

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
      await enviarEmail(contato.email, caminhoArquivo, treinamento);
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

async function enviarEmail(destinatario, arquivoPath, treinamento = null) {
  try {
    if (!fs.existsSync(arquivoPath)) {
      throw new Error('❌ Arquivo de certificado não encontrado.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'inovacao.tecnologiasalub@gmail.com',
        pass: 'thtf ucso dkhv fcrw'
      },
    });

    const mailOptions = {
      from: 'inovacao.tecnologiasalub@gmail.com',
      to: destinatario,
      subject: `🎓 Certificado de Conclusão - ${treinamento?.nome || 'Treinamento'}`,
      html: `
        <h2>🎉 Parabéns pela conclusão do treinamento!</h2>
        <p>Você concluiu com sucesso o <strong>${treinamento?.nome || 'Treinamento'}</strong>.</p>
        <p>Seu certificado está em anexo neste e-mail.</p>
        <br>
        <p>Atenciosamente,<br>
        <strong>Salubritá Treinamentos</strong></p>
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
