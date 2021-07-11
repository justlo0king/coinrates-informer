import { strict as assert } from 'assert';
import io from 'socket.io-client';
import app from '../../src/app';
import getConnectionManager from './../../src/modules/connections';

const port = app.get('port') || 8998;

describe('Module tests: connections', () => {
  let server;
  let socket;
  let connectionManager;
  let connectionId;
  const testUserID = 'someUser';

  before(function(done) {
    server = app.listen(port);
    server.once('listening', () => done());
    connectionManager = getConnectionManager(app);
  });

  after(function(done) {
    if (socket) {
      socket.close();
    }
    server.close(done);
  });

  it('connection is registered in service', () => {
    const connectionUri = `${app.get('protocol')}://${app.get('host')}:${port}`;

    return (new Promise(function(resolve, reject) {
      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 3000);

      socket = io(connectionUri, {
        transports: ['websocket']
      });
      socket.on('connect', function() {
        socket.emit('handshake', { userId: testUserID });
      });
      socket.on('handshake_result', function(data) {
        const { connection } = data || {};
        connectionId = connection && connection.id;
        assert.ok(connectionId);
        //app.debug('test:', 'connection id: ', connectionId);
        connectionManager.getTotalConnections({}, (error, total) => {
          if (error) {
            throw error;
          }
          //app.debug('test:', 'total connections: ', total);
          assert.equal(total, 1);
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          resolve();
        });
      });
    }));
  });

  it('client cannot patch records except sending command', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        return reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          return reject();
        }
      }, 2000);

      return socket.emit('patch', 'connections', null, {
        someData: true
      }, {
        query: { userId: testUserID }
      }, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Not allowed data');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          return resolve();
        }
      });
    }));
  });

  it('client cannot create connection records', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        return reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          return reject();
        }
      }, 2000);

      return socket.emit('create', 'connections', {
        id: '12345', userId: '54321'
      }, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Permission denied');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          return resolve();
        }
      });
    }));
  });


  it('client cannot remove connection records', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        return reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 2000);

      return socket.emit('remove', 'connections', connectionId, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Permission denied');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          return resolve();
        }
      });
    }));
  });


  it('client cannot find connection records', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        return reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          return reject();
        }
      }, 2000);

      return socket.emit('find', 'connections', {}, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Permission denied');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          return resolve();
        }
      });
    }));
  });


  it('client cannot get connection record', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        return reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          return reject();
        }
      }, 2000);

      return socket.emit('get', 'connections', connectionId, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Permission denied');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          return resolve();
        }
      });
    }));
  });

  it('client gets error when sending dummy commands', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        return reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          return reject();
        }
      }, 2000);

      return socket.emit('patch', 'connections', connectionId, {
        command: { name: 'dummy' }
      }, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Command not recognized');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          return resolve();
        }
      });
    }));
  });


  it('closes socket connection', () => {
    if (!socket || !socket.connected) {
      throw new Error('socket is not connected');
    }

    if (socket) {
      socket.close();
    }
    assert.notEqual(socket.connected, true);
  });

  it('record is removed when socket disconnected', () => {
    let isResolved = false;
    let rejectTimeout = setTimeout(function() {
      if (!isResolved) {
        throw new Error('Failed to remove record');
      }
    }, 2000);

    return (new Promise(function(resolve, reject) {
      // delaying checking total to get updated results
      return setTimeout(() => {
        connectionManager.getTotalConnections({}, (error, total) => {
          if (error) {
            return reject(error);
          }
          assert.equal(total, 0);
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          return resolve();
        });
      });
    }));
  });
});