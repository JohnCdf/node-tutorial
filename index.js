var http = require('http');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

var users = require('./users');

http.createServer(function(request,response){
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

    handlers.user = function(data,callback){
        user = users.find(function(currentUser){
            return currentUser.id === parsedUrl.query.id
        });
        user = typeof(user)==='object'?user:{message:'user not found'};

        callback(406,user);
    };

    handlers.notfound = function(data,callback){
        callback(404);
    };


    var router = {
        'home' : handlers.home,
        'user' : handlers.user
    };
}).listen(config.port,function(){
    console.log(`Listening on port ${config.port} using env ${config.envName}`)
});