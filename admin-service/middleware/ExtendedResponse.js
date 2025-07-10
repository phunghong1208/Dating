const BaseMiddleware = require('../middleware/Base');

/**
 * Mở rộng chức năng của response
 */
class ExtendedResponse extends BaseMiddleware {
  handle(req, res, next) {
    res.sendResult = this.sendResult.bind(res);
    next();
  }

  sendResult(httpCode, msg, data = null) {
    return this.status(httpCode).json({
      message: msg,
      data: data || undefined,
    });
  }
}

module.exports = new ExtendedResponse();
