#!/usr/bin/env node

const https = require('https');
const http = require('http');
const SSLConfig = require('./ssl-config');

class SSLTester {
    constructor() {
        this.sslConfig = new SSLConfig();
        this.port = process.env.PORT || 3000;
        this.httpsPort = process.env.HTTPS_PORT || 3443;
        this.host = 'localhost';
    }

    // Testar certificados SSL
    async testCertificates() {
        console.log('🔍 Testando certificados SSL...\n');
        
        const validation = this.sslConfig.validateCertificates();
        
        if (validation.valid) {
            console.log('✅ Certificados SSL válidos');
            return true;
        } else {
            console.log('❌ Certificados SSL inválidos:', validation.error);
            return false;
        }
    }

    // Testar conexão HTTPS
    async testHTTPS() {
        return new Promise((resolve) => {
            console.log(`🔒 Testando conexão HTTPS em https://${this.host}:${this.httpsPort}...`);
            
            const options = {
                hostname: this.host,
                port: this.httpsPort,
                path: '/test',
                method: 'GET',
                rejectUnauthorized: false // Aceitar certificados auto-assinados
            };

            const req = https.request(options, (res) => {
                console.log(`✅ HTTPS Status: ${res.statusCode}`);
                console.log(`🔐 Protocolo: ${res.socket.getProtocol()}`);
                
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        console.log('📊 Resposta:', json.message);
                        resolve(true);
                    } catch (e) {
                        console.log('📊 Resposta recebida (não JSON)');
                        resolve(true);
                    }
                });
            });

            req.on('error', (error) => {
                console.log('❌ Erro HTTPS:', error.message);
                resolve(false);
            });

            req.setTimeout(5000, () => {
                console.log('⏰ Timeout na conexão HTTPS');
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    // Testar redirecionamento HTTP → HTTPS
    async testRedirect() {
        return new Promise((resolve) => {
            console.log(`🔄 Testando redirecionamento HTTP → HTTPS em http://${this.host}:${this.port}...`);
            
            const options = {
                hostname: this.host,
                port: this.port,
                path: '/test',
                method: 'GET'
            };

            const req = http.request(options, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    const location = res.headers.location;
                    console.log(`✅ Redirecionamento funcionando: ${res.statusCode} → ${location}`);
                    resolve(true);
                } else {
                    console.log(`⚠️  Sem redirecionamento: Status ${res.statusCode}`);
                    resolve(false);
                }
            });

            req.on('error', (error) => {
                console.log('❌ Erro HTTP:', error.message);
                resolve(false);
            });

            req.setTimeout(5000, () => {
                console.log('⏰ Timeout na conexão HTTP');
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    // Executar todos os testes
    async runAllTests() {
        console.log('🧪 TESTE SSL - TREINAMENTO BOT');
        console.log('================================\n');

        const results = {
            certificates: false,
            https: false,
            redirect: false
        };

        // Teste 1: Certificados
        results.certificates = await this.testCertificates();
        console.log();

        // Teste 2: HTTPS (apenas se certificados válidos)
        if (results.certificates) {
            results.https = await this.testHTTPS();
            console.log();

            // Teste 3: Redirecionamento
            results.redirect = await this.testRedirect();
            console.log();
        } else {
            console.log('⏭️  Pulando testes de conexão (certificados inválidos)\n');
        }

        // Resumo
        console.log('📋 RESUMO DOS TESTES');
        console.log('====================');
        console.log(`🔐 Certificados SSL: ${results.certificates ? '✅ OK' : '❌ FALHOU'}`);
        console.log(`🔒 Conexão HTTPS: ${results.https ? '✅ OK' : '❌ FALHOU'}`);
        console.log(`🔄 Redirecionamento: ${results.redirect ? '✅ OK' : '❌ FALHOU'}`);

        const allPassed = results.certificates && results.https && results.redirect;
        console.log(`\n🎯 Resultado Geral: ${allPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM'}`);

        if (!allPassed) {
            console.log('\n💡 Dicas para resolver problemas:');
            if (!results.certificates) {
                console.log('   • Execute: npm run ssl:generate');
            }
            if (!results.https || !results.redirect) {
                console.log('   • Verifique se o servidor está rodando com SSL');
                console.log('   • Execute: npm run ssl:start');
            }
        }

        return allPassed;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const tester = new SSLTester();
    tester.runAllTests().catch(console.error);
}

module.exports = SSLTester;