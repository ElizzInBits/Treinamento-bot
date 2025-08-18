module.exports = {
  apps: [

    {
      name: 'whatsapp-bot',
      script: './SistemaPrincipal/TemplatesMensagens/start-template.js',
      cwd: './SistemaPrincipal/TemplatesMensagens',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'frontend',
      script: './SistemaPrincipal/front-end/server-front.js',
      cwd: './SistemaPrincipal/front-end',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};