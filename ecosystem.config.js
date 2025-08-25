module.exports = {
  apps: [
    {
      name: 'wppconnect-server',
      script: './dist/server.js',
      cwd: './wppconnect-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        PORT: 21465
      }
    },
    {
      name: 'whatsapp-bot',
      script: './SistemaPrincipal/TemplatesMensagens/start-template.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'frontend',
      script: './SistemaPrincipal/front-end/server-front.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        PORT: 3000
      }
    }
  ]
};

