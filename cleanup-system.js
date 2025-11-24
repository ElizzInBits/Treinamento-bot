#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SystemCleanup {

  // Limpar logs antigos (mais de 7 dias)
  static cleanOldLogs() {
    const logDirs = [
      './logs',
      './SistemaPrincipal/logs',
      './SistemaPrincipal/TemplatesMensagens/logs',
      './SistemaPrincipal/front-end/logs'
    ];

    let cleaned = 0;
    logDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          const daysDiff = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

          if (daysDiff > 7 && file.endsWith('.log')) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        });
      }
    });

    console.log(`🧹 ${cleaned} logs antigos removidos`);
    return cleaned;
  }

  // Limpar cache e arquivos temporários
  static cleanTempFiles() {
    const tempDirs = [
      './SistemaPrincipal/TemplatesMensagens/cache/images',
      './wppconnect-server/WhatsAppImages'
    ];

    let cleaned = 0;

    tempDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          const daysDiff = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

          if (daysDiff > 7) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        });
      }
    });

    console.log(`🖼️ ${cleaned} arquivos temporários removidos`);
    return cleaned;
  }

  // Executar limpeza completa
  static async runCleanup() {
    console.log('🚀 Iniciando limpeza do sistema...');

    const logs = this.cleanOldLogs();
    const temp = this.cleanTempFiles();

    console.log(`✅ Limpeza concluída: ${logs + temp} arquivos removidos`);

    return { logs, temp, total: logs + temp };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  SystemCleanup.runCleanup();
}

module.exports = SystemCleanup;