var server = require('./lib/server')
var workers = require('./lib/workers')

app = {};

app.init = function(){
    server.init();
    workers.init();
};

app.init()

module.exports = app;