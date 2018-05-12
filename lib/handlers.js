/*

These are the request handlers

*/

var helpers = require('./helpers');
var lib = require('./data');
var config = require('../config');

var handlers = {};

/*

HTML HANDLERS:
Dedicated to the rendering of HTML pages on different routes

*/
handlers.index = function(data, callback){

    let templateData = {
      'head.title' : 'Home',
      'body.class' : 'home'
    };

    helpers.getTemplate('index', templateData, function (err, string) {
      
        helpers.universalTemplates(string, templateData, function (err, fullTemplate){
          callback(200, fullTemplate, 'text/html')
        })
      
    });

};

handlers.accountCreate = function ( data, callback ) {
    let templateData = {
      'head.title' : 'Sign Up',
      'body.class' : ''
    }

    helpers.getTemplate('signup', templateData, function (err, string) {

      helpers.universalTemplates(string, templateData, function (err, fullTemplate){
        callback(200, fullTemplate, 'text/html')
      })

    });
  
};

handlers.accountEdit = function ( data, callback ) {
  let templateData = {
    'head.title' : 'Account Settings',
    'body.class' : 'accountEdit'
  }  

  helpers.getTemplate('accountEdit', templateData, function (err, string){
    helpers.universalTemplates(string, templateData, function (err, fullTemplate){
      callback(200, fullTemplate, 'text/html')
    })
  })
};

handlers.dashboard = function ( data, callback ) {
  callback(200, "Welcome!", 'text/html')
};

handlers.errorPage = function ( data, callback ) {
  let templateData = {
    'head.title' : 'Umm...',
    'body.class' : ''
  }

  helpers.getTemplate('error', templateData, function (err, string){
    helpers.universalTemplates(string, templateData, function (err, fullTemplate){
      callback(200, fullTemplate, 'text/html')
    })
  })
};

handlers.popular = function ( data, callback ) {
  let templateData = {
    'head.title' : 'Popular Spaces',
    'body.class' : 'popular'
  }
  helpers.getTemplate('popular', templateData, function ( err, string ){
    helpers.universalTemplates(string,templateData, function (err, fullTemplate){
      callback(200, fullTemplate, 'text/html')
    })
  })
};
/* Public assets */
handlers.public = function (data, callback) {
  var assetName = data.path.replace('public/','').trim();
  
  helpers.getStaticAsset(assetName, function(err, data){

    contentType = helpers.determineContentType( assetName );
    callback( 200, data, contentType );

  })
};

/* User sign in / sign out / session */
handlers.sessionCreate = function ( data, callback ) {
  var templateData = {
    'head.title' : 'Sign In',
    'body.class' : ''
  }
  helpers.getTemplate('sessionCreate', templateData,function( err, string ) { 
    helpers.universalTemplates(string, templateData, function ( err, fullTemplate ) {
      callback(200, fullTemplate, 'text/html')
    })
  });
};

/*

JSON API HANDLERS:
Dedicated to the creation, reading, updating and removal of data on the server

*/
handlers.users = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'delete', 'put'];
  let method = data.method.toLowerCase();

  if (acceptableMethods.indexOf(method) > -1) {

    handlers._users[method](data, callback);

  } else {
    callback(405, {
      message: 'Not an acceptable method'
    }, 'application/json')
  }
};

//user methods (sub-handlers) ->
handlers._users = {};

handlers._users.post = function (data, callback) {
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false,
  lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false,
  phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false,
  agreement = typeof (data.payload.agreement) == 'boolean' ? data.payload.agreement : false,
  password = typeof (data.payload.password) == 'string' && data.payload.trim().length >= 8 ? data.payload.password : false;
  
  if (firstName && lastName && phone && agreement && password) {
    var userObj = {
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'agreement': true,
      'password': helpers.hash(password)
    };
      lib.create(['users', phone], userObj, function (err) {
        !err ? callback(200, {message:'User Created'}, 'application/json') : callback(500, {message: 'Unable to create user, it probably already exists'}, 'application/json');
      });

  } else if (data.password.trim().length < 10) {
    callback(405, {
      message: 'Password must be atleast 8 characters long'
    }, 'application/json')
  } else {
    callback(405, {
      message: 'Invalid field(s).'
    }, 'application/json');
  }
};

handlers._users.get = function (data, callback) {
  var phone = typeof (data.query.phone) == 'string' ? data.query.phone : false;
  
  if (phone) {
    lib.read(['users', phone], function (err, user) {
      if (err) {
        callback(404, {
          message: 'did not find user number'
        }, 'application/json')
      } else {
        delete user.password;
        callback(200, user, 'application/json')
      }
    })
  } else {
    callback(404, {
      message: 'missing phone number'
    })
  }
};

//ONLY AUTHENTICATED USERS EDIT THEIR ACCOUNT
handlers._users.put = function (data, callback) {
  var phone = typeof (data.payload.phone) == 'string' ? data.payload.phone : false;
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
  var newPassword = typeof (data.payload.newPassword) == 'string' && data.payload.newPassword.trim().length >= 8 ? data.payload.newPassword : false;
  var agreement = typeof(data.payload.agreement) == 'boolean' ? data.payload.agreement : false;
  
  if (!phone || !password) {
    callback(404, {
      message: 'User phone and password are required'
    }, 'application/json')
  } else if (data.payload.newPassword.trim().length < 8) {
    callback(405, {
      message: 'New password must be atleast 8 characters long'
    }, 'application/json')
  } else {
    if (firstName || lastName || newPassword) {
      lib.read(['users', phone], function (err, user) {//reads user data ->
        if (err) {
          callback(405, {
            message: 'This user does not exist'
          }, 'application/json')
        } else {
          if (helpers.hash(password) != user.password) {//compares password ->
            callback(405, {
              message: 'Password is incorrect'
            }, 'application/json')
          } else {
            
            if (firstName) {
              user.firstName = firstName
            }
            if (lastName) {
              user.lastName = lastName
            }
            if (newPassword) {
              user.password = helpers.hash(newPassword)
            }

            lib.update(['users', phone], user, function (err) {//updates based on input.
              err ? callback(512,{message: 'There was an error updating your profile'}, 'application/json') : callback(200,{message: 'User has been updated'}, 'application/json')
            })
          }
        }
      })
    } else {
      callback(405, {
        message: 'You must provide phone and another option to change'
      }, 'application/json')
    }
  }
};

//ONLY AUTHENTICATED USER CAN DELETE HIS OWN ACCOUNT
handlers._users.delete = function (data, callback) {
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

  if (phone && password) {
    lib.read(['users', phone], function (err, user){
      if(err){
        callback(404,{message:'User does not exist'}, 'application/json')
      } else {

        if (user.password == helpers.hash(password)) {
          lib.delete(['users', phone], function (err) {
            if (err) {
              callback(500, {
                message: 'There was a problem deleting this user, as it may not exist. '
              }, 'application/json')
            } else {
              var userChecks = typeof( user.checks ) == 'object' && user.checks.length > -1 ? user.checks : false;
              var userToken = typeof( user.token ) == 'object' ? user.token.key : false;
              /*Clearing all user history*/
              if ( userToken ) {
                lib.delete(['tokens',userToken], function(err){
                  if (err) {
                    console.error(err)
                  }
                })
              };

              if ( userChecks ) {
                for (let i = 0; i < userChecks.length; i++ ) {
                  lib.delete('checks',userChecks[i], function(){})
                }
              };
                callback(200, {
                  message: 'User deleted'
                }, 'application/json')
            }
          });
        } else {
          callback(403, {
            message: 'Incorrect password'
          }, 'application/json')
        }
      }
    });

  } else {
    callback(404, {
      message: 'missing field'
    }, 'application/json')
  }
};

handlers.tokens = function (data, callback) {
  var acceptableMethods = ['post', 'delete'];
  let method = data.method.toLowerCase();

  if (acceptableMethods.indexOf(method) > -1) {
    handlers._tokens[method](data, callback);
  } else {
    callback(400, {
      message: 'Not an acceptable method'
    }, 'application/json')
  }
};


handlers._tokens = {};

handlers._tokens.post = function (data, callback) {
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
  var password = typeof (data.payload.password) == 'string' ? data.payload.password : false;
  
  if (phone && password) {
    lib.read(['users', phone], function(err, user){
      if(user){
        if (helpers.hash(password) == user.password) {
          var tokenObj = {};
          tokenObj.key = helpers.randomStringGenerator();
          tokenObj.expiration = Date.now() * 1000 * 60 * 15;//15 minutes
          tokenObj.phone = phone;
  
          user.token = tokenObj;
  
          lib.create(['tokens', tokenObj.key], tokenObj, function (err) {

              lib.update(['users', phone], user, function (err) {
                if (err) {
                  callback(500, {
                    message: 'error updating user token'
                  }, 'application/json')
                } else {

                  callback(200, tokenObj, 'application/json');
                }
              })
  
          });
        } else {
          callback(400, {
            message: 'Incorrect password'
          }, 'application/json')
        }
      } else {
        callback(404,{message:'User not found'}, 'application/json')
      }
      
    });
  } else {
    callback(400, {
      message: 'You need to provide proper input'
    }, 'application/json')
  }
}

handlers._tokens.delete = function(data,callback){
  var id = typeof(data.payload.key) == 'string' ? data.payload.key.trim() : false;
  if(id){
    lib.read(['tokens', id], function(err, tokenData){

      if(!err && tokenData){
        lib.delete(['tokens',id],function(err){
          if(!err){
            callback(200,{message : 'Deleted Token'}, 'application/json');
          } else {
            callback(500,{message : 'Could not delete the specified token'}, 'application/json');
          }
        });
      } else {
        callback(400,{message : 'Could not find the specified token.'}, 'application/json');
      }

    });
  } else {
    callback(400,{message : 'Missing required field'}, 'application/json')
  }
};


handlers.posts = function ( data, callback ) {
  let acceptableMethods = ['get'];
  let method = data.method.toLowerCase();

  if(acceptableMethod.indexOf(method) > -1 ) {
    handlers._posts[method](data,callback);
  } else {
    callback( 405, {message: 'Unacceptable method'}, 'application/json');
  };

};
  handlers._posts = {};

  handlers._posts.get = function ( data, callback ) {
    //TODO:
    /*
      Create a handler that returns the posts in a work space as HTML, depending on what posts are being asked for

      IF the posts are, for example, for the computer science space :

        lib.read('spaces', 'computer-science') ->
          Take this object and read into its 'posts' array

          sort the array by popularity

          for each of the objects in the array, add to a HTML string a list item with a link to the posts

          after all of them have been added (atleast the most popular ones), send it in callback(200, list, 'text/html')
    */
   
    //TO BE CONSIDERED:
    /*
      Perhaps there is a better name than 'post', such as 'discussion'? or 'space'?

      What about if we want to sort the posts not for popularity but by comments, or lack of time of publishing

      What about the 'popular' route? How will we render posts for all spaces? 
        Add to the popularity of the 'space' object?

        possible schema for a space:

        Space = {
          name: 'computer-science',
          description: 'a space dedicated to computer science and all',
          popularity: 100,
          posts: []
        }
    */


  };
handlers.notfound = function (  data, callback  ) {
  var templateData = {
    'head.title' : 'Not found!',
    'body.class' : ''
  }
  helpers.getTemplate('404',templateData,function( err, string ) {
    helpers.universalTemplates(string, templateData, function (err, fullTemplate){
      callback(200, fullTemplate, 'text/html')
    })
  })
};

module.exports = handlers;