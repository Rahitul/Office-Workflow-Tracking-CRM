module.exports = {
  apps: [
    {
      name: 'iomdaily',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: 'H:\\iomdaily',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
        HOST: '0.0.0.0',
        MONGODB_URI: 'mongodb://localhost:27017/iomdaily',
        JWT_SECRET: '8843895df3ad794adca6db2a8f89ccd64a5a2c42f233da8c5227d8d2fcfeba2c',
        JWT_REFRESH_SECRET: '80bcbc92b5688952ce6aa5361b0d29756abd91ca07c026cb9a2fcea4670af888'
      },
      error_file: 'H:\\iomdaily\\logs\\error.log',
      out_file: 'H:\\iomdaily\\logs\\combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
}