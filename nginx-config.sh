#!/bin/bash

# Script para configurar Nginx como proxy reverso no servidor
# Execute este script no seu servidor Linux

echo "🔧 Configurando Nginx para proxy reverso..."

# 1. Instalar Nginx se não estiver instalado
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# 2. Criar configuração do site
sudo tee /etc/nginx/sites-available/salubrita-bot > /dev/null <<EOF
server {
    listen 80;
    server_name salubrita-bot.ddns.net;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name salubrita-bot.ddns.net;

    # Certificados SSL (usar os do Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/salubrita-bot.ddns.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/salubrita-bot.ddns.net/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Proxy reverso para aplicação Node.js
    location / {
        proxy_pass https://127.0.0.1:3443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_ssl_verify off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# 3. Habilitar o site
sudo ln -sf /etc/nginx/sites-available/salubrita-bot /etc/nginx/sites-enabled/

# 4. Remover configuração padrão se existir
sudo rm -f /etc/nginx/sites-enabled/default

# 5. Testar configuração
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida!"
    
    # 6. Reiniciar Nginx
    echo "🔄 Reiniciando Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    echo "✅ Nginx configurado com sucesso!"
    echo "🌐 Agora você pode acessar: https://salubrita-bot.ddns.net"
    echo "🔗 Sem precisar especificar a porta!"
else
    echo "❌ Erro na configuração do Nginx"
    exit 1
fi