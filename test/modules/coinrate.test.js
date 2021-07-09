import { strict as assert } from 'assert';
import app from '../../src/app';

const port = app.get('port') || 8998;

describe('Module tests: coinrate', () => {
  let server;

  before(function(done) {
    server = app.listen(port);
    server.once('listening', () => done());
  });

  after(function(done) {
    server.close(done);
  });

  it('has initialized coinrate requester', async () => {
    assert.notEqual(
      app.modules && app.modules['coinrate_requester'],
      undefined,
      'coinrate_requester module is not defined'
    );
  });
});