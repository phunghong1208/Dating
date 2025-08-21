'use strict';

class Helper {
  constructor(child) {
    this.bindingMethods = this.bindingMethods.bind(this);
    this.bindingMethods(child);
  }

  bindingMethods(obj) {
    let methods = Object.getOwnPropertyNames(obj.prototype);
    methods = methods.filter(
      x => x !== 'constructor' && x !== 'bindingMethods',
    );
    for (let method of methods) {
      this[method] = this[method].bind(this);
    }
  }

  finishRoute(router) {
    router.use((req, res) => {
      res.status(404).send(`<!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <title>Error</title>
        </head>
        <body>
        <pre>Cannot ${req.method} ${req.originalUrl}</pre>
        </body>
        </html>`);
    });
    return router;
  }

  get(path, fn) {
    return { method: 'get', path, fn };
  }

  post(path, fn) {
    return { method: 'post', path, fn };
  }

  put(path, fn) {
    return { method: 'put', path, fn };
  }

  patch(path, fn) {
    return { method: 'patch', path, fn };
  }

  del(path, fn) {
    return { method: 'delete', path, fn };
  }

  param(path, fn) {
    return { method: 'param', path, fn };
  }

  method(name, path, router, handler) {
    router[name](path, handler);
  }

  routes(router, methods) {
    for (let item of methods) {
      this.method(item.method, item.path, router, item.fn);
    }
    return router;
  }

  /**
   * Tạo ra các api theo chuẩn CRUD
   */
  crud(controller, router) {
    return this.routes(router, [
      this.get('/', controller.index),
      this.post('/', controller.store),
      this.param('id', controller.load),
      this.get('/:id', controller.detail),
      this.put('/:id', controller.update),
      this.del('/:id', controller.destroy),
      this.post('/deleteMulti', controller.deleteMulti),
    ]);
  }
}

module.exports = Helper;
