class GuestMiddleware {
  /**
   *
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  handle(req, res, next) {
    next();
  }
}

module.exports = new GuestMiddleware();
