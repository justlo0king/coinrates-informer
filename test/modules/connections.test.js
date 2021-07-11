import { strict as assert } from 'assert';
import io from 'socket.io-client';
import app from '../../src/app';
import getConnectionManager from './../../src/modules/connections';

const port = app.get('port') || 8998;

describe('Module tests: socketio', () => {
  let server;
  let socket;
  let connectionManager;
  const testUserID = 'someUser';

  before(function(done) {
    server = app.listen(port);
    server.once('listening', () => done());
    connectionManager = getConnectionManager(app);
  });

  after(function(done) {
    connectionManager.getTotalConnections({}, (error, total) => {
      if (error) {
        throw error;
      }
      app.debug('test.after:', 'total connections: ', total);
      if (socket) {
        socket.close();
      }
      server.close(done);
    });
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
      socket.on('connection', function(data) {
        const { connection } = data || {};
        const { id:connectionId } = connection || {};
        app.debug('test:', 'connection id: ', connectionId);
        isResolved = true;
        if (rejectTimeout) {
          clearTimeout(rejectTimeout);
        }
        connectionManager.getTotalConnections({}, (error, total) => {
          if (error) {
            throw error;
          }
          app.debug('test:', 'total connections: ', total);
          assert.equal(total, 1);
          resolve();
        });
      });
    }));
  });

  it('receives connection updates', () => {
    return (new Promise(function(resolve, reject) {
      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 2000);

      socket.on('connections patched', function(data) {
        app.debug('test:', 'patched connection: ', data);
        isResolved = true;
        if (rejectTimeout) {
          clearTimeout(rejectTimeout);
        }
        resolve();
      });

      app.service('connections').patch(null, {
        command: { name: 'coinrate' }
      }, {
        query: { userId: testUserID }
      }).catch((error) => {
        app.error('test:', 'failed to patch connection, error: ', error);
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

  it('removes record from service when disconnected', () => {
    return (new Promise(function(resolve, reject) {
      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 4000);

      if (!socket || !socket.connected) {
        reject('socket is not connected');
      }

      socket.close();

      // delaying checking total to get updated results
      setTimeout(() => {
        connectionManager.getTotalConnections({}, (error, total) => {
          if (error) {
            throw error;
          }
          app.debug('test:', 'total connections: ', total);
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