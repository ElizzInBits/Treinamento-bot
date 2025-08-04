const fs = require('fs');
const path = require('path');

const pastaScripts = path.join(__dirname, 'TemplatesMensagens', 'Treinamentos');

console.log('📁 Scripts de treinamento encontrados:');
console.log('=====================================');

try {
  const arquivos = fs.readdirSync(pastaScripts);
  
  if (arquivos.length === 0) {
    console.log('❌ Nenhum script encontrado');
  } else {
    arquivos.forEach((arquivo, index) => {
      if (arquivo.endsWith('.js')) {
        const caminhoCompleto = path.join(pastaScripts, arquivo);
        const stats = fs.statSync(caminhoCompleto);
        console.log(`${index + 1}. ${arquivo}`);
        console.log(`   📅 Criado em: ${stats.birthtime.toLocaleString('pt-BR')}`);
        console.log(`   📝 Modificado em: ${stats.mtime.toLocaleString('pt-BR')}`);
        console.log('');
      }
    });
  }
} catch (error) {
  console.error('❌ Erro ao verificar scripts:', error.message);
}