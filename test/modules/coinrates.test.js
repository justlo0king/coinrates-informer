import { strict as assert } from 'assert';
import io from 'socket.io-client';
import app from '../../src/app';
import getCoinrateManager from '../../src/modules/coinrates';
import getConnectionManager from '../../src/modules/connections';

const port = app.get('port') || 8998;

describe('Module tests: coinrates', () => {
  let server;
  let coinrateManager;
  let socket;
  let connectionManager;
  const testUserID = 'someUser';

  before(function(done) {
    server = app.listen(port);
    coinrateManager = getCoinrateManager(app);
    server.once('listening', () => done());
    connectionManager = getConnectionManager(app);
  });

  after(function(done) {
    if (socket) {
      socket.close();
    }
    server.close(done);
  });

  it('requester returns error with wrong coin type', async () => {
    return coinrateManager.refreshRates({ coin: 1 }, function(error) {
      assert.equal(error, 'Parameters error');
    });
  });

  it('requester returns USD and EUR rates for BTC', () => {
    return coinrateManager.refreshRates({
      coin: 'btc'
    }, function(error, result) {
      assert.equal(
        error,
        null
      );
      assert.equal(
        typeof(result && result.USD),
        'number'
      );
      assert.equal(
        typeof(result && result.EUR),
        'number'
      );
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
      socket.on('handshake_result', function(data) {
        const { connection } = data || {};
        const { id:connectionId } = connection || {};
        assert.ok(connectionId);
        connectionManager.getTotalConnections({}, (error, total) => {
          if (error) {
            throw error;
          }
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

  it('receives rates by socket using call to API', () => {
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

      socket.on('coinrates', function(data) {
        //app.debug('test: ', 'coinrates update received: ', data);
        assert.equal(typeof (data && data.USD), 'number');
        isResolved = true;
        if (rejectTimeout) {
          clearTimeout(rejectTimeout);
        }
        resolve();
      });

      app.service('connections').patch(null, {
        command: { name: 'coinrates' }
      }, {
        query: { userId: testUserID }
      }).catch((error) => {
        app.error('test:', 'failed to patch connection, error: ', error);
      });
    }));
  });
});