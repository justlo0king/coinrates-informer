// Initializes the `connections` service on path `/connections`
const { Connections } = require('./connections.class');
const hooks = require('./connections.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate'),
    multi: ['patch']
  };

  // Initialize our service with any options it requires
  app.use('/connections', new Connections(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('connections');

  service.hooks(hooks);
  app.service('connections').publish((data) => {
    const { id:connectionId } = data;
    return [
      app.channel(`connection/${connectionId}`)
    ];
  });
};
