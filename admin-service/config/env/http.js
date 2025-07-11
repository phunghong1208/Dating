const { BASE_URL, HOST, PORT, LANG_DEV } = process.env;

module.exports = {
  BASE_URL: BASE_URL,
  HOST: HOST || '127.0.0.1',
  PORT: PORT || '3000',
  LANG: LANG_DEV || 'en',
};
