const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt.helper');

let io = null;

const userRoom = (userId) => `user:${userId}`;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Access token required'));

    try {
      socket.user = verifyAccessToken(token);
      next();
    } catch (err) {
      return next(new Error(err.message || 'Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.user.user_id));

    socket.on('disconnect', () => {
      socket.leave(userRoom(socket.user.user_id));
    });
  });

  return io;
};

// Gọi sau khi 1 notification mới được tạo trong DB, để push real-time tới đúng user đó.
const emitNewNotification = (userId, notification) => {
  if (!io) return;
  io.to(userRoom(userId)).emit('notification:new', notification);
};

module.exports = { init, emitNewNotification };
