export default function(app) {
  if(typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }

  app.on('connection', (connection) => {
    const { socketId } = connection || {};
    if (!socketId || typeof socketId !== 'string') {
      app.error('channels: socketId not in connection payload: ', connection);
      return;
    }
  });
}
