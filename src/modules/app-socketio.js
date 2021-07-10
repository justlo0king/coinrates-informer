

export default function appSocketIO(app) {
  let io;
  return function(_io) {
    io = _io;
    app.debug('app.socketio: init');
    io.on('connection', function(socket) {
      app.debug('connection: ', socket.id);
      //socket.emit('handshake', { text: 'A client connected!' });
      socket.on('handshake', function (data) {
        app.debug('handshake data: ', data);
      });
      socket.on('data', function (data) {
        app.debug('data: ', data);
      });
      socket.on('event', function (data) {
        app.debug('event data: ', data);
      });
      socket.on('create', function (data) {
        app.debug('create data: ', data);
      });
    });
  };
}