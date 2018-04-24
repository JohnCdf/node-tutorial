/*

    Library for storing and editing data

*/

var fs = require('fs');
var path = require('path');

var lib = {};

lib.baseDir = path.join(__dirname+'/../.data/');

lib.create = function(path,data,callback){
    fs.open(lib.baseDir+path[0]+'/'+path[1]+'.json','wx',function(err,descriptor){
        if(err || !descriptor){
            callback(err)
        } else {
            stringData = JSON.stringify(data);

            fs.writeFile(descriptor,stringData,function(err){
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

lib.read = function(path,callback){
    fs.readFile(lib.baseDir + path[0] + '/' + path[1] + '.json', 'utf-8', function(err,data){
        !err ? callback(null, data) : callback(404)    
    });
};

lib.update = function(path,data,callback){
    fs.open(lib.baseDir+path[0]+'/'+path[1]+'.json','r+',function(err,descriptor){
        if(err){
            callback(500)
        } else {
            fs.truncate(descriptor,function(err){
                if(err){
                    callback(500)
                }
                else {
                    fs.writeFile(descriptor, JSON.stringify( data ) , function ( err ) {
                            callback(200)
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
}
module.exports = lib;