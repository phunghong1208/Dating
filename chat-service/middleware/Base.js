'use strict';

class BaseMiddleware {
  constructor() {
    this.init = this.init.bind(this);
    this.handle = this.handle.bind(this);
    this._params = null;
  }

  init(...params) {
    this._params = params;
    return this.handle;
  }

  handle(req, res, next) {
    throw new Error('Implement this handle() function in subclass.');
  }
}

module.exports = BaseMiddleware;
