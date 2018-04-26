/*

A helper to lend us a hand in some tasks

*/
var crypto = require('crypto');
var queryString = require('querystring');
var https = require('https');

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
module.exports = helpers;