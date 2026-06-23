const http = require('http');
const app = require('./app');
const notificationSocket = require('./realtime/notification.socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
notificationSocket.init(server);

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Swagger UI:   http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket:    ws://localhost:${PORT}`);
});
