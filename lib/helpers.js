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
        throw 'PASSWORD IS NOT VALID FOR HASH'
    }
};
helpers.jsonToObj = function(str){
    try {
        stringified = JSON.parse(str);
        return stringified;
    } catch (error) {
        return {}
    }
}
module.exports = helpers;