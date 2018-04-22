/*

    Servers that handle everything

*/

var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

var helpers = require('./lib/helpers');
var lib = require('./lib/data');
var handlers = require('./lib/handlers');

//HTTP server
http.createServer(function(request,response){
    unifiedServer(request,response);
}).listen(config.httpPort,function(){
    console.log('listening at port ' + config.httpPort)
});

//HTTPS server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

https.createServer(httpsServerOptions,function(request,response){
    unifiedServer(request,response);
}).listen(config.httpsPort,function(){
    console.log('listening at port ' + config.httpsPort)
});


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
            'path':trimmedPath,
            'payload':helpers.jsonToObj(buffer),//this will be the data we work on in the handlers
            'query':parsedUrl.query,
            'method':request.method.toLowerCase()
        };
        
        handler(data,function(statusCode,payload){
            
            payload = typeof(payload) === 'object' ? payload : {};

            payloadString = JSON.stringify(payload);
            response.setHeader('Content-Type','application/json');
            response.writeHead(statusCode);
            response.end(payloadString);
        });

    });


    var router = {
        'home' : handlers.home,
        'ping' : handlers.ping,
        'users' : handlers.users
    };
}