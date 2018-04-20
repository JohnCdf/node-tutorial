const users = require('./users');
const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer(function(request,response){
    let parsedUrl = url.parse(request.url, true);
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+/g,'');
    let query = parsedUrl.query;

    if(trimmedPath === ''){
        response.end('Welcome home!')
    }
    else if (trimmedPath === 'user'){
        let user = users.find(function(userObj){
                return Number(query.id) == userObj.id;
        })
        response.end('Welcome, ' + user.name)
    };
}).listen(8000);