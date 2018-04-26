/*

    Servers that handle everything

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

//Instantiating Servers
var unifiedServer = function(request,response){
    var parsedUrl= url.parse(request.url,true);
    var path = parsedUrl.pathname,
    trimmedPath = path.replace(/^\/+|\/+$/g, '');
    
    var decoder = new stringDecoder('utf-8');
    var buffer = '';

    request.on('data',function(data){//Steam handling
        buffer += decoder.write(data);
    });
    request.on('end',function(){
        buffer += decoder.end();

        var handler = typeof(router[trimmedPath]) !== 'undefined'?router[trimmedPath]:handlers.notfound;
        
        var data = {
            'headers' : request.headers,
            'path' : trimmedPath,
            'payload' : helpers.jsonToObj(buffer),
            'query' : parsedUrl.query,
            'method' : request.method.toLowerCase()
        };
        handler(data,function(statusCode,payload){
            payload = typeof(payload) === 'object' ? payload : "";//is a js obj

            payloadString = JSON.stringify(payload);

            response.setHeader('Content-Type','application/json');
            response.writeHead(statusCode);

            response.end(payloadString);
        });

    });


    var router = {
        'home' : handlers.home,
        'users' : handlers.users,
        'tokens' : handlers.tokens,
        'checks' : handlers.checks
    };
}

server.init = function(){
    var httpsServerOptions = {
        'key': fs.readFileSync(path.join(__dirname+'/../https/key.pem')),
        'cert': fs.readFileSync(path.join(__dirname+'/..//https/cert.pem'))
    };
    http.createServer(function(request,response){
        unifiedServer(request,response);
    }).listen(config.httpPort,function(){
        console.log('listening at port ' + config.httpPort)
    })

    https.createServer(httpsServerOptions,function(request,response){
        unifiedServer(request,response);
    }).listen(config.httpsPort,function(){
        console.log('listening at port ' + config.httpsPort)
    });
    
}

module.exports = server;