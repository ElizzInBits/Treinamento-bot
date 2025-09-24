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
      error_file: './logs/wppconnect-error.log',
      out_file: './logs/wppconnect-out.log',
      log_file: './logs/wppconnect-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      max_restarts: 3,
      restart_delay: 5000
    },
    {
      name: 'whatsapp-bot',
      cwd: './SistemaPrincipal/TemplatesMensagens',
      script: 'node',
      args: 'start-direct.js',
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
      max_restarts: 3,
      restart_delay: 5000,
      watch: false
    },
    {
      name: 'frontend',
      cwd: './SistemaPrincipal',
      script: 'node',
      args: 'quick-start.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      max_restarts: 3,
      restart_delay: 5000
    },
    {
      name: 'multi-sessions',
      cwd: './',
      script: 'node',
      args: 'start-multi-sessions.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/multi-sessions-error.log',
      out_file: './logs/multi-sessions-out.log',
      log_file: './logs/multi-sessions-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      max_restarts: 5,
      restart_delay: 10000,
      watch: false
    }
  ]
};