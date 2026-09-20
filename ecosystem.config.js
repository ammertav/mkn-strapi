module.exports = {
  apps: [
    {
      name: 'mkn-strapi',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
