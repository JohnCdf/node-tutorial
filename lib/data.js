/*

    Library for storing and editing data

*/

var fs = require('fs');
var path = require('path');

var lib = {};

lib.baseDir = path.join(__dirname+'/../.data/');

lib.create = function(dir,filename,data,callback){
    fs.open(lib.baseDir+dir+'/'+filename+'.json','wx',function(err,descriptor){
        if(err || !descriptor){
            callback(err);
            return;
        }

        stringData = JSON.stringify(data);

        fs.writeFile(descriptor,stringData,function(err){
            if(err)throw err;
            callback(null,'Written to file');

            fs.close(descriptor,function(err){
                if(err)throw err;
            });

        });

    });
};


lib.read = function(dir,filename,callback){
    fs.readFile(lib.baseDir+dir+'/'+filename+'.json','utf-8',function(err,data){
        if(err){
            callback(err)
        }else{
            callback(null,data);
        };
    });
};

lib.update = function(dir,filename,data,callback){
    fs.open(lib.baseDir+dir+'/'+filename+'.json','r+',function(err,descriptor){
        if(err){
            callback(err)
        } else {
            var stringData = JSON.stringify(data);

            fs.truncate(descriptor,function(err){
            if(err)throw err;

                fs.writeFile(descriptor,stringData,function(err){
                   if(err){
                       callback(err)
                   } 
                   else {
                       callback(null)
                       fs.closeSync(descriptor)
                   }
                });
            })
        }
    });
};

lib.delete = function(dir,file,callback){
    fs.unlink(lib.baseDir+dir+'/'+file+'.json',function(err){
        if(err){
            callback(err)
        }else{
            callback(null,'Deleted file')
        }
    })
}
module.exports = lib;