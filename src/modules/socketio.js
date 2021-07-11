import connectionManager from './connections';

/**
 * Middleware to work with socket.io connections
 * adds event listeners to socket.io instance and sockets
 * @param {*} app - feathers app
 * @returns void
 */
export default function appSocketIO(app) {
  let io;
  const socketsById = new Map();

  /**
   * method to send data to sockets,
   * will be passed as parameter to connection manager
   * @param {String} socketId - unique connection identifier
   * @param {String} event    - method to emit
   * @param {Object} data     - data to send
   */
  const sendToConnection = function(socketId, event, data) {
    const socket = socketsById.get(socketId);
    if (socket) {
      socket.emit(event, data);
    } else {
      app.error('app.socketio.send: socket not found by id: ', socketId);
    }
  };

  // initializing connection manager singleton
  const { disconnect, handshake } = connectionManager(app, {
    send: sendToConnection
  });

  return function(_io) {
    io = _io;

    io.on('error', function(error) {
      app.error('app.socketio: error: ', error);
    });

    io.on('connection', function(socket) {
      // subscribing to handshake event
      socket.on('handshake', function (payload) {
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
            socketsById.set(socket.id, socket);
          }

          socket.emit('handshake_result', payload);
        });
      });

      // subscribing to disconnect event
      socket.on('disconnect', function() {
        const connectionId = socket && socket.id || '';
        socketsById.delete(socket.id);
        //app.debug(`app.socketio: disconnected id: ${connectionId}, reason: `, reason);
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