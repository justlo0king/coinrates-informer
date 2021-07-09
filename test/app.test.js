import '@babel/register';

import { strict as assert } from 'assert';
import { get } from 'axios';
import { format } from 'url';
import app from '../src/app';

import module_initializer from './../src/modules/module-initializer';


const port = app.get('port') || 8998;
const getUrl = pathname => format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

describe('Feathers application tests', () => {
  let server;

  before(function(done) {
    server = app.listen(port);
    server.once('listening', () => done());
  });

  after(function(done) {
    server.close(done);
  });

  it('can initialize modules', async () => {
    const some_module = function() {};

    const moduleInit = module_initializer(app);
    moduleInit('some_module', some_module);
    assert.ok(app.modules && app.modules['some_module'] != undefined);
  });

  it('starts and shows the index page', async () => {
    const { data } = await get(getUrl());

    assert.ok(data.indexOf('<html lang="en">') !== -1);
  });

  describe('404', function() {
    it('shows a 404 HTML page', async () => {
      try {
        await get(getUrl('path/to/nowhere'), {
          headers: {
            'Accept': 'text/html'
          }
        });
        assert.fail('should never get here');
      } catch (error) {
        const { response } = error;

        assert.equal(response.status, 404);
        assert.ok(response.data.indexOf('<html>') !== -1);
      }
    });

    it('shows a 404 JSON error without stack trace', async () => {
      try {
        await get(getUrl('path/to/nowhere'), {
          json: true
        });
        assert.fail('should never get here');
      } catch (error) {
        const { response } = error;

        assert.equal(response.status, 404);
        assert.equal(response.data.code, 404);
        assert.equal(response.data.message, 'Page not found');
        assert.equal(response.data.name, 'NotFound');
      }
    });
  });
});
