/*

    Servers that unify the protocols and pass them on to handlers

*/

var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var path = require('path');

var config = require('../config');
var helpers = require('./helpers');
var handlers = require('./handlers');

var server = {};

var router = {
        '' : handlers.index,
        'users' : handlers.users,
        'tokens' : handlers.tokens,
        'checks' : handlers.checks,
        'public' : handlers.public,

    'checks/all' : handlers.dashboard,
    'checks/edit' : handlers.checksEdit,

    'session/create' : handlers.sessionCreate,
    'session/terminate' : handlers.sessionTerminate,

    'account/create' : handlers.accountCreate,
    'account/edit' : handlers.accountEdit,
    'account/deleted' : handlers.accountDeleted,

    'api/home' : handlers.home,
    'api/users' : handlers.users,
    'api/tokens' : handlers.tokens,
    'api/checks' : handlers.checks
};

//Instantiating HTTP & HTTPS Servers into one
var unifiedServer = function(request, response){
    var parsedUrl= url.parse(request.url, true);
    var path = parsedUrl.pathname,
    trimmedPath = path.replace(/^\/+|\/+$/g, '');
    
    var decoder = new stringDecoder('utf-8');
    var buffer = '';

    request.on('data',function(data){//Steam handling
        buffer += decoder.write(data);
    });
    request.on('end',function(){//Select handler and pass on the data
        buffer += decoder.end();

        var handler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notfound;
        
        for ( route in router ) {
            if ( path.indexOf(route) > -1 ) {
                handler = router[route]
            }
        };
        var data = {
            'headers' : request.headers,
            'path' : trimmedPath,
            'payload' : helpers.jsonToObj(buffer),
            'query' : parsedUrl.query,
            'method' : request.method.toLowerCase()
        };
        
        handler(data, function(statusCode, payload, contentType){
            payloadString = typeof(payload) == 'string' && payload.trim().length > -1 ? payload : '';
            contentType = typeof(contentType) == 'string' && contentType.trim().length > -1 ? contentType : 'application/json';

            if ( contentType == 'application/json' ) {
                payloadString = JSON.stringify(payload)
            }
            
            response.setHeader('Content-Type', contentType);

            response.writeHead(statusCode);
            
            response.end( payloadString );
        });

    });


    
}

server.init = function(){
    
    var httpsServerOptions = {
        'key': fs.readFileSync(path.join(__dirname + '/../https/key.pem')),
        'cert': fs.readFileSync(path.join(__dirname + '/..//https/cert.pem'))
    };
    http.createServer(function(request,response){
        unifiedServer(request,response);
    }).listen(config.httpPort,function(){
        console.log('listening at port ' + config.httpPort)
    });

    https.createServer(httpsServerOptions,function(request,response){
        unifiedServer(request,response);
    }).listen(config.httpsPort,function(){
        console.log('listening at port ' + config.httpsPort)
    });
    
};




module.exports = server;
