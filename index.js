var async     = require('async');
var Bluebird   = require('bluebird');
var _defaults = require('lodash/object/defaults');

var EmberCliDeployError = require('./errors/ember-cli-deploy-error');

var _defaultOpts = {
  revisionQueryParam: 'index_key'
};

var _getOpts = function (opts) {
  opts = opts || {};
  return _defaults({}, opts, _defaultOpts);
};

var fetchIndex = function (appName, req, redisClient, opts) {
  opts = _getOpts(opts);

  var indexkey;
  var customIndexKeyWasSpecified = false;
  if (req.query[opts.revisionQueryParam]) {
    var queryKey = req.query[opts.revisionQueryParam].replace(/[^A-Za-z0-9]/g, '');
    indexkey = appName + ':' + queryKey;
    customIndexKeyWasSpecified = true;
  } else {
    indexkey = appName + ':default';
  }

  return redisClient.get(indexkey).then(function(indexHtml){
    if (!indexHtml) { throw new Error(); }
    return indexHtml;
  }).catch(function(err){
    if (err.name === 'EmberCliDeployError') {
      throw err;
    } else {
      throw new EmberCliDeployError("There's no " + indexkey + " revision. The site is down.", !customIndexKeyWasSpecified);
    }
  });
};

module.exports = {
  fetchIndex: fetchIndex
};
