import { strict as assert } from 'assert';
import io from 'socket.io-client';
import app from '../../src/app';
import getCoinrateManager from '../../src/modules/coinrates';
import getConnectionManager from '../../src/modules/connections';

const port = app.get('port') || 8998;

describe('Module tests: coinrates, not stopping server', () => {
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
    const requestUri = `${app.get('protocol')}://${app.get('host')}:${port}/connections?query=${testUserID}`;
    app.debug('\n\n------------------------------------------');
    app.debug(`Send following request to API: \n\nPATCH ${requestUri} \nContent-type: application/json \n\n{ command: { name: 'coinrates' }}`);
    app.debug('------------------------------------------');
    done();
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


  it('client receives rates by socket using call to API', () => {
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

      socket.on('coinrates', function(data) {
        app.debug('coinrates update received: ', data);
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