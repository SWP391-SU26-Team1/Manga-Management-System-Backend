const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const userRoom = (userId) => `user:${userId}`;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Access token required'));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new Error('Invalid or expired token'));
      socket.user = user;
      next();
    });
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
