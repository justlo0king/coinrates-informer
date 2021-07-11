import connections from './connections/connections.service';

export default function (app) {
  app.configure(connections);
}
