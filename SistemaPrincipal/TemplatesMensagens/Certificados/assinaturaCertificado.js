const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Usuario } = require('../../BancoDeDados/models');
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
  
  // Gerar token único para assinatura com ID do usuário e treinamento
  static gerarToken(usuarioId, treinamentoId) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    return `${treinamentoId}_${usuarioId}_${timestamp}_${random}`;
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

  // Criar token de certificado e salvar no usuário
  static async criarTokenCertificado(usuarioId, treinamentoId, certificadoPath) {
    const { Usuario } = require('../../BancoDeDados/models');
    const token = this.gerarToken(usuarioId, treinamentoId);

    // Buscar usuário
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se token já existe
    const tokensExistentes = usuario.tokensCertificados ? usuario.tokensCertificados.split(',') : [];
    const tokenExistente = tokensExistentes.find(t => t.startsWith(`${treinamentoId}_${usuarioId}_`));

    if (tokenExistente) {
      const urlCompleta = `http://72.60.48.249:3000/assinar-certificado/${tokenExistente}`;
      return {
        token: tokenExistente,
        linkAssinatura: await this.encurtarUrl(urlCompleta),
        linkCompleto: urlCompleta
      };
    }

    // Adicionar novo token
    tokensExistentes.push(token);
    await usuario.update({
      tokensCertificados: tokensExistentes.join(',')
    });

    const urlCompleta = `http://72.60.48.249:3000/assinar-certificado/${token}`;
    const linkEncurtado = await this.encurtarUrl(urlCompleta);

    return {
      token,
      linkAssinatura: linkEncurtado,
      linkCompleto: urlCompleta
    };
  }

  // Validar token de certificado
  static async validarToken(token) {
    const { Usuario } = require('../../BancoDeDados/models');
    
    // Extrair IDs do token
    const [treinamentoId, usuarioId] = token.split('_');
    
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return { valido: false, erro: 'Usuário não encontrado' };
    }

    // Verificar se token existe na lista do usuário
    const tokens = usuario.tokensCertificados ? usuario.tokensCertificados.split(',') : [];
    if (!tokens.includes(token)) {
      return { valido: false, erro: 'Token inválido' };
    }

    return { 
      valido: true, 
      usuario,
      treinamentoId: parseInt(treinamentoId)
    };
  }

  // Salvar assinatura e regenerar PDF
  static async salvarAssinatura(token, assinaturaBase64) {
    const validacao = await this.validarToken(token);
    
    if (!validacao.valido) {
      throw new Error(validacao.erro);
    }

    const { usuario } = validacao;

    // Buscar certificado do usuário
    const certificadoPath = this.buscarCertificadoPath(usuario.id, validacao.treinamentoId);

    // Regenerar PDF com assinatura
    const certificadoAssinado = await this.adicionarAssinaturaPDF(
      certificadoPath,
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
      // Verificar se o path é válido
      if (!certificadoPath) {
        throw new Error('Caminho do certificado não fornecido');
      }
      
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

  // Verificar se certificado já foi assinado
  static async verificarStatusAssinatura(token) {
    try {
      const validacao = await this.validarToken(token);
      
      if (!validacao.valido) {
        return { jaAssinado: false, certificadoAssinado: null };
      }

      const { usuario } = validacao;
      const certificadoPath = this.buscarCertificadoPath(usuario.id);
      
      if (!certificadoPath) {
        return { jaAssinado: false, certificadoAssinado: null };
      }
      
      // Verificar se existe versão assinada
      const nomeArquivo = path.basename(certificadoPath, '.pdf');
      const certificadoAssinadoPath = path.join(
        path.dirname(certificadoPath),
        `${nomeArquivo}_assinado.pdf`
      );
      
      const jaAssinado = fs.existsSync(certificadoAssinadoPath);
      
      return {
        jaAssinado,
        certificadoAssinado: jaAssinado ? path.basename(certificadoAssinadoPath) : null
      };
      
    } catch (error) {
      console.error('❌ Erro ao verificar status da assinatura:', error);
      return { jaAssinado: false, certificadoAssinado: null };
    }
  }

  // Obter dados para página de assinatura
  static async obterDadosAssinatura(token) {
    const validacao = await this.validarToken(token);
    
    if (!validacao.valido) {
      return { erro: validacao.erro };
    }

    const { usuario, treinamentoId } = validacao;
    
    return {
      sucesso: true,
      usuario: {
        nome: usuario.nomeCompleto || usuario.nome,
        email: usuario.email
      },
      certificado: {
        treinamentoId
      }
    };
  }

  // Buscar caminho do certificado
  static buscarCertificadoPath(usuarioId, treinamentoId) {
    const path = require('path');
    const fs = require('fs');
    
    try {
      // Buscar certificado na pasta de certificados
      const certificadosDir = path.join(__dirname, 'Certificados');
      
      if (!fs.existsSync(certificadosDir)) {
        console.log(`⚠️ Diretório de certificados não existe: ${certificadosDir}`);
        return null;
      }
      
      const arquivos = fs.readdirSync(certificadosDir).filter(f => f.endsWith('.pdf'));
      console.log(`🔍 Procurando certificado para usuário ${usuarioId} em ${arquivos.length} arquivos`);
      
      // Procurar por arquivo que contenha o ID do usuário ou nome
      let certificado = arquivos.find(arquivo => 
        arquivo.includes(`_${usuarioId}_`) || 
        arquivo.includes(`usuario_${usuarioId}`) ||
        arquivo.toLowerCase().includes(`${usuarioId}`)
      );
      
      // Se não encontrar por ID, pegar o mais recente
      if (!certificado && arquivos.length > 0) {
        console.log(`⚠️ Certificado específico não encontrado, usando o mais recente`);
        const stats = arquivos.map(arquivo => ({
          nome: arquivo,
          path: path.join(certificadosDir, arquivo),
          mtime: fs.statSync(path.join(certificadosDir, arquivo)).mtime
        }));
        
        stats.sort((a, b) => b.mtime - a.mtime);
        certificado = stats[0].nome;
      }
      
      const certificadoPath = certificado ? path.join(certificadosDir, certificado) : null;
      console.log(`📄 Certificado encontrado: ${certificadoPath}`);
      
      return certificadoPath;
      
    } catch (error) {
      console.error('❌ Erro ao buscar certificado:', error);
      return null;
    }
  }
}

module.exports = AssinaturaCertificadoService;