if (typeof regeneratorRuntime === 'undefined') {
  require('babel-polyfill');
}
const azure = require('./azure-api.js');

export default {
  ...azure,
};
