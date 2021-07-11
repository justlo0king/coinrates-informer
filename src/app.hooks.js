// Application hooks that run for every service

//import app from './app';

const before = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
const after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
const error = {
  all: [(hook) => {
    //app.error('app.hooks.error: ', hook.error);
    return hook;
  }],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

export default Object.freeze({ before, after, error });