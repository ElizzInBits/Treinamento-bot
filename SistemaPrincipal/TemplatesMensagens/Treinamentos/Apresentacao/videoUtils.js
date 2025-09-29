// ==================== UTILITÁRIOS DE VÍDEO ====================

const fs = require('fs');
const path = require('path');

// Limpar vídeos comprimidos antigos (mais de 1 hora)
async function limparVideosComprimidos() {
    try {
        const compressedDir = path.join(__dirname, 'material_apresentacao', 'Videos');
        const files = fs.readdirSync(compressedDir);
        
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1 hora em ms
        
        files.forEach(file => {
            if (file.startsWith('compressed_')) {
                const filePath = path.join(compressedDir, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > oneHour) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Vídeo comprimido antigo removido: ${file}`);
                }
            }
        });
    } catch (error) {
        console.error('❌ Erro ao limpar vídeos comprimidos:', error);
    }
}

// Verificar se FFmpeg está disponível
function verificarFFmpeg() {
    try {
        const { execSync } = require('child_process');
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        console.warn('⚠️ FFmpeg não encontrado. Vídeos grandes não poderão ser comprimidos.');
        return false;
    }
}

module.exports = {
    limparVideosComprimidos,
    verificarFFmpeg
};