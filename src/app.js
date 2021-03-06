import { join } from 'path';
import favicon from 'serve-favicon';
import compress from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { default as logger } from './logger';

import feathers from '@feathersjs/feathers';
import configuration from '@feathersjs/configuration';
import express, {
  json, urlencoded, static as expressStatic,
  rest, notFound, errorHandler
} from '@feathersjs/express';
import socketIO from '@feathersjs/socketio';
import appSocketIO from './modules/socketio';

import middleware from './middleware';
import services from './services';
import appHooks from './app.hooks';
import channels from './channels';

import getCoinrateManager from './modules/coinrates';

const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(compress());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(favicon(join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', expressStatic(app.get('public')));

// Set up Plugins and providers
app.configure(rest());
//app.configure(socketio());
app.configure(socketIO(appSocketIO(app)));

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(errorHandler({ logger }));

app.hooks(appHooks);
app.debug = console.log;
app.error = console.error;

// initializing coinrate manager
getCoinrateManager(app);

export default app;
