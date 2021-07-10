import { strict as assert } from 'assert';
import app from '../../src/app';
import coinrate_requester from '../../src/modules/coinrate-requester';

const port = app.get('port') || 8998;

describe('Module tests: coinrate', () => {
  let server;
  let requester;

  before(function(done) {
    server = app.listen(port);
    requester = coinrate_requester(app);
    server.once('listening', () => done());
  });

  after(function(done) {
    server.close(done);
  });

  it('requester returns error without parameters', async () => {
    const result = requester();
    assert.notEqual(
      result && result.error,
      undefined
    );
  });

  it('requester returns error with  wrong callback type', async () => {
    const result = requester('btc');
    assert.notEqual(
      result && result.error,
      undefined
    );
  });

  it('requester returns error with wrong coin_name type', async () => {
    return requester({ coin: 1 }, function(result) {
      assert.equal(
        result && result.error,
        'Coin parameter error'
      );
    });
  });


  it('requester returns USD and EUR rates for BTC', () => {
    return requester({
      coin: 'btc'
    }, function(result) {
      assert.equal(
        result && result.error,
        undefined
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

});