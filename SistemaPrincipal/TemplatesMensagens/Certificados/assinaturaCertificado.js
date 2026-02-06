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
  static gerarToken(usuarioId, treinamento_id) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    return `${treinamento_id}_${usuarioId}_${timestamp}_${random}`;
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
  static async criarTokenCertificado(usuarioId, treinamento_id, certificadoPath) {
    const { Usuario, AssinaturaCertificado } = require('../../BancoDeDados/models');
    
    // Verificar se já existe certificado assinado para este treinamento
    const certificadoAssinado = await AssinaturaCertificado.findOne({
      where: {
        usuarioId: usuarioId,
        status: 'assinado'
      },
      order: [['assinadoEm', 'DESC']]
    });
    
    if (certificadoAssinado) {
      // Extrair treinamento_id do token
      const tokenParts = certificadoAssinado.tokenAssinatura.split('_');
      const treinamento_idToken = parseInt(tokenParts[0]);
      
      if (treinamento_idToken === treinamento_id) {
        throw new Error(`Você já possui um certificado assinado para este treinamento. Não é possível assinar novamente.`);
      }
    }
    
    const token = this.gerarToken(usuarioId, treinamento_id);

    // Buscar usuário
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se token já existe (pendente)
    const tokenPendente = await AssinaturaCertificado.findOne({
      where: {
        usuarioId: usuarioId,
        status: 'pendente'
      },
      order: [['created_at', 'DESC']]
    });
    
    if (tokenPendente) {
      const tokenParts = tokenPendente.tokenAssinatura.split('_');
      const treinamento_idToken = parseInt(tokenParts[0]);
      
      if (treinamento_idToken === treinamento_id) {
        const urlCompleta = `http://72.60.48.249:3000/assinar-certificado/${tokenPendente.tokenAssinatura}`;
        return {
          token: tokenPendente.tokenAssinatura,
          linkAssinatura: await this.encurtarUrl(urlCompleta),
          linkCompleto: urlCompleta
        };
      }
    }

    // Criar novo registro de assinatura
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await AssinaturaCertificado.create({
      usuarioId: usuarioId,
      certificadoPath: certificadoPath,
      tokenAssinatura: token,
      expiresAt: expiresAt,
      status: 'pendente'
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
    const { Usuario, AssinaturaCertificado } = require('../../BancoDeDados/models');
    
    // Buscar assinatura no banco
    const assinatura = await AssinaturaCertificado.findOne({
      where: { tokenAssinatura: token }
    });
    
    if (!assinatura) {
      return { valido: false, erro: 'Token inválido ou expirado' };
    }
    
    // Verificar se já foi assinado
    if (assinatura.status === 'assinado') {
      return { valido: false, erro: 'Este certificado já foi assinado' };
    }
    
    // Verificar expiração
    if (new Date() > assinatura.expiresAt) {
      await AssinaturaCertificado.update(
        { status: 'expirado' },
        { where: { id: assinatura.id } }
      );
      return { valido: false, erro: 'Token expirado' };
    }
    
    // Extrair treinamento_id do token
    const [treinamento_id, usuarioId] = token.split('_');
    
    const usuario = await Usuario.findByPk(assinatura.usuarioId);
    if (!usuario) {
      return { valido: false, erro: 'Usuário não encontrado' };
    }

    return { 
      valido: true, 
      usuario,
      treinamento_id: parseInt(treinamento_id),
      assinatura
    };
  }

  // Salvar assinatura, regenerar PDF e enviar por email
  static async salvarAssinatura(token, assinaturaBase64) {
    const { AssinaturaCertificado } = require('../../BancoDeDados/models');
    
    const validacao = await this.validarToken(token);
    
    if (!validacao.valido) {
      throw new Error(validacao.erro);
    }

    const { usuario, assinatura, treinamento_id } = validacao;

    // Buscar certificado do banco de dados
    const certificadoPath = assinatura.certificadoPath;

    // Regenerar PDF com assinatura
    const certificadoAssinado = await this.adicionarAssinaturaPDF(
      certificadoPath,
      assinaturaBase64,
      usuario.id,
      treinamento_id
    );
    
    // Atualizar registro de assinatura
    await AssinaturaCertificado.update(
      {
        assinaturaBase64: assinaturaBase64,
        assinadoEm: new Date(),
        status: 'assinado'
      },
      {
        where: {
          tokenAssinatura: token
        }
      }
    );
    
    // Enviar certificado ASSINADO por email
    try {
      const { enviarEmail } = require('./certificados2');
      const { Treinamento } = require('../../BancoDeDados/models');
      
      const treinamento = await Treinamento.findByPk(validacao.treinamentoId);
      
      await enviarEmail(
        usuario.email,
        certificadoAssinado,  // Envia o certificado ASSINADO
        treinamento
      );
      
      console.log(`📧 E-mail com certificado assinado enviado para: ${usuario.email}`);
    } catch (emailError) {
      console.error('❌ Erro ao enviar e-mail, mas assinatura foi salva:', emailError.message);
      // Não lança erro para não bloquear o fluxo
    }

    return {
      sucesso: true,
      certificadoAssinado,
      usuario
    };
  }

  // Adicionar assinatura ao PDF existente
  static async adicionarAssinaturaPDF(certificadoPath, assinaturaBase64, usuarioId, treinamento_id) {
    try {
      if (!certificadoPath) {
        throw new Error('Caminho do certificado não fornecido');
      }
      
      // Se o arquivo não existe, regenerar
      if (!fs.existsSync(certificadoPath)) {
        console.log(`⚠️ Certificado não encontrado, regenerando: ${certificadoPath}`);
        
        const { gerarCertificadoBanco } = require('./certificados2');
        
        const novoCertificadoPath = await gerarCertificadoBanco(
          usuarioId,
          null,
          treinamento_id,
          false
        );
        
        if (!novoCertificadoPath || !fs.existsSync(novoCertificadoPath)) {
          throw new Error('Não foi possível regenerar o certificado');
        }
        
        console.log(`✅ Certificado regenerado: ${novoCertificadoPath}`);
        certificadoPath = novoCertificadoPath;
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
      const { AssinaturaCertificado } = require('../../BancoDeDados/models');
      
      const assinatura = await AssinaturaCertificado.findOne({
        where: { tokenAssinatura: token }
      });
      
      if (!assinatura) {
        return { jaAssinado: false, certificadoAssinado: null };
      }
      
      const jaAssinado = assinatura.status === 'assinado';
      
      if (jaAssinado && assinatura.certificadoPath) {
        const nomeArquivo = path.basename(assinatura.certificadoPath, '.pdf');
        const certificadoAssinadoPath = path.join(
          path.dirname(assinatura.certificadoPath),
          `${nomeArquivo}_assinado.pdf`
        );
        
        // Verificar se arquivo existe
        if (!fs.existsSync(certificadoAssinadoPath)) {
          console.log('🔄 Certificado assinado foi apagado, regenerando em background...');
          
          // Regenerar em background (não bloquear resposta)
          this.regenerarCertificadoAssinado(assinatura).then(certificadoRegenerado => {
            if (certificadoRegenerado) {
              console.log(`✅ Certificado regenerado: ${certificadoRegenerado}`);
            }
          }).catch(err => {
            console.error('❌ Erro ao regenerar certificado:', err);
          });
          
          // Retornar nome esperado do arquivo (será regenerado em instantes)
          return {
            jaAssinado: true,
            certificadoAssinado: path.basename(certificadoAssinadoPath),
            regenerando: true
          };
        }
        
        return {
          jaAssinado: true,
          certificadoAssinado: path.basename(certificadoAssinadoPath)
        };
      }
      
      return {
        jaAssinado,
        certificadoAssinado: null
      };
      
    } catch (error) {
      console.error('❌ Erro ao verificar status da assinatura:', error);
      return { jaAssinado: false, certificadoAssinado: null };
    }
  }
  
  // Regenerar certificado assinado
  static async regenerarCertificadoAssinado(assinatura) {
    try {
      const { Usuario } = require('../../BancoDeDados/models');
      const { gerarCertificadoBanco } = require('./certificados2');
      
      // Extrair treinamento_id do token
      const [treinamento_id, usuarioId] = assinatura.tokenAssinatura.split('_');
      
      console.log(`🔄 Regenerando certificado para usuário ${usuarioId}, treinamento ${treinamento_id}`);
      
      // Gerar novo certificado (sem enviar email, pois será enviado após assinatura)
      const novoCertificadoPath = await gerarCertificadoBanco(
        parseInt(usuarioId),
        null,
        parseInt(treinamento_id),
        false  // Não enviar email automaticamente
      );
      
      if (!novoCertificadoPath) {
        console.error('❌ Erro ao regenerar certificado');
        return null;
      }
      
      // Adicionar assinatura ao novo certificado
      const certificadoAssinado = await this.adicionarAssinaturaPDF(
        novoCertificadoPath,
        assinatura.assinaturaBase64
      );
      
      // Atualizar caminho no banco
      await assinatura.update({
        certificadoPath: novoCertificadoPath
      });
      
      // Enviar certificado assinado por email
      try {
        const usuario = await Usuario.findByPk(parseInt(usuarioId));
        const { Treinamento } = require('../../BancoDeDados/models');
        const { enviarEmail } = require('./certificados2');
        
        const treinamento = await Treinamento.findByPk(parseInt(treinamento_id));
        
        if (usuario && usuario.email) {
          await enviarEmail(
            usuario.email,
            certificadoAssinado,
            treinamento
          );
          console.log(`📧 E-mail enviado após regeneração para: ${usuario.email}`);
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar e-mail na regeneração:', emailError.message);
      }
      
      console.log(`✅ Certificado regenerado com sucesso: ${certificadoAssinado}`);
      return certificadoAssinado;
      
    } catch (error) {
      console.error('❌ Erro ao regenerar certificado:', error);
      return null;
    }
  }

  // Obter dados para página de assinatura
  static async obterDadosAssinatura(token) {
    try {
      const { Usuario, AssinaturaCertificado } = require('../../BancoDeDados/models');
      
      // Buscar assinatura no banco
      const assinatura = await AssinaturaCertificado.findOne({
        where: { tokenAssinatura: token }
      });
      
      if (!assinatura) {
        return { erro: 'Token inválido ou expirado' };
      }
      
      // Buscar usuário
      const usuario = await Usuario.findByPk(assinatura.usuarioId);
      if (!usuario) {
        return { erro: 'Usuário não encontrado' };
      }
      
      // Extrair treinamento_id do token
      const [treinamento_id] = token.split('_');
      
      return {
        sucesso: true,
        usuario: {
          nome: usuario.nome,
          email: usuario.email
        },
        certificado: {
          treinamento_id: parseInt(treinamento_id),
          status: assinatura.status
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter dados da assinatura:', error);
      return { erro: 'Erro ao processar token' };
    }
  }

}

// Método removido - certificadoPath agora vem do banco de dados

module.exports = AssinaturaCertificadoService;