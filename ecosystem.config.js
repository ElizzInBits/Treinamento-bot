module.exports = {
  apps: [
    {
      name: 'treinamento-bot-unificado',
      script: './server-unificado.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      node_args: '--max-old-space-size=2048',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        UV_THREADPOOL_SIZE: 16
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true
    }
  ]
};

