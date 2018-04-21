var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

var users = require('./users');

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
    var parsedUrl= url.parse(request.url,true);//url = {...,path: ''}
    var path = parsedUrl.path,//path = /home
    trimmedPath = path.replace(/^\/+|\/+s/g,'');//trimmedPath = home
    
    var decoder = new stringDecoder('utf-8');
    var buffer = '';

    request.on('data',function(data){//Steam handling
        buffer += decoder.write(data);
    });
    request.on('end',function(data){
        buffer += decoder.end(data);

        var handler = typeof(router[trimmedPath]) !== 'undefined'?router[trimmedPath]:handlers.notfound;
        var data = {
            'path':path,
            'payload':buffer,
            'query':parsedUrl.query,
            'method':request.method
        };

        handler(data,function(statusCode,payload){
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
            payload = typeof(payload) === 'object' ? payload : {};

            payloadString = JSON.stringify(payload);
            response.setHeader('Content-Type','application/json');
            response.writeHead(statusCode);
            response.end(payloadString);
        });

    });

    var handlers = {};
    handlers.home = function(data,callback){
        callback(406,{message:'Welcome Home!'});
    };

    handlers.ping = function(data, callback){

        callback(200, {message: 'Ping is here'})
    }

    handlers.notfound = function(data,callback){
        callback(404);
    };


    var router = {
        'home' : handlers.home,
        'ping' : handlers.ping
    };
}