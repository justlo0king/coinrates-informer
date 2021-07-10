import { strict as assert } from 'assert';
import io from 'socket.io-client';
import app from '../../src/app';


const port = app.get('port') || 8998;

describe('Module tests: socketio', () => {
  let server;
  let socket;

  before(function(done) {
    server = app.listen(port);
    server.once('listening', () => done());
  });

  after(function(done) {
    if (socket) {
      socket.close();
    }
    server.close(done);
  });

  it('connects by socket within 2 seconds', () => {
    const connectionUri = `${app.get('protocol')}://${app.get('host')}:${port}`;
    socket = io(connectionUri, {
      transports: ['websocket']
    });
    return (new Promise(function(resolve, reject) {
      let isResolved = false;
      let rejectTimeout = setTimeout(function() {
        if (!isResolved) {
          reject();
        }
      }, 2000);

      socket.on('connect', function() {
        app.debug('socket connected to: ', connectionUri);
        assert(socket);
        isResolved = true;
        if (rejectTimeout) {
          clearTimeout(rejectTimeout);
        }
        resolve();
      });
    }));
  });
});