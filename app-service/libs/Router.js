'use strict';

const express = require('express');
const path = require('path');

class Router {
  constructor(options = {}) {
    let { prefix = '', middlewares = [], params = {}, _params = [] } = options;
    this.prefix = prefix;
    this.middlewares = middlewares;
    this.params = params;
    this._params = _params;
    this.groups = [];
    this.methods = {
      get: [],
      post: [],
      put: [],
      patch: [],
      delete: [],
      head: [],
      all: [],
    };
  }

  get(...params) {
    this.methods.get.push(params);

    return this;
  }

  post(...params) {
    this.methods.post.push(params);

    return this;
  }

  put(...params) {
    this.methods.put.push(params);

    return this;
  }

  patch(...params) {
    this.methods.patch.push(params);

    return this;
  }

  delete(...params) {
    this.methods.delete.push(params);

    return this;
  }

  head(...params) {
    this.methods.head.push(params);

    return this;
  }

  all(...params) {
    this.methods.all.push(params);

    return this;
  }

  param(name, fn) {
    if (typeof name === 'function') {
      this._params.push(name);
      return;
    }
    if (typeof name === 'string' && name[0] === ':') {
      name = name.substr(1);
    }
    let ret;
    let len = this._params.length;
    for (let i = 0; i < len; ++i) {
      if ((ret = this._params[i](name, fn))) {
        fn = ret;
      }
    }
    // ensure we end up with a
    // middleware function
    if ('function' !== typeof fn) {
      throw new Error('invalid param() call for ' + name + ', got ' + fn);
    }

    (this.params[name] = this.params[name] || []).push(fn);
    return this;
  }

  group(...params) {
    let _prefix;
    let _middlewares = [];
    let _callback;
    // handle params
    if (arguments.length === 3) {
      [_prefix, _middlewares, _callback] = params;
      if (typeof middlewares === 'function') {
        _middlewares = [_middlewares];
      }
    } else if (arguments.length === 2) {
      if (typeof params[0] === 'string') {
        _prefix = params[0];
      } else if (typeof params[0] === 'function') {
        _middlewares = [_middlewares];
      } else if (Array.isArray(params[0])) {
        _middlewares = params[0];
      } else if (!Array.isArray(params[0]) && typeof params[0] === 'object') {
        _prefix = params[0].prefix || '';
        _middlewares = params[0].middlewares;
      }
      _callback = params[1];
    } else if (arguments.length === 1 && typeof params[0] === 'function') {
      _callback = params[0];
    }

    let options = { middlewares: _middlewares };
    if (_prefix && _prefix !== '' && _prefix !== '/') {
      options = { ...options, prefix: _prefix };
    }
    let router = new Router(options);
    if ('function' === typeof _callback) {
      _callback(router);
    }

    this.groups.push(router);
    return this;
  }

  init() {
    let result = [];
    const { prefix, middlewares, groups, params, _params, methods } = this;
    for (let method in methods) {
      let routes = methods[method];
      if (routes.length) {
        for (let route of routes) {
          if (route.length >= 2) {
            let router = express.Router();
            let [uri, ...handler] = route;
            let param = uri.split(':')[1] || null;
            if (param) router.params[param] = params[param];
            if (_params.length) router._params = _params;
            uri = path.join(prefix, uri);
            // console.log('router path', uri)
            if (middlewares.length) {
              router[method](uri, ...middlewares, ...handler);
            } else {
              router[method](uri, ...handler);
            }
            result.push(router);
          }
        }
      }
    }
    if (groups.length) {
      for (let group of groups) {
        if (prefix || group.prefix) {
          group.prefix = path.join(prefix, group.prefix);
        }
        group.middlewares = [...middlewares, ...group.middlewares];
        let routes = group.init();
        if (routes.length) {
          result = result.concat(routes);
        }
      }
    }
    return result;
  }
}

module.exports = Router;
