const to = require('await-to-js').default;
const AuthUtil = require('../utils/auth');
const HttpUtil = require('../utils/http');
const Utils = require('../utils/index');
const User = require('../models/Customer');
const TAG = '[Header-Validation]';

class AuthMiddleware {
  /**
   *
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  handle(req, res, next) {
    let ret = Utils.getBearerTokenFromHeader(req);
    if (ret.error) return HttpUtil.unauthorized(res, ret.error);

    try {
      AuthUtil.verifyJwtApp(ret.token, async (err, payload) => {
        if (err) {
          // console.log('JWT error:', Object.assign({}, err));
          err = { message: `${err.name}: ${err.message}` };
          return HttpUtil.unauthorized(res, err);
        }
        // find authUser;
        let user;
        [err, user] = await to(User.getById(payload._id, { lookup: true }));
        if (err) {
          return HttpUtil.internalServerError(res, {
            msg: 'Found_Errors.user',
            words: err.message,
          });
        }
        if (!user || (user.delete && user.delete.when)) {
          return HttpUtil.unauthorized(res, 'unauthenticated');
        }
        if (
          user.disable ||
          payload.iat * 1000 <= parseInt(user.lastPasswordChange)
        ) {
          return HttpUtil.unauthorized(res);
        }
        req.authUser = User.getProfiles(user);
        next();
      });
    } catch (err) {
      console.log(TAG + ' checkAccessToken error ', err);
      return HttpUtil.internalServerError(res, err);
    }
  }
}

module.exports = new AuthMiddleware();
