/*

These are the request handlers

*/
var lib = require('./data');
var helpers = require('./helpers');
var config = require('../config');
var handlers = {};

handlers.home = function (data, callback) {
  callback(406, {
    message: 'Url at the home directory'
  });
};
handlers.ping = function (data, callback) {
  callback(200, {
    message: 'Url at the ping directory'
  });
};

handlers.users = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'delete', 'put'];
  if (acceptableMethods.indexOf(data.method.toLowerCase()) > -1) {
    handlers._users[data.method.toLowerCase()](data, callback)
  } else {
    callback(405, {
      message: 'Not an acceptable method'
    }) //ha sido juankeado por hackerman
  }
};
handlers._users = {};

handlers._users.post = function (data, callback) {
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim()
    .length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim()
    .length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim()
    .length == 10 ? data.payload.phone.trim() : false;
  var agreement = typeof (data.payload.agreement) == 'boolean' && data.payload.agreement == true ? data.payload.agreement : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim()
    .length > 0 ? data.payload.password : false;

  if (firstName && lastName && phone && agreement && password) {
    //hash the password....
    var hashPassword = helpers.hash(password);

    var userObj = {
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'agreement': true,
      'password': hashPassword
    };

    lib.create('users', phone, userObj, function (err) {
      if (err) {
        callback(500, {
          message: 'There was en error creating your user on the server side. Please try again later.'
        })
      } else {
        callback(200, {
          message: 'User created successfully. Now\'s probably a good time to create a token.'
        })
      }
    });

  } else {
    callback(405, {
      message: 'Missing fields'
    });
  }
};

handlers._users.get = function (data, callback) {
  var phone = typeof (data.query.phone) == 'string' ? data.query.phone : false;

  if (phone) {
    lib.read('users', phone, function (err, data) {
      if (err) {
        callback(404, {
          message: 'did not find user number'
        })
      } else {
        var dataObj = helpers.jsonToObj(data);

        delete dataObj.password;

        callback(200, dataObj)
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
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim()
    .length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim()
    .length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim()
    .length > 0 ? data.payload.password : false;

  var newPassword = typeof (data.payload.newPassword) == 'string' && data.payload.newPassword.trim()
    .length > 0 ? data.payload.newPassword : false;

  if (!phone || !password) {
    callback(404, {
      message: 'User phone and password are required'
    })
  } else {
    if (firstName || lastName || newPassword) {
      lib.read('users', phone, function (err, response) {
        if (err) {
          callback(405, {
            message: 'This user does not exist'
          })
        } else {
          var newUser = helpers.jsonToObj(response);

          if (helpers.hash(password) != newUser.password) {
            callback(405, {
              message: 'Password is incorrect'
            })
          } else {
            if (firstName) {
              newUser.firstName = firstName
            }
            if (lastName) {
              newUser.lastName = lastName
            }
            if (newPassword) {
              newUser.password = helpers.hash(newPassword)
            }

            lib.update('users', phone, newUser, function (err) {
              if (err) {
                callback(512, {
                  message: 'there was an error updating this user.'
                })
              } else {
                callback(200, {
                  message: 'User has been updated'
                })
              }
            })
          }
        }
      })
    } else {
      callback(405, {
        message: 'You must provide phone and another option to change'
      })
    }
  }

};

//ONLY AUTHENTICATED USER CAN DELETE HIS OWN ACCOUNT
handlers._users.delete = function (data, callback) {
  var phone = typeof (data.payload.phone) == 'string' ? data.payload.phone : false;
  var password = typeof (data.payload.password) == 'string' ? data.payload.password : false;

  if (phone && password) {
    lib.read('users', phone, function (err, userData) {
      userObj = helpers.jsonToObj(userData);

      if (userObj.password == helpers.hash(password)) {
        lib.delete('users', phone, function (err) {
          if (err) {
            callback(500, {
              message: 'There was a problem deleting this user, as it may not exist. '
            })
          } else {
            var userToken = typeof( userObj.token.key ) == 'string' ? userObj.token.key : false;
            var userChecks = typeof( userObj.checks ) == 'object' && userObj.checks.length > -1 ? userObj.checks : false;
            
            /*Clearing all user history*/
            if ( userToken ) {
              lib.delete('tokens',userToken,function(err){
                if (err) {
                  console.error(err)
                }
              })
            };

            if ( userChecks ) {
              for (let i = 0; i < userChecks.length; i++ ) {
                lib.delete('checks',userChecks[i],function(err){
                  if(err){
                    console.error(err)
                  }
                })
              }
            };

            callback(200, {
              message: 'User deleted'
            })
          }
        });
      } else {
        callback(403, {
          message: 'Incorrect password'
        })
      }
    });

  } else {
    callback(404, {
      message: 'missing field'
    })
  }
};

handlers.tokens = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'delete', 'put'];

  if (acceptableMethods.indexOf(data.method.toLowerCase()) > -1) {
    handlers._tokens[data.method.toLowerCase()](data, callback);
  } else {
    callback(400, {
      message: 'Not an acceptable method'
    })
  }
};
handlers._tokens = {};

handlers._tokens.post = function (data, callback) {
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim()
    .length == 10 ? data.payload.phone : false;
  var password = typeof (data.payload.password) == 'string' ? data.payload.password : false;

  if (phone && password) {
    lib.read('users', phone, function (err, userData) {
      var userObj = helpers.jsonToObj(userData);

      if (helpers.hash(password) == userObj.password && !userObj.token) {
        var tokenObj = {};
        tokenObj.key = helpers.randomStringGenerator();
        tokenObj.expiration = Date.now() * 1000 * 60 * 60;
        tokenObj.phone = phone;

        userObj.token = tokenObj;

        lib.create('tokens', tokenObj.key, tokenObj, function (err) {
          if (err) {
            callback(500, {
              message: 'There was an error creating this token - you probably already have on. If such case, try updating it.'
            });
          } else {
            lib.update('users', phone, userObj, function (err) {
              if (err) {
                callback(500, {
                  message: 'error updating user token'
                })
              } else {
                callback(200, {
                  message: 'Created token, please save it and dont share it!',
                  token: tokenObj.key
                });
              }
            })

          }
        });
      } else if (helpers.hash(password) != userObj.password) {
        callback(400, {
          message: 'Incorrect password'
        })
      } else {
        callback(400, {
          message: 'You already have a token. Try updating it instead.'
        })
      }
    });
  } else {
    callback(400, {
      message: 'You need to provide proper input'
    })
  }
}

handlers._tokens.put = function (data, callback) {
  var tokenKey = typeof (data.payload.token) == 'string' ? data.payload.token : false;
  var password = typeof (data.payload.password) == 'string' ? data.payload.password : false;

  if (tokenKey && password) {

    lib.read('tokens', tokenKey, function (err, keyData) { //fetches the user from the key
      if (err) {
        callback(400, {
          message: 'This token key does not exist'
        })
      } else {
        var oldKey = helpers.jsonToObj(keyData);
        var userPhone = oldKey.phone;

        var newTokenObj = {};
        newTokenObj.key = helpers.randomStringGenerator();
        newTokenObj.expiration = Date.now() * 1000 * 60 * 60;
        newTokenObj.phone = userPhone;

        lib.read('users', userPhone, function (err, userData) { //reads the user file and ->
          userObj = helpers.jsonToObj(userData);
          updatedUser = userObj;
          updatedUser.token = newTokenObj;

          if (userObj.password == helpers.hash(password)) { //authenticates password ->
            lib.delete('tokens', oldKey.key, function (err) { //deletes old token files ->
              if (err) {
                callback(500, {
                  message: 'Error deleting token'
                })
              } else {
                lib.create('tokens', newTokenObj.key, newTokenObj, function (err) { //creates new token file ->
                  if (err) {
                    callback(405, {
                      message: 'Fatal error creating key'
                    })
                  } else {
                    delete updatedUser.token.phone
                    lib.update('users', userPhone, updatedUser, function (err) { //updates token on user file ->
                      if (err) {
                        callback(405, {
                          message: 'There was an error updating your user'
                        })
                      } else {
                        callback(200, {
                          message: 'Updated your user token. Please save it and dont share it!',
                          token: newTokenObj.key
                        })
                      }
                    });

                  }
                })
              }
            });
          } else {
            callback(400, {
              message: 'Incorrect password'
            })
          }

        });
      }

    })



  } else {
    callback(400, {
      message: 'Must provide a token key and password'
    })
  }
};

handlers._tokens.get = function (data, callback) {
  var phone = typeof (data.query.phone) == 'string' ? data.query.phone : false;
  var password = typeof (data.query.password) == 'string' ? data.query.password : false;

  if (phone && password) {
    lib.read('users', phone, function (err, userData) {
      var userObj = helpers.jsonToObj(userData);
      if (helpers.hash(password) == userObj.password) {
        callback(200, {
          token: userObj.token.key
        })
      } else {
        callback(400, {
          message: 'Incorrect password'
        })
      }
    })
  } else {
    callback(400, {
      message: 'You must provide your password and phone'
    })
  }
};



handlers.checks = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'delete'];
  if (acceptableMethods.indexOf(data.method.toLowerCase()) > -1) {
    handlers._checks[data.method.toLowerCase()](data, callback)
  } else {
    callback(405, {
      message: 'Not an acceptable method'
    }) //ha sido juankeado por hackerman
  }
};
handlers._checks = {};

handlers._checks.post = function (data, callback) {
  var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof (data.payload.url) == 'string' ? data.payload.url : false;
  var method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
  var timeOut = typeof (data.payload.timeOut) == 'number' && data.payload.timeOut < 5 ? data.payload.timeOut : false;

  if (protocol && url && method && successCodes && timeOut) {
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    lib.read('tokens', token, function (err, tokenData) {
      if (err) {
        callback(403, {
          message: 'Token not found.'
        })
      } else {
        var tokenObj = helpers.jsonToObj(tokenData);
        var userPhone = tokenObj.phone;

        lib.read('users', userPhone, function (err, userData) {
          if (err) {
            callback(403, {
              message: 'User does not exist'
            })
          } else {
            userObj = helpers.jsonToObj(userData);
            userChecks = typeof (userObj.checks) == 'object' && userObj.checks instanceof Array ? userObj.checks : [];
            if (userChecks.length < config.maxChecks) {
              var checkId = helpers.randomStringGenerator();

              var checkObj = {
                'id': checkId,
                'phone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeOut': timeOut
              };

              lib.create('checks', checkId, checkObj, function (err) {
                if (err) {
                  callback(500, {
                    message: 'Could not create user check'
                  })
                } else {
                  userObj = helpers.jsonToObj(userData);
                  userObj.checks = userChecks;
                  userObj.checks.push(checkId);

                  lib.update('users', userPhone, userObj, function (err) {
                    if (err) {
                      callback(500, {
                        message: 'Theres been an error updating your user checks record'
                      })
                    } else {
                      callback(200, {
                        message: 'Successfully created check'
                      })
                    }
                  })
                }
              });
            } else {
              callback(403, {
                message: 'You have reached the maximum amount of checks'
              })
            }
          }
        })
      }
    })
  } else {
    callback(405, {
      message: 'One of more of your fields are invalid'
    })
  }
}

handlers._checks.get = function (data, callback) {
  var id = typeof (data.query.id) == 'string' ? data.query.id : false;

  if (id) {
    lib.read('checks', id, function (err, checkData) {
      if (err) {
        callback(404)
      } else {
        var checkObj = helpers.jsonToObj(checkData);
        callback(200, {
          message: 'This check belongs to ' + checkObj.phone
        })
      }

    });
  } else {
    callback(405, {
      message: 'You need to provide a check id'
    })
  }
};

handlers._checks.delete = function (data, callback) {
  var id = typeof(data.payload.id) == 'string' ? data.payload.id : false;

  if (id) {
    lib.read('checks', id, function (err, checkData){
      var checkObj = helpers.jsonToObj(checkData);

      lib.read('users', checkObj.phone, function (err, userData) {
        if (err) {
          callback(400,{
            message:'Could not delete check from user records. It probably doesnt exist.'
          })
        } else {
          var userObj = helpers.jsonToObj( userData );
          var checkIndex = userObj.checks.indexOf( checkObj.id );

          userObj.checks.splice(checkIndex,1);

          lib.update('users', userObj.phone, userObj, function (err) {
            if (err) {
              callback({
                message: 'Could not update user check history'
              })
            } else {
              lib.delete('checks',id,function (err){
                if(err){
                  callback(400,{
                    message:'Could not delete this check. It probably doesnt exist'
                  })
                } else {
                  callback(200,{
                    message:'Removed check from history.'
                  })
                }
              })
            }
          })
        }
      })
    })
  } else {
    callback(400,{
      message: 'You must provide an id'
    })
  }
}

handlers.notfound = function (data, callback) {
  callback(404);
};

module.exports = handlers;