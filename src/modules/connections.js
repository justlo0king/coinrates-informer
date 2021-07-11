export default function connectionManager(app) {

  const handshake = function(params, callback) {
    const { connectionId, payload } = params || {};
    const { userId } = payload || {};
    if (!connectionId || typeof connectionId !== 'string') {
      app.error('connectionManager.handshake: socketId not a string');
      return callback('Parameters error');
    }
    if (userId === undefined) {
      app.error('connectionManager.handshake: userId not in payload');
      return callback();
    }
    if (typeof userId !== 'string' && typeof userId !== 'number') {
      app.error('connectionManager.handshake: userId type is not string or number');
      return callback('userId can be string or number');
    }
    const userIdString = String(userId).trim();
    if (!userIdString) {
      app.error('connectionManager.handshake: userId is empty');
      return callback('userId should not be empty');
    }

    app.service('connections').create({
      id: connectionId,
      userId
    }).then((result) => {
      app.debug('connectionManager.handshake: created record: ', result);
      return callback(null, result);
    }).catch((error) => {
      app.error('connectionManager.handshake: failed to create record, error: ',  error);
      return callback(error);
    });
  };

  const disconnect = function(params, callback) {
    callback = typeof callback == 'function' ? callback : function() {};
    const { connectionId } = params || {};
    if (!connectionId || typeof connectionId !== 'string') {
      app.error('connectionManager.disconnect: socketId not a string');
      return callback('Parameters error');
    }
    app.service('connections').remove(connectionId).then((result) => {
      return callback(null, result);
    }).catch((error) => {
      app.error('connectionManager.disconnect: failed to remove record, error: ', error);
      return callback(error);
    });
  };

  const getTotalConnections = function(params, callback) {
    const { query={} } = params || {};
    if (typeof query !== 'object') {
      app.error('connectionManager.getTotalConnections: query is not an object: ', query);
      return callback('Parameters error');
    }
    query.$limit = 1;

    app.service('connections').find({
      query
    }).then((result) => {
      const total = result && result.total || 0;
      //app.debug('connectionManager.getTotalConnections: total: ', total);
      return callback(null, total);
    }).catch((error) => {
      app.error('connectionManager.getTotalConnections: failed to find records, error: ',  error);
      return callback(error);
    });
  };

  return Object.freeze({
    getTotalConnections,
    handshake,
    disconnect
  });
}