/*

    Library for storing and editing data

*/

var fs = require('fs');
var path = require('path');

var helpers = require('./helpers');
var lib = {};

lib.baseDir = path.join(__dirname+'/../.data/');
//File manipulators should be responsible for conversion of objects / json
lib.create = function(path,data,callback){//RESPONSIBILITIES : creates(opens) a file and writes json in it
    fs.open(lib.baseDir+path[0]+'/'+path[1]+'.json','wx',function(err, descriptor){
        if(err || !descriptor){
            callback(err)
        } else {

            fs.writeFile(descriptor,JSON.stringify(data),function(err){
                if(err){
                    callback(500)
                } else {
                    callback(null,'Written to file');
                    fs.closeSync(descriptor);
                }
            });
        }
    });
};

lib.read = function(path,callback){//RESPONSIBILITIES : reads a file and returns its contents as a js object
    fs.readFile(lib.baseDir + path[0] + '/' + path[1] + '.json', 'utf-8', function(err, data){
        !err ? callback(null, helpers.jsonToObj(data)) : callback(404)    
    });
};

lib.update = function(path,data,callback){

    fs.open(lib.baseDir+path[0]+'/'+path[1]+'.json','r+',function(err, descriptor){
        if(err){
            callback(500)
        } else {
            fs.truncate(descriptor,function(err){
                if(err){
                    callback(500)
                }
                else {
                    fs.writeFile(descriptor, JSON.stringify(data) , function ( err ) {
                            callback(null)
                            fs.closeSync(descriptor);
                    });
                }
            })
        }
    });
};

lib.delete = function(path,callback){
    fs.unlink(lib.baseDir+path[0]+'/'+path[1]+'.json',function(err){
        !err ? callback(null) : callback(500);
    })
};

lib.list = function(path,callback){
    fs.readdir(lib.baseDir + '/' + path,function(err,data){
        if(err){
            callback(err)
        } else {
            var trimmed = [];
            data.forEach(element => {
                trimmed.push(element.replace('.json',''))
            });
            callback(null,trimmed)
        }
    })
}
module.exports = lib;