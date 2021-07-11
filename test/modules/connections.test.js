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

  it('registers connection in service', () => {
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

  it('cannot patch records except sending command', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 2000);

      socket.emit('patch', 'connections', null, {
        read: true
      }, {
        query: { userId: testUserID }
      }, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Not allowed data');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          resolve();
        }
      });
    }));
  });

  it('cannot remove connection record', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 2000);

      socket.emit('remove', 'connections', connectionId, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Permission denied');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          resolve();
        }
      });
    }));
  });

  it('cannot find connection records', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 2000);

      socket.emit('find', 'connections', {}, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Permission denied');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          resolve();
        }
      });
    }));
  });


  it('cannot get connection record', () => {
    return (new Promise(function(resolve, reject) {
      if (!socket || !socket.connected) {
        reject('socket is not connected');
      }

      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 2000);

      socket.emit('get', 'connections', connectionId, (error) => {
        if (error) {
          assert.equal(error && error.message, 'Permission denied');
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          resolve();
        }
      });
    }));
  });


  it('removes record from service when disconnected', () => {
    if (!socket || !socket.connected) {
      throw new Error('socket is not connected');
    }

    if (socket) {
      socket.close();
    }
    let isResolved = false;
    let rejectTimeout = setTimeout(function() {
      if (!isResolved) {
        throw new Error('Failed to remove record');
      }
    }, 4000);

    return (new Promise(function(resolve, reject) {
      // delaying checking total to get updated results
      setTimeout(() => {
        connectionManager.getTotalConnections({}, (error, total) => {
          if (error) {
            return reject(error);
          }
          assert.equal(total, 0);
          isResolved = true;
          if (rejectTimeout) {
            clearTimeout(rejectTimeout);
          }
          resolve();
        }, 2000);
      });
    }));
  });
});