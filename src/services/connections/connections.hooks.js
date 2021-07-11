//import app from './../../app';

import getConnectionManager from '../../modules/connections';
import getCoinrateManager from '../../modules/coinrates';

/**
 * denies external requests
 * @param {*} hook
 * @returns
 */
const denyExternal = (hook) => {
  const { provider } = hook.params || {};
  if (provider) {
    // only backend is allowed to find records
    throw new Error('Permission denied');
  }
  return hook;
};

/**
 * adds createdAt/updatedAt values to new record data
 * @param {HookContext} hook - feathers hook context
 * @returns {HookContext} - context with modified data
 */
const addCreatedAt = (hook) => {
  hook.data = hook.data || {};
  const now = Date.now();
  hook.data.createdAt = now;
  hook.data.updatedAt = now;
  return hook;
};

/**
 * cuts "command" from data,
 * saves it to hook.params to use after patch,
 * adds updatedAt to patch data
 * @param {HookContext} hook - feathers hook context
 * @returns {HookContext} - context with modified data
 */
const limitToCommand = (hook) => {
  hook.data = hook.data || {};
  const { command } = hook.data || {};
  // not backend request
  if (!command || Object.keys(hook.data).length !== 1) {
    // only 'command' in patch is allowed from external requests
    //app.error('connections.before.patch: not allowed data: ', hook.data);
    throw new Error('Not allowed data');
  }
  const { name:commandName } = command || {};

  //app.debug('connections.before.patch: data: ', hook.data);
  if (!commandName || typeof commandName !== 'string') {
    throw new Error('Not allowed command');
  }

  const allowedCommands = [ 'coinrates' ];

  if (allowedCommands.indexOf(commandName) == -1) {
    throw new Error('Command not recognized');
  }

  hook.params.command = command;
  delete hook.data.command;

  hook.data.updatedAt = Date.now();
  return hook;
};

/**
 * executes commands saved in hook.params when connection is patched
 * @param {HookContext} hook - feathers hook context
 * @returns {HookContext}
 */
const executeCommand = (hook) => {
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
};

module.exports = {
  before: {
    all: [],

    find: [
      denyExternal
    ],

    get: [
      denyExternal
    ],

    create: [
      denyExternal,
      addCreatedAt
    ],

    update: [
      denyExternal
    ],

    patch: [
      limitToCommand
    ],

    remove: [
      denyExternal
    ]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [
      executeCommand
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
