module.exports = {
  apps: [
    {
      name: 'servidor-unificado',
      script: './server-unificado.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        PORT: 3000
      }
    }
  ]
};