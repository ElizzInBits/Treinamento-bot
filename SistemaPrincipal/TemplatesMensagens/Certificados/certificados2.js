require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Usuario, Empresa, Treinamento } = require('../../BancoDeDados/models');

async function gerarCertificadoBanco(contatoId, nometreinamento = null, treinamentoId = null, enviarEmailAutomatico = true) {
  try {
    // Buscar contato e empresa
    const contato = await Usuario.findByPk(contatoId);

    if (!contato) {
      throw new Error('❌ Contato não encontrado.');
    }

    // Buscar empresa do contato
    let empresa = null;
    if (contato.empresaId) {
      empresa = await Empresa.findByPk(contato.empresaId);
    }

    // Buscar treinamento por ID (prioridade), nome ou usar padrão
    let treinamento = null;
    
    // 1. Se foi passado ID específico, usar ele
    if (treinamentoId) {
      treinamento = await Treinamento.findByPk(treinamentoId);
    }
    
    // 2. Se não achou por ID, tentar por nome
    if (!treinamento && nometreinamento) {
      treinamento = await Treinamento.findOne({ where: { nome: nometreinamento } });
    }
    
    // 3. Fallback para ID 15 se nada for encontrado
    if (!treinamento) {
      treinamento = await Treinamento.findByPk(15);
    }

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

    // Função para normalizar texto removendo acentos e caracteres de controle
    function normalizarTexto(texto) {
      if (!texto) return '';
      return texto
        .replace(/[\r\n\t]/g, ' ')  // Remove CR, LF, TAB
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')  // Remove caracteres de controle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')  // Mantém apenas ASCII imprimível
        .trim();
    }

    // Função para quebrar texto em linhas com medição precisa
    function quebrarTexto(texto, fonte, tamanhoFonte, larguraMax) {
      if (!texto) return [''];
      
      // Normalizar texto para evitar problemas de codificação
      const textoNormalizado = normalizarTexto(texto);
      const palavras = textoNormalizado.split(' ');
      const linhas = [];
      let linhaAtual = '';
      
      for (const palavra of palavras) {
        const testeLinhaAtual = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
        
        try {
          // Normalizar texto antes de medir para evitar erro WinAnsi
          const textoParaMedir = normalizarTexto(testeLinhaAtual);
          const larguraReal = fonte.widthOfTextAtSize(textoParaMedir, tamanhoFonte);
          
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
        } catch (error) {
          console.warn('Erro ao medir texto, usando texto normalizado:', error);
          // Se houver erro, usar estimativa simples
          if (testeLinhaAtual.length * tamanhoFonte * 0.6 <= larguraMax) {
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
    const nomeOriginal = (contato.nomeCompleto || contato.nome).toUpperCase();
    const nomeCompleto = normalizarTexto(nomeOriginal);
    const nomeSize = 16;
    const larguraPagina = 595.28; // A4 width in points
    
    try {
      const larguraNome = helvetica.widthOfTextAtSize(nomeCompleto, nomeSize);
      const nomeX = (larguraPagina / 2) - (larguraNome / 2);
      page.drawText(nomeCompleto, { x: nomeX, y: 600, size: nomeSize, font: helvetica, color: cor });
    } catch (error) {
      console.warn('Erro ao medir nome, usando posição fixa:', error);
      // Usar posição centralizada fixa se houver erro
      page.drawText(nomeCompleto, { x: 150, y: 600, size: nomeSize, font: helvetica, color: cor });
    }

    // Documento de Identificação
    page.drawText('Documento de', { x: 60, y: 519, size: tamanho, font: helvetica, color: cor });
    page.drawText('Identificação:', { x: 60, y: 506, size: tamanho, font: helvetica, color: cor });
    page.drawText(formatarCPF(contato.cpf), { x: 166, y: 513, size: tamanho, font: helvetica, color: cor });

    // Nome do Curso
    page.drawText('Nome do Curso:', { x: 60, y: 467, size: tamanho, font: helvetica, color: cor });
    const nomeCurso = normalizarTexto(treinamento.nome || '');
    page.drawText(nomeCurso, { x: 166, y: 467, size: tamanho, font: helvetica, color: cor });

    // Empresa
    page.drawText('Empresa:', { x: 60, y: 429, size: tamanho, font: helvetica, color: cor });
    const nomeEmpresaOriginal = empresa ? empresa.razaoSocial : 'SALUBRITA TREINAMENTOS LTDA';
    const nomeEmpresa = normalizarTexto(nomeEmpresaOriginal);
    page.drawText(nomeEmpresa, { x: 166, y: 427, size: tamanho, font: helvetica, color: cor });

    // Modalidade
    page.drawText('Modalidade de', { x: 60, y: 382, size: tamanho, font: helvetica, color: cor });
    page.drawText('treinamento:', { x: 60, y: 367, size: tamanho, font: helvetica, color: cor });
    page.drawText(normalizarTexto(treinamento.modalidade || ''), { x: 166, y: 374, size: tamanho, font: helvetica, color: cor });

    // TIPO
    page.drawText('Tipo de', { x: 310, y: 386, size: tamanho, font: helvetica, color: cor });
    page.drawText('Treinamento:', { x: 310, y: 371, size: tamanho, font: helvetica, color: cor });
    const tipoTreinamento = normalizarTexto(treinamento.tipo || 'TEORICO E PRATICO');
    page.drawText(tipoTreinamento, { x: 400, y: 380, size: tamanho, font: helvetica, color: cor });

    // Carga Horária e Período
    page.drawText('Carga Horária', { x: 60, y: 336, size: tamanho, font: helvetica, color: cor });
    page.drawText('Realizada:', { x: 60, y: 321, size: tamanho, font: helvetica, color: cor });
    const cargaHoraria = treinamento.carga_horaria || treinamento.cargaHoraria || '4';
    page.drawText(`${cargaHoraria} HORAS`, { x: 166, y: 328, size: tamanho, font: helvetica, color: cor });

    // Período de Treinamento
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const periodoTreinamento = `${dataAtual} - ${dataAtual}`;
    page.drawText('Período de', { x: 310, y: 336, size: tamanho, font: helvetica, color: cor });
    page.drawText('Treinamento:', { x: 310, y: 321, size: tamanho, font: helvetica, color: cor });
    page.drawText(periodoTreinamento, { x: 400, y: 328, size: tamanho, font: helvetica, color: cor });

    // Conformidade
    page.drawText('Em conformidade:', { x: 60, y: 285, size: 12, font: helvetica, color: cor });
    
    const linhasConformidade = quebrarTexto(treinamento.em_conformidade || '', helvetica, 10, 470);
    let yConformidade = 270;
    linhasConformidade.forEach(linha => {
      if (yConformidade > 150) { // Evita sair da página
        page.drawText(normalizarTexto(linha), { x: 60, y: yConformidade, size: 10, font: helvetica, color: cor });
        yConformidade -= 12;
      }
    });

    // Data de conclusão (posição mantida)
   /* page.drawText(`Data de conclusão: ${new Date().toLocaleDateString('pt-BR')}`, {
      x: 380, y: 85, size: 9, font: helvetica, color: cor
    }); */

    // Marca d'água para treinamento de degustação (EPC_EPI - ID 16)
    if (treinamento.id === 16) {
      page.drawText('CONTEUDO DE DEGUSTACAO', {
        x: 150, y: 420, size: 24, font: helvetica, color: rgb(0.9, 0.9, 0.9), opacity: 0.3
      });
      page.drawText('CERTIFICADO DE EXEMPLO', {
        x: 150, y: 390, size: 24, font: helvetica, color: rgb(0.9, 0.9, 0.9), opacity: 0.3
      });
    }

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
        segundaPagina.drawText(normalizarTexto(linha), { x: 40, y: yConteudo, size: tamanho, font: helvetica, color: cor });
        yConteudo -= 16;
      });

      // Instrutor
      const instrutorInfo = normalizarTexto(`${treinamento.instrutor_principal || ''} - ${treinamento.qualificacao_instrutor || ''} - ${treinamento.registro_instrutor || ''}`);
      segundaPagina.drawText(instrutorInfo, { x: 40, y: 430, size: tamanho, font: helvetica, color: cor });

      // Responsável
      const responsavelInfo = normalizarTexto(`${treinamento.responsavel_treinamento || ''} - ${treinamento.cargo_responsavel || ''} - ${treinamento.registro_responsavel || ''}`);
      segundaPagina.drawText(responsavelInfo, { x: 40, y: 320, size: tamanho, font: helvetica, color: cor });

      // Aproveitamento
      const aproveitamentoTexto = normalizarTexto(treinamento.aproveitamento_conteudo || 'Nao ha aproveitamento de conteudo a ser considerado para esta capacitacao.');
      segundaPagina.drawText(aproveitamentoTexto, {
        x: 40, y: 220, size: tamanho, font: helvetica, color: cor, maxWidth: 500
      });
    }

    // Salvar PDF 
    const certificadosDir = path.join(__dirname, 'Certificados');
    if (!fs.existsSync(certificadosDir)) {
      fs.mkdirSync(certificadosDir, { recursive: true });
    }

    const nomeArquivo = (contato.nomeCompleto || contato.nome || 'certificado').replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    const caminhoArquivo = path.join(certificadosDir, `certificado_${nomeArquivo}_T${treinamento.id}.pdf`);
    fs.writeFileSync(caminhoArquivo, await pdfDoc.save());

    console.log('✅ Certificado gerado com sucesso:', caminhoArquivo);

    // Enviar por e-mail (apenas se não for para assinatura)
    if (contato.email && enviarEmailAutomatico) {
      await enviarEmail(contato.email, caminhoArquivo, treinamento);
    }

    return caminhoArquivo;
  } catch (error) {
    console.error('❌ Erro ao gerar certificado:', error.message);
    throw error;
  }
}

function formatarCPF(cpf) {
  if (!cpf) return '***.***.***-**';
  
  // Remover caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) return cpf; // Retorna original se não tiver 11 dígitos
  
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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

// Função para gerar certificado de visitante (sem cadastro no sistema)
async function gerarCertificadoVisitante(nome, email, cpf, treinamentoId = 15) {
  try {
    // Buscar treinamento
    const treinamento = await Treinamento.findByPk(treinamentoId);
    
    if (!treinamento) {
      throw new Error(`❌ Treinamento não encontrado.`);
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

    // Função para normalizar texto
    function normalizarTexto(texto) {
      if (!texto) return '';
      return texto
        .replace(/[\r\n\t]/g, ' ')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
    }

    // PRIMEIRA PÁGINA
    page.drawText('Conferido a:', { x: 270, y: 630, size: tamanho, font: helvetica, color: cor });

    // Nome (centralizado) - EM MAIÚSCULAS
    const nomeCompleto = normalizarTexto(nome.toUpperCase());
    const nomeSize = 16;
    const larguraPagina = 595.28;
    
    try {
      const larguraNome = helvetica.widthOfTextAtSize(nomeCompleto, nomeSize);
      const nomeX = (larguraPagina / 2) - (larguraNome / 2);
      page.drawText(nomeCompleto, { x: nomeX, y: 600, size: nomeSize, font: helvetica, color: cor });
    } catch (error) {
      page.drawText(nomeCompleto, { x: 150, y: 600, size: nomeSize, font: helvetica, color: cor });
    }

    // Documento de Identificação (com CPF formatado)
    page.drawText('Documento de', { x: 60, y: 519, size: tamanho, font: helvetica, color: cor });
    page.drawText('Identificação:', { x: 60, y: 506, size: tamanho, font: helvetica, color: cor });
    page.drawText(formatarCPF(cpf), { x: 166, y: 513, size: tamanho, font: helvetica, color: cor });

    // Nome do Curso
    page.drawText('Nome do Curso:', { x: 60, y: 467, size: tamanho, font: helvetica, color: cor });
    const nomeCurso = normalizarTexto(treinamento.nome || '');
    page.drawText(nomeCurso, { x: 166, y: 467, size: tamanho, font: helvetica, color: cor });

    // Empresa
    page.drawText('Empresa:', { x: 60, y: 429, size: tamanho, font: helvetica, color: cor });
    page.drawText('SALUBRITA TREINAMENTOS LTDA', { x: 166, y: 427, size: tamanho, font: helvetica, color: cor });

    // Modalidade
    page.drawText('Modalidade de', { x: 60, y: 382, size: tamanho, font: helvetica, color: cor });
    page.drawText('treinamento:', { x: 60, y: 367, size: tamanho, font: helvetica, color: cor });
    page.drawText(normalizarTexto(treinamento.modalidade || ''), { x: 166, y: 374, size: tamanho, font: helvetica, color: cor });

    // TIPO
    page.drawText('Tipo de', { x: 310, y: 386, size: tamanho, font: helvetica, color: cor });
    page.drawText('Treinamento:', { x: 310, y: 371, size: tamanho, font: helvetica, color: cor });
    const tipoTreinamento = normalizarTexto(treinamento.tipo || 'TEORICO E PRATICO');
    page.drawText(tipoTreinamento, { x: 400, y: 380, size: tamanho, font: helvetica, color: cor });

    // Carga Horária e Período
    page.drawText('Carga Horária', { x: 60, y: 336, size: tamanho, font: helvetica, color: cor });
    page.drawText('Realizada:', { x: 60, y: 321, size: tamanho, font: helvetica, color: cor });
    const cargaHoraria = treinamento.carga_horaria || treinamento.cargaHoraria || '4';
    page.drawText(`${cargaHoraria} HORAS`, { x: 166, y: 328, size: tamanho, font: helvetica, color: cor });

    // Período de Treinamento
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const periodoTreinamento = `${dataAtual} - ${dataAtual}`;
    page.drawText('Período de', { x: 310, y: 336, size: tamanho, font: helvetica, color: cor });
    page.drawText('Treinamento:', { x: 310, y: 321, size: tamanho, font: helvetica, color: cor });
    page.drawText(periodoTreinamento, { x: 400, y: 328, size: tamanho, font: helvetica, color: cor });

    // Marca d'água APENAS para certificado de visitante (mais visível)
    page.drawText('CERTIFICADO DE DEMONSTRACAO', {
      x: 120, y: 420, size: 24, font: helvetica, color: rgb(0.8, 0.8, 0.8), opacity: 0.6
    });
    page.drawText('SEM VALIDADE LEGAL', {
      x: 170, y: 390, size: 24, font: helvetica, color: rgb(0.8, 0.8, 0.8), opacity: 0.5
    });

    // SEGUNDA PÁGINA - Conteúdo Programático
    const paginas = pdfDoc.getPages();
    let segundaPagina;

    if (paginas.length >= 2) {
      segundaPagina = paginas[1];
    }

    if (segundaPagina) {
      // Função para quebrar texto em linhas
      function quebrarTexto(texto, fonte, tamanhoFonte, larguraMax) {
        if (!texto) return [''];
        const palavras = texto.split(' ');
        const linhas = [];
        let linhaAtual = '';
        
        for (const palavra of palavras) {
          const testeLinhaAtual = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
          try {
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
          } catch (error) {
            if (testeLinhaAtual.length * tamanhoFonte * 0.6 <= larguraMax) {
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
        }
        if (linhaAtual) linhas.push(linhaAtual);
        return linhas;
      }

      // Conteúdo Programático
      const linhasConteudo = quebrarTexto(treinamento.conteudo_programatico || 'Conteúdo não informado', helvetica, tamanho, 520);
      let yConteudo = 660;
      
      linhasConteudo.forEach(linha => {
        if (yConteudo < 450) return;
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
      const aproveitamentoTexto = treinamento.aproveitamento_conteudo || 'Nao ha aproveitamento de conteudo a ser considerado para esta capacitacao.';
      segundaPagina.drawText(aproveitamentoTexto, {
        x: 40, y: 220, size: tamanho, font: helvetica, color: cor, maxWidth: 500
      });
    }

    // Salvar PDF 
    const certificadosDir = path.join(__dirname, 'Certificados');
    if (!fs.existsSync(certificadosDir)) {
      fs.mkdirSync(certificadosDir, { recursive: true });
    }

    const nomeArquivo = nome.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    const timestamp = Date.now();
    const caminhoArquivo = path.join(certificadosDir, `certificado_visitante_${nomeArquivo}_${timestamp}.pdf`);
    fs.writeFileSync(caminhoArquivo, await pdfDoc.save());

    console.log('✅ Certificado visitante gerado:', caminhoArquivo);

    return caminhoArquivo;
  } catch (error) {
    console.error('❌ Erro ao gerar certificado visitante:', error.message);
    throw error;
  }
}

module.exports = {
  gerarCertificado: gerarCertificadoBanco,
  gerarCertificadoBanco,
  gerarCertificadoVisitante,
  enviarEmail,
};
