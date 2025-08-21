const fs = require('fs');
const path = require('path');

function limparSessoes() {
    const tokensPath = path.join(__dirname, 'SistemaPrincipal', 'TemplatesMensagens', 'tokens');
    
    console.log('🧹 Limpando sessões existentes...');
    
    try {
        if (fs.existsSync(tokensPath)) {
            // Remover toda a pasta tokens
            fs.rmSync(tokensPath, { recursive: true, force: true });
            console.log('✅ Pasta tokens removida');
        }
        
        console.log('✅ Todas as sessões foram limpas!');
        console.log('🔄 Agora reinicie o bot para conectar uma nova sessão');
        
    } catch (error) {
        console.error('❌ Erro ao limpar sessões:', error);
    }
}

limparSessoes();