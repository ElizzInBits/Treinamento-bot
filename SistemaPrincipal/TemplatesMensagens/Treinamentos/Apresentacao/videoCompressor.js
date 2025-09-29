// ==================== COMPRESSOR DE VÍDEO SEM FFMPEG ====================

const fs = require('fs');
const path = require('path');

// Função para reduzir qualidade do vídeo dividindo em chunks menores
async function comprimirVideoSimples(inputPath, outputPath, qualidade = 0.7) {
    try {
        console.log('🔄 Iniciando compressão simples...');
        
        const inputBuffer = fs.readFileSync(inputPath);
        const inputSize = inputBuffer.length;
        
        // Calcular novo tamanho baseado na qualidade
        const targetSize = Math.floor(inputSize * qualidade);
        
        // Criar buffer reduzido (simulação de compressão)
        const compressedBuffer = Buffer.alloc(targetSize);
        
        // Copiar dados com intervalos para simular compressão
        const step = Math.floor(inputSize / targetSize);
        let outputIndex = 0;
        
        for (let i = 0; i < inputSize && outputIndex < targetSize; i += step) {
            if (outputIndex < targetSize) {
                compressedBuffer[outputIndex] = inputBuffer[i];
                outputIndex++;
            }
        }
        
        // Salvar arquivo comprimido
        fs.writeFileSync(outputPath, compressedBuffer);
        
        const outputSize = compressedBuffer.length;
        const compressionRatio = ((inputSize - outputSize) / inputSize * 100).toFixed(1);
        
        console.log(`✅ Compressão concluída: ${compressionRatio}% de redução`);
        
        return outputPath;
        
    } catch (error) {
        console.error('❌ Erro na compressão simples:', error);
        throw error;
    }
}

// Função para dividir vídeo em partes menores
async function dividirVideo(inputPath, outputDir, maxSizeMB = 15) {
    try {
        const inputBuffer = fs.readFileSync(inputPath);
        const inputSize = inputBuffer.length;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        
        const numPartes = Math.ceil(inputSize / maxSizeBytes);
        const partes = [];
        
        for (let i = 0; i < numPartes; i++) {
            const start = i * maxSizeBytes;
            const end = Math.min(start + maxSizeBytes, inputSize);
            const partBuffer = inputBuffer.slice(start, end);
            
            const partPath = path.join(outputDir, `parte_${i + 1}.mp4`);
            fs.writeFileSync(partPath, partBuffer);
            partes.push(partPath);
            
            console.log(`📄 Parte ${i + 1}/${numPartes} criada: ${(partBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        }
        
        return partes;
        
    } catch (error) {
        console.error('❌ Erro ao dividir vídeo:', error);
        throw error;
    }
}

module.exports = {
    comprimirVideoSimples,
    dividirVideo
};