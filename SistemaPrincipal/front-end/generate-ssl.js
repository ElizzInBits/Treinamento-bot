#!/usr/bin/env node

const SSLConfig = require('./ssl-config');
const fs = require('fs');
const path = require('path');

// Script para gerar certificados SSL
async function generateSSLCertificates() {
    console.log('🔐 Iniciando geração de certificados SSL...\n');
    
    const sslConfig = new SSLConfig();
    
    // Verificar se já existem certificados
    if (sslConfig.certificatesExist()) {
        console.log('⚠️  Certificados SSL já existem!');
        console.log('📁 Localização:', path.join(__dirname, 'ssl'));
        
        const validation = sslConfig.validateCertificates();
        if (validation.valid) {
            console.log('✅ Certificados existentes são válidos');
            return;
        } else {
            console.log('❌ Certificados existentes são inválidos:', validation.error);
            console.log('🔄 Gerando novos certificados...\n');
        }
    }
    
    // Tentar gerar certificados auto-assinados
    console.log('🔧 Gerando certificados auto-assinados para desenvolvimento...');
    
    const success = sslConfig.generateSelfSigned();
    
    if (success) {
        console.log('\n✅ Certificados SSL gerados com sucesso!');
        console.log('📋 Próximos passos:');
        console.log('   1. Execute: npm start');
        console.log('   2. Acesse: https://localhost:3000');
        console.log('   3. Aceite o aviso de segurança do navegador (certificado auto-assinado)');
        console.log('\n🔒 Para produção, configure Let\'s Encrypt com um domínio válido');
    } else {
        console.log('\n❌ Falha ao gerar certificados SSL');
        console.log('💡 Alternativas:');
        console.log('   1. Instale OpenSSL: https://slproweb.com/products/Win32OpenSSL.html');
        console.log('   2. Use certificados existentes na pasta ssl/');
        console.log('   3. Configure um proxy reverso (nginx/apache) com SSL');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    generateSSLCertificates().catch(console.error);
}

module.exports = generateSSLCertificates;