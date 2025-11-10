module.exports = {
  apps: [{
    name: 'kurir-kan-bot',
    script: './app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    cron_restart: '0 3 * * *', // Restart setiap jam 3 pagi
  }],

  // Cron jobs
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/var/www/kurir-kan-bot',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js'
    }
  }
};