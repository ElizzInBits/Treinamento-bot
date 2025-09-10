#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupProductionSSL() {
    console.log('🔒 CONFIGURAÇÃO SSL PARA PRODUÇÃO');
    console.log('==================================\n');

    try {
        // Coletar informações
        const domain = await question('🌐 Digite seu domínio (ex: meusite.com): ');
        const email = await question('📧 Digite seu email para Let\'s Encrypt: ');
        const usePort443 = await question('🔌 Usar porta 443 padrão? (s/n): ');

        const httpsPort = usePort443.toLowerCase() === 's' ? 443 : 3443;
        const httpPort = usePort443.toLowerCase() === 's' ? 80 : 3000;

        console.log('\n📝 Configurações:');
        console.log(`   Domínio: ${domain}`);
        console.log(`   Email: ${email}`);
        console.log(`   Porta HTTPS: ${httpsPort}`);
        console.log(`   Porta HTTP: ${httpPort}`);

        const confirm = await question('\n✅ Confirmar configurações? (s/n): ');
        if (confirm.toLowerCase() !== 's') {
            console.log('❌ Configuração cancelada');
            rl.close();
            return;
        }

        // Atualizar .env
        console.log('\n🔧 Atualizando arquivo .env...');
        
        let envContent = fs.readFileSync('.env', 'utf8');
        
        // Atualizar configurações
        envContent = envContent.replace(/SSL_ENABLED=.*/g, 'SSL_ENABLED=true');
        envContent = envContent.replace(/HTTPS_PORT=.*/g, `HTTPS_PORT=${httpsPort}`);
        envContent = envContent.replace(/PORT=.*/g, `PORT=${httpPort}`);
        envContent = envContent.replace(/FRONTEND_URL=.*/g, `FRONTEND_URL=https://${domain}${httpsPort === 443 ? '' : ':' + httpsPort}`);

        fs.writeFileSync('.env', envContent);
        console.log('✅ Arquivo .env atualizado');

        // Instruções para Let's Encrypt
        console.log('\n🔐 PRÓXIMOS PASSOS PARA LET\'S ENCRYPT:');
        console.log('=====================================');
        console.log('\n1. Instalar Certbot:');
        console.log('   Ubuntu/Debian: sudo apt install certbot');
        console.log('   CentOS/RHEL: sudo yum install certbot');
        console.log('   Windows: https://certbot.eff.org/instructions');

        console.log('\n2. Parar o servidor atual (se rodando)');

        console.log('\n3. Gerar certificado:');
        console.log(`   sudo certbot certonly --standalone -d ${domain} --email ${email} --agree-tos`);

        console.log('\n4. Copiar certificados:');
        console.log(`   sudo cp /etc/letsencrypt/live/${domain}/fullchain.pem ssl/cert.pem`);
        console.log(`   sudo cp /etc/letsencrypt/live/${domain}/privkey.pem ssl/key.pem`);
        console.log('   sudo chown $USER:$USER ssl/*.pem');

        console.log('\n5. Configurar renovação automática:');
        console.log('   sudo crontab -e');
        console.log('   Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet');

        console.log('\n6. Configurar firewall:');
        console.log(`   sudo ufw allow ${httpPort}`);
        console.log(`   sudo ufw allow ${httpsPort}`);

        console.log('\n7. Iniciar servidor:');
        console.log('   npm run ssl:start');

        console.log('\n8. Testar:');
        console.log(`   https://${domain}${httpsPort === 443 ? '' : ':' + httpsPort}`);

        // Criar script de renovação
        const renewScript = `#!/bin/bash
# Script de renovação SSL para ${domain}

echo "🔄 Renovando certificados SSL..."

# Parar servidor
pm2 stop all 2>/dev/null || pkill -f "node.*server-front.js"

# Renovar certificado
certbot renew --quiet

# Copiar certificados
cp /etc/letsencrypt/live/${domain}/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/${domain}/privkey.pem ssl/key.pem
chown $USER:$USER ssl/*.pem

# Reiniciar servidor
npm run ssl:start

echo "✅ Renovação concluída!"
`;

        fs.writeFileSync('renew-ssl.sh', renewScript);
        console.log('\n📄 Script de renovação criado: renew-ssl.sh');

        console.log('\n🎯 CONFIGURAÇÃO CONCLUÍDA!');
        console.log('Siga os passos acima para ativar SSL em produção.');

    } catch (error) {
        console.error('❌ Erro na configuração:', error.message);
    } finally {
        rl.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    setupProductionSSL().catch(console.error);
}

module.exports = setupProductionSSL;