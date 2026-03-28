module.exports = {
  backend: {
    entry: './backend/hono.ts',
    port: 8081,
    mount: '/api'
  }
};