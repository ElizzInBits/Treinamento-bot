// Arquivo de inicialização rápida do frontend
console.log('🌐 Iniciando Frontend...');

// Importar o servidor principal
const path = require('path');
const fs = require('fs');

// Verificar se o arquivo principal existe
const mainServerFile = path.join(__dirname, 'server-front.js');

if (fs.existsSync(mainServerFile)) {
    console.log('✅ Carregando servidor principal...');
    require('./server-front.js');
} else {
    console.log('❌ Arquivo server-front.js não encontrado');
    console.log('📁 Arquivos disponíveis:');
    
    // Listar arquivos .js no diretório
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
    files.forEach(file => console.log(`   - ${file}`));
    
    // Tentar carregar um arquivo alternativo
    if (files.includes('startup-optimized.js')) {
        console.log('🔄 Tentando carregar startup-optimized.js...');
        require('./startup-optimized.js');
    } else {
        console.log('⚠️  Nenhum arquivo de servidor encontrado');
        process.exit(1);
    }
}