const { sendMessage } = require('./SistemaPrincipal/TemplatesMensagens/sendMessage-api');

async function testSimple() {
    console.log('🧪 Teste simples do sistema original...');
    
    const testPhone = '5511999999999'; // ALTERE AQUI
    
    try {
        const result = await sendMessage(testPhone, 'send-message', {
            message: '🤖 Teste do sistema - ' + new Date().toLocaleString()
        });
        
        console.log('Resultado:', result ? '✅ SUCESSO' : '❌ FALHOU');
        if (result) {
            console.log('Resposta:', JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testSimple();