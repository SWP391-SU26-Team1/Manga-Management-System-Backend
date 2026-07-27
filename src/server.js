const dns = require('dns');
// Fix Railway IPv6 routing issue for external connections (like Nodemailer)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const http = require('http');
const app = require('./app');
const notificationSocket = require('./realtime/notification.socket');

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const startServer = (port) => {
  const server = http.createServer(app);
  notificationSocket.init(server);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is busy, retrying in 500ms...`);
      setTimeout(() => {
        try {
          server.close();
        } catch (e) {}
        startServer(port);
      }, 500);
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

// Graceful shutdown
process.once('SIGUSR2', () => {
  console.log('Nodemon restarting, exiting child process...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, exiting...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, exiting...');
  process.exit(0);
});
