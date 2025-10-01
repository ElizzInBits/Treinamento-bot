const fs = require('fs');
const path = require('path');

// Limpar certificados antigos (mais de 1 hora)
function limparCertificadosAntigos() {
  try {
    const certificadosDir = path.join(__dirname, 'Certificados');
    
    if (!fs.existsSync(certificadosDir)) {
      return;
    }

    const arquivos = fs.readdirSync(certificadosDir);
    const agora = Date.now();
    const cincoMinutos = 5 * 60 * 1000; // 5 minutos em millisegundos
    
    let removidos = 0;

    arquivos.forEach(arquivo => {
      const caminhoArquivo = path.join(certificadosDir, arquivo);
      const stats = fs.statSync(caminhoArquivo);
      
      // Se arquivo tem mais de 5 minutos, remover
      if (agora - stats.mtime.getTime() > cincoMinutos) {
        try {
          fs.unlinkSync(caminhoArquivo);
          removidos++;
          console.log(`🗑️ Certificado antigo removido: ${arquivo}`);
        } catch (error) {
          console.error(`❌ Erro ao remover ${arquivo}:`, error);
        }
      }
    });

    if (removidos > 0) {
      console.log(`✅ Limpeza concluída: ${removidos} certificados removidos`);
    }
  } catch (error) {
    console.error('❌ Erro na limpeza de certificados:', error);
  }
}

// Executar limpeza a cada 2 minutos
setInterval(limparCertificadosAntigos, 2 * 60 * 1000);

// Executar limpeza inicial
limparCertificadosAntigos();

console.log('🧹 Sistema de limpeza de certificados iniciado');

module.exports = { limparCertificadosAntigos };