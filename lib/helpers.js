/*

A helper to lend us a hand in some tasks

*/
var crypto = require('crypto');
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

module.exports = helpers;