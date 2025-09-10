const imageManager = require('./imageManager');

async function testarImagens() {
    const imagens = ['SEGURANCA', 'SSMA', 'CIPA', 'PCMSO', 'LEI', 'NR 06', 'SST', 'MAPARISCO'];
    
    console.log('🔍 Testando imagens...\n');
    
    for (const imagem of imagens) {
        try {
            const path = await imageManager.getImage(imagem);
            console.log(`${imagem}: ${path ? '✅ Encontrada' : '❌ Não encontrada'}`);
        } catch (error) {
            console.log(`${imagem}: ❌ Erro - ${error.message}`);
        }
    }
}

testarImagens();