const http = require('http');
const app = require('./app');
const notificationSocket = require('./realtime/notification.socket');

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const startServer = (port) => {
  const server = http.createServer(app);
  notificationSocket.init(server);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    console.error('❌ Server failed to start:', error);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📍 URL: http://localhost:${port}`);
    console.log(`🏥 Health check: http://localhost:${port}/api/health`);
    console.log(`📚 Swagger UI:   http://localhost:${port}/api-docs`);
    console.log(`🔌 WebSocket:    ws://localhost:${port}`);
  });
};

startServer(DEFAULT_PORT);
