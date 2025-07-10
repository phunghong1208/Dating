'use strict';

const path = require('path');
const Helper = require('./_helper');
const Router = require('../libs/Router');
const middleware = require('../middleware');
const requireAuth = { prefix: '/api', middlewares: [middleware.auth] };

class Handler extends Helper {
  constructor() {
    super(Handler);
  }

  getRoutePath(path, apiPrefix) {
    return `${apiPrefix}/${path}`;
  }

  _routes(controller, methods, router) {
    return super.routes(controller, methods, router);
  }

  _crud(entities, controller, options = {}) {
    let router = new Router();
    let { prefix = '', middlewares = [] } = options;
    prefix = path.join(requireAuth.prefix, prefix);
    middlewares = [...requireAuth.middlewares, ...middlewares];
    router.group({ middlewares }, router => {
      super.crud(controller, router);
    });
    return [this.getRoutePath(entities, prefix), router.init()];
  }
}

module.exports = new Handler();
