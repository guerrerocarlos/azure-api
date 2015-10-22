// In node.js env, polyfill might be already loaded (from any npm package),
// that's why we do this check.
if (!global._babelPolyfill) {
  require('babel/register');
}
module.exports = require('./azure-api.js');
