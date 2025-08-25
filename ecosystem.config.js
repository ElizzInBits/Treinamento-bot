module.exports = {
  apps: [
    {
      name: 'frontend',
      script: './SistemaPrincipal/front-end/server-front.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log'
    },
    {
      name: 'whatsapp-bot',
      script: './SistemaPrincipal/TemplatesMensagens/start-template.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=1024',
      env: {
        NODE_ENV: 'production',
        UV_THREADPOOL_SIZE: 8
      },
      error_file: './logs/bot-err.log',
      out_file: './logs/bot-out.log'
    },
    {
      name: 'wppconnect-server',
      script: './wppconnect-server/dist/server.js',
      cwd: './wppconnect-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 21465
      },
      error_file: '../logs/wpp-err.log',
      out_file: '../logs/wpp-out.log'
    }
  ]
};

