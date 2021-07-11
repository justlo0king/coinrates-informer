//import app from './../../app';

import getConnectionManager from '../../modules/connections';
import getCoinrateManager from '../../modules/coinrates';

module.exports = {
  before: {
    all: [],

    find: [(hook) => {
      const { provider } = hook.params || {};
      if (provider) {
        // only backend is allowed to find records
        throw new Error('Permission denied');
      }
      return hook;
    }],

    get: [(hook) => {
      const { provider } = hook.params || {};
      if (provider) {
        // only backend is allowed to get records
        throw new Error('Permission denied');
      }
      return hook;
    }],

    create: [(hook) => {
      const { provider } = hook.params || {};
      if (provider) {
        // only backend is allowed to create records
        throw new Error('Permission denied');
      }

      hook.data = hook.data || {};
      const now = Date.now();
      hook.data.createdAt = now;
      hook.data.updatedAt = now;
      return hook;
    }],

    update: [() => {
      throw new Error('Update not allowed');
    }],

    patch: [(hook) => {
      const { provider } = hook.params || {};
      hook.data = hook.data || {};
      const { command } = hook.data || {};
      if (provider) {
        // not backend request
        if (!command || Object.keys(hook.data).length !== 1) {
          // only 'command' in patch is allowed from external requests
          //app.error('connections.before.patch: not allowed data: ', hook.data);
          throw new Error('Not allowed data');
        }
      }
      //app.debug('connections.before.patch: data: ', hook.data);
      if (command) {
        hook.params.command = command;
        delete hook.data.command;
      }
      hook.data.updatedAt = Date.now();
      return hook;
    }],

    remove: [(hook) => {
      const { provider } = hook.params || {};
      if (provider) {
        // only backend is allowed to remove records
        throw new Error('Permission denied');
      }
      return hook;
    }]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [
      /**
       * executes commands when connection is patched
       * @param {HookContext} hook - feathers hook context
       * @returns
       */
      (hook) => {
        const { command } = hook.params || {};
        const { name:commandName } = command || {};
        if (!commandName || typeof commandName != 'string') {
          // there was no command
          return hook;
        }
        if (commandName === 'coinrates') {
          const { getRates } = getCoinrateManager();
          const { send } = getConnectionManager();
          const rates = getRates();

          // result can be array or object, - making sure it is array
          const resultData = Array.isArray(hook.result) ? hook.result : [ hook.result ];
          resultData.map((connection) => {
            //app.debug('connections.after.update: command: ', command);
            const { id:connectionId } = connection || {};
            //app.debug('connections.after.update: sending updates, connectionId: ', connectionId);
            send(connectionId, 'coinrates', rates);
          });
        }

        return hook;
      }
    ],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
