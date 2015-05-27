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
  if (req.query[opts.revisionQueryParam]) {
    var queryKey = req.query[opts.revisionQueryParam].replace(/[^A-Za-z0-9]/g, '');
    indexkey = appName + ':' + queryKey;
  }
  var customIndexKeyWasSpecified = !!indexkey;

  function retrieveIndexKey(){
    if (indexkey) {
      return Bluebird.resolve(indexkey);
    } else {
      return redisClient.get(appName + ":current").then(function(result){
        if (!result) { throw new Error(); }
        return result;
      }).catch(function(){
        throw new EmberCliDeployError("There's no " + appName + ":current revision. The site is down.", true);
      });
    }
  };

  return retrieveIndexKey().then(function(indexkey){
    return redisClient.get(indexkey);
  }).then(function(indexHtml){
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
