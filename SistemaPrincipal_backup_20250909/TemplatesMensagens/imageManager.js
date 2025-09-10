const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// URLs das imagens do Google Drive
const IMAGE_URLS = {
    'SEGURANCA': process.env.SEGURANCA_IMAGE_URL || null,
    'LOGO_EMPRESA': process.env.LOGO_IMAGE_URL || null,
    'CERTIFICADO_TEMPLATE': process.env.CERTIFICADO_IMAGE_URL || null,
    'SSMA': process.env.SSMA_IMAGE_URL || null,
    'CIPA': process.env.CIPA_IMAGE_URL || null,
    'PCMSO': process.env.PCMSO_IMAGE_URL || null,
    'LEI': process.env.LEI_IMAGE_URL || null,
    'NR 06': process.env.NR06_IMAGE_URL || null,
    'SST': process.env.SST_IMAGE_URL || null,
    'MAPARISCO': process.env.MAPARISCO_IMAGE_URL || null
};

class ImageManager {
    constructor() {
        this.imageCache = new Map();
        this.cacheDir = path.join(__dirname, 'cache', 'images');
        this.ensureCacheDir();
    }

    ensureCacheDir() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    async getImage(imageKey, imageUrl = null) {
        // Primeiro, tentar cache local na pasta do treinamento
        const localPath = path.join(__dirname, 'Treinamentos', 'LCM', 'Imagens', `${imageKey}.png`);
        if (fs.existsSync(localPath)) {
            return localPath;
        }
        
        // Tentar na pasta Imagens direta
        const directPath = path.join(__dirname, 'Imagens', `${imageKey}.png`);
        if (fs.existsSync(directPath)) {
            return directPath;
        }

        // Usar URL do ambiente ou parâmetro
        const url = imageUrl || IMAGE_URLS[imageKey];
        if (url) {
            const cachedPath = path.join(this.cacheDir, `${imageKey}.png`);
            
            // Verificar se já está no cache
            if (fs.existsSync(cachedPath)) {
                return cachedPath;
            }

            // Baixar imagem
            try {
                await this.downloadImage(url, cachedPath);
                return cachedPath;
            } catch (error) {
                console.error(`❌ Erro ao baixar imagem ${imageKey}:`, error);
                return null;
            }
        }

        console.warn(`⚠️ Imagem não encontrada: ${imageKey}`);
        return null;
    }

    downloadImage(url, filepath) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            
            client.get(url, (response) => {
                if (response.statusCode === 200) {
                    const file = fs.createWriteStream(filepath);
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`✅ Imagem baixada: ${filepath}`);
                        resolve();
                    });
                } else {
                    reject(new Error(`HTTP ${response.statusCode}`));
                }
            }).on('error', reject);
        });
    }

    clearCache() {
        if (fs.existsSync(this.cacheDir)) {
            fs.rmSync(this.cacheDir, { recursive: true, force: true });
            this.ensureCacheDir();
            console.log('🧹 Cache de imagens limpo');
        }
    }
}

module.exports = new ImageManager();