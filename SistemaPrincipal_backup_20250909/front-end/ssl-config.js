const fs = require('fs');
const path = require('path');
const https = require('https');

class SSLConfig {
    constructor() {
        this.sslDir = path.join(__dirname, 'ssl');
        this.certPath = path.join(this.sslDir, 'cert.pem');
        this.keyPath = path.join(this.sslDir, 'key.pem');
    }

    // Verificar se os certificados existem
    certificatesExist() {
        return fs.existsSync(this.certPath) && fs.existsSync(this.keyPath);
    }

    // Obter opções SSL para o servidor HTTPS
    getSSLOptions() {
        if (!this.certificatesExist()) {
            throw new Error('Certificados SSL não encontrados. Execute generateSelfSigned() primeiro.');
        }

        return {
            key: fs.readFileSync(this.keyPath),
            cert: fs.readFileSync(this.certPath)
        };
    }

    // Gerar certificados auto-assinados para desenvolvimento
    generateSelfSigned() {
        const { execSync } = require('child_process');
        
        // Criar diretório SSL se não existir
        if (!fs.existsSync(this.sslDir)) {
            fs.mkdirSync(this.sslDir, { recursive: true });
        }

        try {
            // Gerar chave privada e certificado auto-assinado
            const command = `openssl req -x509 -newkey rsa:4096 -keyout "${this.keyPath}" -out "${this.certPath}" -days 365 -nodes -subj "/C=BR/ST=Estado/L=Cidade/O=Treinamento-Bot/CN=localhost"`;
            
            execSync(command, { stdio: 'inherit' });
            console.log('✅ Certificados SSL auto-assinados gerados com sucesso!');
            console.log(`📁 Certificados salvos em: ${this.sslDir}`);
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao gerar certificados SSL:', error.message);
            console.log('💡 Certifique-se de que o OpenSSL está instalado no sistema');
            return false;
        }
    }

    // Configurar Let's Encrypt (para produção)
    setupLetsEncrypt(domain, email) {
        console.log('🔧 Configurando Let\'s Encrypt...');
        console.log('📝 Para produção, use certbot:');
        console.log(`   certbot certonly --standalone -d ${domain} --email ${email} --agree-tos`);
        console.log('📁 Certificados ficam em: /etc/letsencrypt/live/' + domain + '/');
    }

    // Validar certificados
    validateCertificates() {
        if (!this.certificatesExist()) {
            return { valid: false, error: 'Certificados não encontrados' };
        }

        try {
            const cert = fs.readFileSync(this.certPath, 'utf8');
            const key = fs.readFileSync(this.keyPath, 'utf8');
            
            // Verificações básicas
            if (!cert.includes('BEGIN CERTIFICATE') || !key.includes('BEGIN PRIVATE KEY')) {
                return { valid: false, error: 'Formato de certificado inválido' };
            }

            return { valid: true, message: 'Certificados válidos' };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = SSLConfig;