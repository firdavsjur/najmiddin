module.exports = {
    apps: [
    {
    name: 'app',
    script: 'dist/index.js' /* yoki sizning entry point */,
    instances: process.env.WEB_CONCURRENCY || 1,
    exec_mode: 'cluster',
    env: {
    NODE_ENV: 'production'
    }
    },
    ]
    };