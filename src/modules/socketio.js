import connectionManager from './connections';

/**
 * middleware to work on socket.io connections
 * adds event listeners to socket.io instance and sockets
 * @param {*} app - feathers app
 * @returns void
 */
export default function appSocketIO(app) {
  let io;
  const { disconnect, handshake } = connectionManager(app);
  return function(_io) {
    io = _io;
    app.debug('app.socketio: init');

    io.on('error', function(error) {
      app.error('app.socketio: error: ', error);
    });

    io.on('connection', function(socket) {
      app.debug('app.socketio: connection: ', socket.id);

      // subscribing to handshake event
      socket.on('handshake', function (payload) {
        app.debug('app.socketio: handshake data: ', payload);
        // passing handshake data to connection manager
        handshake({
          connectionId: socket.id,
          payload
        }, (error, connection) => {
          let payload = {};
          if (error) {
            payload = { error: error.message || error };
          } else {
            payload = { connection };
          }
          socket.emit('connection', payload);
        });
      });

      // subscribing to disconnect event
      socket.on('disconnect', function(reason) {
        const connectionId = socket && socket.id || '';
        app.debug(`app.socketio: disconnected id: ${connectionId}, reason: `, reason);
        disconnect({ connectionId });
      });
    });

    io.use(function (socket, next) {
      // exposing socketId property to services and hooks
      socket.feathers.socketId = socket.id;
      next();
    });
  };
}