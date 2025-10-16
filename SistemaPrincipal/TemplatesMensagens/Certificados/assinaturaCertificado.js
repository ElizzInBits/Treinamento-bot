const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { AssinaturaCertificado, Usuario } = require('../../BancoDeDados/models');
const { PDFDocument, rgb } = require('pdf-lib');
const { sequelize } = require('../../BancoDeDados/database');

// Modelo LinkCurto
const LinkCurto = sequelize.define('LinkCurto', {
  codigo: { type: require('sequelize').DataTypes.STRING(8), unique: true },
  urlCompleta: { type: require('sequelize').DataTypes.STRING(500) },
  expiresAt: { type: require('sequelize').DataTypes.DATE },
  acessos: { type: require('sequelize').DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'links_curtos' });

class AssinaturaCertificadoService {
  
  // Gerar token único para assinatura
  static gerarToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Gerar link curto
  static gerarLinkCurto() {
    return crypto.randomBytes(4).toString('hex'); // 8 caracteres
  }

  // Gerar alias personalizado
  static gerarAliasPersonalizado() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    return `assinatura-certificado-salubrita-${timestamp}${random}`;
  }

  // Encurtar URL usando TinyURL com alias personalizado
  static async encurtarUrl(url) {
    try {
      const https = require('https');
      const alias = this.gerarAliasPersonalizado();
      const tinyUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}&alias=${alias}`;
      
      return new Promise((resolve, reject) => {
        https.get(tinyUrl, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (data.startsWith('https://tinyurl.com/')) {
              resolve(data.trim());
            } else {
              // Se alias falhar, tentar sem alias
              const fallbackUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
              https.get(fallbackUrl, (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => {
                  resolve(data2.startsWith('https://tinyurl.com/') ? data2.trim() : url);
                });
              }).on('error', () => resolve(url));
            }
          });
        }).on('error', () => resolve(url)); // Fallback em caso de erro
      });
    } catch (error) {
      return url; // Fallback para URL original
    }
  }

  // Criar registro de assinatura pendente
  static async criarAssinaturaPendente(usuarioId, certificadoPath, nometreinamento) {
    const token = this.gerarToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expira em 24 horas

    const assinatura = await AssinaturaCertificado.create({
      usuarioId,
      certificadoPath,
      tokenAssinatura: token,
      expiresAt,
      status: 'pendente'
    });

    // Criar URL completa e encurtar
    const urlCompleta = `http://72.60.48.249:3000/assinar-certificado/${token}`;
    const linkEncurtado = await this.encurtarUrl(urlCompleta);

    return {
      token,
      linkAssinatura: linkEncurtado,
      linkCompleto: urlCompleta,
      assinaturaId: assinatura.id
    };
  }

  // Validar token de assinatura
  static async validarToken(token) {
    const assinatura = await AssinaturaCertificado.findOne({
      where: { 
        tokenAssinatura: token,
        status: 'pendente'
      },
      include: [{
        model: Usuario,
        as: 'usuario'
      }]
    });

    if (!assinatura) {
      return { valido: false, erro: 'Token inválido ou expirado' };
    }

    if (new Date() > assinatura.expiresAt) {
      await assinatura.update({ status: 'expirado' });
      return { valido: false, erro: 'Token expirado' };
    }

    return { 
      valido: true, 
      assinatura,
      usuario: assinatura.usuario
    };
  }

  // Salvar assinatura e regenerar PDF
  static async salvarAssinatura(token, assinaturaBase64) {
    const validacao = await this.validarToken(token);
    
    if (!validacao.valido) {
      throw new Error(validacao.erro);
    }

    const { assinatura, usuario } = validacao;

    // Salvar assinatura no banco
    await assinatura.update({
      assinaturaBase64,
      assinadoEm: new Date(),
      status: 'assinado'
    });

    // Regenerar PDF com assinatura
    const certificadoAssinado = await this.adicionarAssinaturaPDF(
      assinatura.certificadoPath,
      assinaturaBase64
    );

    return {
      sucesso: true,
      certificadoAssinado,
      usuario
    };
  }

  // Adicionar assinatura ao PDF existente
  static async adicionarAssinaturaPDF(certificadoPath, assinaturaBase64) {
    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(certificadoPath)) {
        console.log(`⚠️ Certificado não encontrado, tentando regenerar: ${certificadoPath}`);
        
        // Tentar extrair ID do usuário do caminho do arquivo
        const nomeArquivo = path.basename(certificadoPath, '.pdf');
        const match = nomeArquivo.match(/certificado_(.+)/);
        
        if (match) {
          // Regenerar certificado usando certificados2.js
          const certificados = require('./certificados2');
          
          // Buscar usuário pelo nome no arquivo
          const { Usuario } = require('../../BancoDeDados/models');
          const nomeUsuario = match[1].replace(/_/g, ' ');
          
          const usuario = await Usuario.findOne({
            where: {
              [require('sequelize').Op.or]: [
                { nome: { [require('sequelize').Op.like]: `%${nomeUsuario}%` } },
                { nomeCompleto: { [require('sequelize').Op.like]: `%${nomeUsuario}%` } }
              ]
            }
          });
          
          if (usuario) {
            console.log(`🔄 Regenerando certificado para ${usuario.nome}`);
            const novoCertificado = await certificados.gerarCertificado(usuario.id);
            
            if (novoCertificado && fs.existsSync(novoCertificado)) {
              certificadoPath = novoCertificado;
            } else {
              throw new Error('Não foi possível regenerar o certificado');
            }
          } else {
            throw new Error('Usuário não encontrado para regenerar certificado');
          }
        } else {
          throw new Error(`Arquivo de certificado não encontrado: ${certificadoPath}`);
        }
      }
      
      // Ler PDF existente
      const pdfBytes = fs.readFileSync(certificadoPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Converter base64 para imagem
      const assinaturaImage = await pdfDoc.embedPng(assinaturaBase64);
      
      // Adicionar assinatura na primeira página
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Posicionar assinatura (escolha uma das opções abaixo)
      const { width, height } = firstPage.getSize();
      
      // OPÇÃO 1: Canto inferior direito (atual)
      // firstPage.drawImage(assinaturaImage, {
      //   x: width - 200, y: 50, width: 150, height: 50
      // });
      
      // OPÇÃO 2: Canto inferior esquerdo
      // firstPage.drawImage(assinaturaImage, {
      //   x: 50, y: 50, width: 150, height: 50
      // });
      
      // OPÇÃO 3: Centro inferior
      // firstPage.drawImage(assinaturaImage, {
      //   x: (width / 2) - 75, y: 50, width: 150, height: 50
      // });
      
      // OPÇÃO 4: Canto superior direito
      // firstPage.drawImage(assinaturaImage, {
      //   x: width - 200, y: height - 100, width: 150, height: 50
      // });
      
      // OPÇÃO 5: Assinatura otimizada - tamanho e qualidade ideais
      
      // Obter dimensões originais da imagem para manter proporção
      const imgDims = assinaturaImage.scale(1);
      const aspectRatio = imgDims.width / imgDims.height;
      
      // Definir largura desejada e calcular altura proporcional
      const desiredWidth = 220;
      const desiredHeight = desiredWidth / aspectRatio;
      
      firstPage.drawImage(assinaturaImage, {
        x: (width / 2) + 20,
        y: (height / 2) - 300,
        width: desiredWidth,
        height: Math.min(desiredHeight, 70) // Limitar altura máxima
      });

      // Texto "Assinado digitalmente" próximo à assinatura
      firstPage.drawText('Assinado digitalmente', {
        x: (width / 2) + 30,
        y: (height / 2) - 250, // Mais próximo da assinatura
        size: 9,
        color: rgb(0.4, 0.4, 0.4)
      });

      // Salvar novo PDF
      const pdfBytesAssinado = await pdfDoc.save();
      const nomeArquivo = path.basename(certificadoPath, '.pdf');
      const certificadoAssinadoPath = path.join(
        path.dirname(certificadoPath),
        `${nomeArquivo}_assinado.pdf`
      );
      
      fs.writeFileSync(certificadoAssinadoPath, pdfBytesAssinado);
      
      return certificadoAssinadoPath;
      
    } catch (error) {
      console.error('❌ Erro ao adicionar assinatura ao PDF:', error);
      throw error;
    }
  }

  // Obter dados para página de assinatura
  static async obterDadosAssinatura(token) {
    const validacao = await this.validarToken(token);
    
    if (!validacao.valido) {
      return { erro: validacao.erro };
    }

    const { assinatura, usuario } = validacao;
    
    return {
      sucesso: true,
      usuario: {
        nome: usuario.nomeCompleto || usuario.nome,
        email: usuario.email
      },
      certificado: {
        path: assinatura.certificadoPath,
        expiresAt: assinatura.expiresAt
      }
    };
  }
}

module.exports = AssinaturaCertificadoService;