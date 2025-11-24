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
      log_type: 'raw',
      merge_logs: true,
      log_date_format: 'HH:mm:ss',
      time: false,
      max_restarts: 10,
      restart_delay: 3000,
      autorestart: true
    },
    {
      name: 'whatsapp-bot',
      cwd: './SistemaPrincipal/TemplatesMensagens',
      script: 'Template2.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/whatsapp-bot-error.log',
      out_file: './logs/whatsapp-bot-out.log',
      log_file: './logs/whatsapp-bot-combined.log',
      log_type: 'raw',
      merge_logs: true,
      log_date_format: 'HH:mm:ss',
      time: false,
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
      env_file: './.env',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      log_type: 'raw',
      merge_logs: true,
      log_date_format: 'HH:mm:ss',
      time: false,
      max_restarts: 10,
      restart_delay: 3000,
      autorestart: true
    },
    {
      name: 'gestao-empresa',
      cwd: '../sistema-gestao-empresa',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env_file: './.env',
      env: {
        NODE_ENV: 'production',
        GESTAO_PORT: 3001
      },
      error_file: '../Treinamento-bot/SistemaPrincipal/logs/gestao-error.log',
      out_file: '../Treinamento-bot/SistemaPrincipal/logs/gestao-out.log',
      log_file: '../Treinamento-bot/SistemaPrincipal/logs/gestao-combined.log',
      log_type: 'raw',
      merge_logs: true,
      log_date_format: 'HH:mm:ss',
      time: false,
      max_restarts: 10,
      restart_delay: 3000,
      autorestart: true
    }
  ]
};