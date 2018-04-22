/*

These are the request handlers

*/
var lib = require('./data');
var helpers = require('./helpers');

var handlers = {};

handlers.home = function(data,callback){
    callback(406,{message: 'Url at the home directory'});
};
handlers.ping = function(data, callback){
    callback(200, {message: 'Url at the ping directory'});
};

handlers.users = function(data, callback){
    var acceptableMethods = ['post','get','delete','put'];
    if(acceptableMethods.indexOf(data.method.toLowerCase()) > -1){
        handlers._users[data.method.toLowerCase()](data,callback)
    }else{
        callback(405,{message:'Not an acceptable method'})                                                                                                                                                                                                                                                                                                                                                                                                                                  //ha sido juankeado por hackerman
    }
};
    handlers._users = {};//sub method for users handler

    handlers._users.post = function(data,callback){
        var firstName = typeof(data.payload.firstName)=='string' &&data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim():false;
        var lastName = typeof(data.payload.lastName)=='string'&&data.payload.lastName.trim().length > 0?data.payload.lastName.trim():false;
        var phone = typeof(data.payload.phone)=='string'&&data.payload.phone.trim().length==10?data.payload.phone.trim():false;
        var agreement = typeof(data.payload.agreement)=='boolean'&&data.payload.agreement == true?data.payload.agreement:false;
        var password = typeof(data.payload.password)=='string'&&data.payload.password.trim().length>0?data.payload.password:false;
        
        if(firstName&&lastName&&phone&&agreement&&password){
            //hash the password....
            var hashPassword = helpers.hash(password);
                    var userObj = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'agreement' : true,
                        'password' : hashPassword
                    };

                    lib.create('users',phone,userObj,function(err){
                        if(err){
                            callback(406, {message:'Error creating user - user probably already exists.'});
                        }else{
                            callback(200, {message:'Created User Successfully!'});//success!
                        }
                    });
            
        }else{
            callback(405,{message:'Missing fields'});
        }
    };

    //@TODO : ONLY AUTHENTICATED USERS CAN VIEW THEIR ACCOUNT
    handlers._users.get = function(data,callback){
        var phone = typeof(data.query.phone)=='string'?data.query.phone:false;
        
        if(phone){
            lib.read('users',phone,function(err,data){
                if(err){
                    callback(404,{message:'did not find user number'})
                } else {
                    var dataObj = helpers.jsonToObj(data);

                    delete dataObj.password;

                    callback(200,dataObj)
                }
            })
        } else {
            callback(404,{message:'missing phone number'})
        }
    };

    //@TODO ONLY LET AUTHENTICATED USERS EDIT THEIR ACCOUNT
    handlers._users.put = function(data,callback){
        var phone = typeof(data.payload.phone)=='string'?data.payload.phone:false;
        var firstName = typeof(data.payload.firstName)=='string' &&data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim():false;
        var lastName = typeof(data.payload.lastName)=='string'&&data.payload.lastName.trim().length > 0?data.payload.lastName.trim():false;
        var password = typeof(data.payload.password)=='string'&&data.payload.password.trim().length>0?data.payload.password:false;
        
        if(!phone){
            callback(404,{message:'User phone is required'})
        }
        else {
            if(firstName || lastName || password){
                lib.read('users',phone,function(err,response){
                    if(err){
                        callback(405,{message:'This user does not exist'})
                    } else {
                        var newUser = helpers.jsonToObj(response);
                        if(firstName){
                            newUser.firstName = firstName
                        }
                        if(lastName){
                            newUser.lastName = lastName
                        }
                        if(password){
                            newUser.password = helpers.hash(password)
                        }

                        lib.update('users',phone,newUser,function(err){
                            if(err){
                                callback(512,{message:'there was an error updating this user.'})
                            } else {
                                callback(200,{message:'User has been updated'})
                            }
                        })
                    }
                })
            } else {
                callback(405, {message:'You must provide phone and another option to change'})
            }
        }

    };

    //@TODO ONLY AUTHENTICATED USER CAN DELETE HIS OWN ACCOUNT
    handlers._users.delete = function(data,callback){
        var phone = typeof(data.payload.phone)=='string'?data.payload.phone:false;
        
        if(phone){
            lib.delete('users',phone,function(err){
                if(err){
                    callback(500,{message:'There was a problem deleting this user '})
                } else {
                    callback(200,{message:'User deleted'})
                }
            })
        } else {
            callback(404,{message:'missing phone number'})
        }
    };

handlers.notfound = function(data,callback){
    callback(404);
};

module.exports = handlers;