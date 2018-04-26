var path = require('path');
var fs = require('fs');
var https = require('https');
var http = require('https');
var url = require('url');

var lib = require('./data');
var helpers = require('./helpers');

var workers = {};

workers.init = function(){
  workers.gatherAllChecks();
  workers.loop();
};

workers.gatherAllChecks = function(){
  lib.list('checks', function(err,checks){
    if(err){
      console.log('error loading from check dir')
    }else{
      checks.forEach(check => {

        lib.read(['checks',check],function(err,checkInfo){
          console.log(checkInfo)
          workers.validateCheck(checkInfo)
        })

      });
    }
  });
};

workers.loop = function(){
  setInterval(function(){
    workers.gatherAllChecks()
  },1000);
};

workers.validateCheck = function(checkData){
  var check = typeof(checkData) == 'object' ? true : false;
  check ? workers.performCheck(checkData) : console.log('Invalid Check')
};

workers.performCheck = function (checkData) {//45 - 65
  var outcomeSent = false;
  var checkOutcome = {
    'error' : false,
    'responseCode' : false
  };

  var parsedUrl = url.parse(checkData.protocol + '://' + checkData.url, true);

  var requestDetails = {
    'protocol' : checkData.protocol+':',
    'hostname' : parsedUrl.hostname,
    'method' : checkData.method.toUpperCase(),
    'path' : parsedUrl.path,
    'timeout' : checkData.timeOut * 1000
  };
  var moduleToUse = requestDetails.protocol == 'http:' ? http : https;
    try {
      var request = moduleToUse.request(requestDetails,function(res){
        checkOutcome.responseCode = res.statusCode;
      })
    } catch (error) {
      checkOutcome.error = error
    }


  checkOutcome.error ? workers.alertUser(checkData) : console.log('all is good');
  
};


workers.alertUser = function (checkInfo){
  helpers.sendTwilioSms(checkInfo.phone, 'Your check to ' + checkInfo.method.toUpperCase() + ' failed. It has been deleted',function(){
    console.log('alerted user')
  });
  lib.delete(['checks',checkInfo.id], function(){
    console.log('deleted check')
  })
};

module.exports = workers;