/*jshint node:true*/
var proxyPath = '/proxy';

module.exports = function(app) {
  // For options, see:
  // https://github.com/nodejitsu/node-http-proxy
  var proxy = require('http-proxy').createProxyServer({});

  proxy.on('error', function(err, req) {
    console.error('ERROR:', err, req.url);
  });

  app.use(proxyPath, function(req, res, next){
    // include root path in proxied request
    req.url = '';
    //console.log(req);
    proxy.web(req, res, { target: req.query.p });
  });
};
