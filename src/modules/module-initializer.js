
export default function module_initializer(app) {
  app.modules = {};
  app.debug('DEBUG', 'module_initializer');
  return function(module_name, module) {
    app.debug('DEBUG', 'module_initializer: module: %s', module_name);
    app.modules[module_name] = module;
  };
}