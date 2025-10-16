module.exports = {
  apps: [
    {
      name: 'wppconnect-server',
      cwd: './wppconnect-server',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 21465
      },
      error_file: './SistemaPrincipal/logs/wppconnect-error.log',
      out_file: './SistemaPrincipal/logs/wppconnect-out.log',
      log_file: './SistemaPrincipal/logs/wppconnect-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      max_restarts: 10,
      restart_delay: 3000,
      autorestart: true
    },
    {
      name: 'whatsapp-bot',
      cwd: './SistemaPrincipal/TemplatesMensagens',
      script: 'start-direct.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/whatsapp-bot-error.log',
      out_file: './logs/whatsapp-bot-out.log',
      log_file: './logs/whatsapp-bot-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      max_restarts: 10,
      restart_delay: 3000,
      autorestart: true,
      watch: false
    },
    {
      name: 'frontend',
      cwd: './SistemaPrincipal',
      script: 'front-end/server-front.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HTTPS_PORT: 3443,
        SSL_ENABLED: false,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_NAME: 'your_database_name',
        DB_USER: 'your_db_user',
        DB_PASS: 'your_secure_password',
        ADMIN_USERNAME: 'your_admin_username',
        ADMIN_PASSWORD: 'your_admin_password',
        JWT_SECRET: 'your-jwt-secret-key',
        FRONTEND_URL: 'http://your-server-ip:3000',
        API_URL: 'http://your-server-ip:3000/api'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      max_restarts: 10,
      restart_delay: 3000,
      autorestart: true
    }
  ]
};