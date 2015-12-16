'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
if (typeof regeneratorRuntime === 'undefined') {
  require('babel-polyfill');
}
var azure = require('./azure-api.js');

exports.default = _extends({}, azure);