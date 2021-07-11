import { strict as assert } from 'assert';
import app from '../../src/app';

describe('\'connections\' service', () => {
  it('registered the service', () => {
    const service = app.service('connections');

    assert.ok(service, 'Registered the service');
  });
});
