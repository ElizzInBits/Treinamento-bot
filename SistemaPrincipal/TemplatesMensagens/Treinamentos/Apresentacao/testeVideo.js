// ==================== TESTE DE COMPRESSÃO DE VÍDEO ====================

const path = require('path');
const fs = require('fs');
const { verificarFFmpeg } = require('./videoUtils');

async function testarCompressao() {
    console.log('🧪 Iniciando teste de compressão de vídeo...\n');
    
    // Verificar FFmpeg
    console.log('1. Verificando FFmpeg...');
    if (verificarFFmpeg()) {
        console.log('✅ FFmpeg disponível\n');
    } else {
        console.log('❌ FFmpeg não encontrado\n');
        return;
    }
    
    // Verificar vídeos
    console.log('2. Verificando vídeos disponíveis...');
    const videosDir = path.join(__dirname, 'material_apresentacao', 'Videos');
    
    if (fs.existsSync(videosDir)) {
        const files = fs.readdirSync(videosDir);
        const videoFiles = files.filter(file => file.endsWith('.mp4') && !file.startsWith('compressed_'));
        
        console.log(`📁 Pasta de vídeos: ${videosDir}`);
        console.log(`🎥 Vídeos encontrados: ${videoFiles.length}`);
        
        videoFiles.forEach(file => {
            const filePath = path.join(videosDir, file);
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`   - ${file}: ${sizeMB}MB`);
        });
        
        if (videoFiles.length === 0) {
            console.log('⚠️ Nenhum vídeo .mp4 encontrado para teste');
        }
    } else {
        console.log('❌ Pasta de vídeos não encontrada');
    }
    
    console.log('\n✅ Teste concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Coloque seus vídeos na pasta material_apresentacao/Videos/');
    console.log('   2. Execute o bot normalmente');
    console.log('   3. Vídeos > 16MB serão comprimidos automaticamente');
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testarCompressao().catch(console.error);
}

module.exports = { testarCompressao };