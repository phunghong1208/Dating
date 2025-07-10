const { UPLOAD_HOST, UPLOAD_PORT, UPLOAD_DIR, GENDOC_DIR } = process.env;

module.exports = {
  UPLOAD_HOST: UPLOAD_HOST || '127.0.0.1',
  UPLOAD_PORT: UPLOAD_PORT || '8080',
  UPLOAD_DIR: UPLOAD_DIR || '/var/www/upload',
  GENDOC_DIR: GENDOC_DIR || '/var/www/gendocs',
};
