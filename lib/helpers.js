/*

A helper to lend us a hand in some tasks

*/
var crypto = require('crypto');
var queryString = require('querystring');
var https = require('https');
var path = require('path');
var fs = require('fs');

var config = require('../config');

var helpers = {}

helpers.hash = function(str){
    if(typeof(str)=='string' && str.length > 0){
        var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash
    } else {
        throw err
    }
};

helpers.jsonToObj = function(str){
    try {
        var parsed = JSON.parse(str);
        return parsed;
    } catch (error) {
        return {}
    }
};
helpers.randomStringGenerator = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 20; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
helpers.sendTwilioSms = function(phone,msg,callback){
    var phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone : false;
    var msg = typeof(msg) == 'string' && msg.length < 1600 ? msg : false;

    if(phone && msg) {
        var payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+1' + phone,
            'Body' : msg
        }

        var stringPayload = queryString.stringify(payload);
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        var request = https.request(requestDetails, function (response) {
            if(response.statusCode == 200 || response.statusCode == 201){
                callback(null)
            } else {
                callback(response.statusCode)
            }
        });
        request.on('error',function(error){
            callback(error);
        });
        request.write(stringPayload);
        request.end();
    } else {
        callback(403,{message:'Given parameters are invalid'})
    }
};

/* Will return an interpolated and Templated HTML */
helpers.getTemplate = function ( name, templateData, callback ) {
    fs.readFile(  path.join(__dirname + '/../templates/' + name + '.html') , 'utf-8' , function ( err, string ) {
        var interpolated = helpers.interpolate(string,templateData);
        err? callback(true) : callback(false, interpolated);
    });
};

/* Add universal templates to our file */
helpers.universalTemplates = function ( content, templateData, callback ) {
    var header = helpers.getTemplate('_header', templateData, function(err, headerHTML){
        var footer = helpers.getTemplate('_footer', templateData, function (err, footerHTML){
            var fullTemplate = headerHTML + content + footerHTML;
            callback(false, fullTemplate)
        });
    });
};

/* Is responsible for interpolating the HTML to be rendered with corresponding templateData */
helpers.interpolate = function ( string , templateData ) {
    for(let keyName in config.templateGlobals) {
        if(config.templateGlobals.hasOwnProperty(keyName)){
            templateData['global.'+keyName] = config.templateGlobals[keyName]
        }
    };

    for(let key in templateData) {
        if(templateData.hasOwnProperty(key)) { 
            var replaceWith = templateData[key];
            var find = '{'+key+'}';
            
            string = string.replace(find, replaceWith);
        }
    }
    return string
};

helpers.getStaticAsset = function (name, callback) {
    var publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+name, "utf-8", function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        callback(true,'No file could be found');
      }
    });
};

helpers.determineContentType = function (filename){
    if ( filename.indexOf('.html') > -1) {
        return 'text/html'
    } else if ( filename.indexOf('.json') > -1) {
        return 'application/json'
    } else if (filename.indexOf('.css') > -1) {
        return 'text/css'
    } else if ( filename.indexOf('.png') > -1) {
        return 'image/png'
    } else if ( filename.indexOf('.jpg') > -1) {
        return 'image/jpeg'
    } else if ( filename.indexOf('.ico') > -1) {
        return 'image/x-icon'
    } else {
        return 'text/plain'
    }

}
module.exports = helpers;