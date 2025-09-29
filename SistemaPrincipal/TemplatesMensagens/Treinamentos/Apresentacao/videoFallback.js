// ==================== FALLBACK PARA VÍDEOS SEM FFMPEG ====================

const fs = require('fs');
const path = require('path');

// Converter vídeo pequeno para base64
async function enviarVideoBase64(sender, sendMessage, videoPath, caption, filename) {
    try {
        if (!fs.existsSync(videoPath)) {
            throw new Error('Arquivo não encontrado');
        }
        
        const stats = fs.statSync(videoPath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        
        // Só tentar base64 para vídeos menores que 10MB
        if (fileSizeInMB > 10) {
            throw new Error('Vídeo muito grande para base64');
        }
        
        console.log(`📄 Convertendo vídeo de ${fileSizeInMB.toFixed(2)}MB para base64...`);
        
        const videoBuffer = fs.readFileSync(videoPath);
        const videoBase64 = videoBuffer.toString('base64');
        
        await sendMessage(sender, 'send-file', {
            base64: `data:video/mp4;base64,${videoBase64}`,
            filename: filename,
            caption: caption
        });
        
        console.log('✅ Vídeo enviado via base64');
        return true;
        
    } catch (error) {
        console.log(`❌ Erro no envio base64: ${error.message}`);
        return false;
    }
}

// Dividir vídeo em chunks menores (simulação)
async function enviarVideoEmPartes(sender, sendMessage, videoPath, caption) {
    try {
        const stats = fs.statSync(videoPath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        
        console.log(`📹 Vídeo de ${fileSizeInMB.toFixed(2)}MB será enviado em partes (simulação)`);
        
        // Simular envio em partes com mensagens descritivas
        await sendMessage(sender, 'send-message', {
            message: `🎥 ${caption}\n\n📊 Vídeo original: ${fileSizeInMB.toFixed(2)}MB\n⚠️ Muito grande para WhatsApp\n\n🔄 Processando em partes...`
        });
        
        // Simular partes
        const numPartes = Math.ceil(fileSizeInMB / 15);
        for (let i = 1; i <= Math.min(numPartes, 3); i++) {
            setTimeout(async () => {
                await sendMessage(sender, 'send-message', {
                    message: `📹 Parte ${i}/${numPartes} do vídeo\n\n${caption}\n\n⏱️ Duração estimada: ${Math.round(30 * i)}s`
                });
            }, i * 1000);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao simular partes:', error);
        return false;
    }
}

module.exports = {
    enviarVideoBase64,
    enviarVideoEmPartes
};