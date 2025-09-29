// ==================== CONFIGURAÇÕES DE VÍDEO ====================

const VIDEO_CONFIG = {
    // Limite do WhatsApp em MB
    MAX_SIZE_MB: 16,
    
    // Configurações de compressão
    COMPRESSION: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        size: '720x?',
        videoBitrate: '800k',
        audioBitrate: '128k',
        format: 'mp4'
    },
    
    // Configurações alternativas para vídeos muito grandes
    HEAVY_COMPRESSION: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        size: '480x?',
        videoBitrate: '500k',
        audioBitrate: '96k',
        format: 'mp4'
    }
};

module.exports = VIDEO_CONFIG;