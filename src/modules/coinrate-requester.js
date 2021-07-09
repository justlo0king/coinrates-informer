export default function coinrate_requester(app) {
  app.debug('coinrate_requester');
  return function(module_name, module) {
    app.modules[module_name] = module;
  };
}