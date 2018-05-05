var app = {};

// Config
app.config = {
  'sessionToken' : false
};

app.client = {}

app.client.request = function(headers,path,method,queryStringObject,payload,callback){

  headers = typeof(headers) == 'object' && headers !== null ? headers : {};
  path = typeof(path) == 'string' ? path : '/';
  method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof(payload) == 'object' && payload !== null ? payload : {};
  callback = typeof(callback) == 'function' ? callback : false;

  var requestUrl = path+'?';
  var counter = 0;
  for(var queryKey in queryStringObject){
     if(queryStringObject.hasOwnProperty(queryKey)){
       counter++;

       if(counter > 1){
         requestUrl+='&';
       }
       requestUrl+=queryKey+'='+queryStringObject[queryKey];
     }
  }

  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  for(var headerKey in headers){
     if(headers.hasOwnProperty(headerKey)){
       xhr.setRequestHeader(headerKey, headers[headerKey]);
     }
  }

  if(app.config.sessionToken){
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        var statusCode = xhr.status;
        var responseReturned = xhr.responseText;

        if(callback){
          try{
            var parsedResponse = JSON.parse(responseReturned);
            callback(statusCode,parsedResponse);
          } catch(e) {
            callback(statusCode,false);
          }

        }
      }
  }

  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

};

app.bindForms = function(){
  if(document.querySelector("form")){
    
    document.querySelector("form").addEventListener("submit", function(e){

      // Stop it from submitting
      e.preventDefault();
      var formId = this.id;
      var path = this.action;
      var method = this.method.toUpperCase();

      document.querySelector("#"+formId+" .formError").style.display = 'hidden';

      var payload = {};
      var elements = this.elements;
      for(var i = 0; i < elements.length; i++){
        if(elements[i].type !== 'submit'){
          var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
          payload[elements[i].name] = valueOfElement;
        }
      }

      app.client.request(undefined,path,method,undefined,payload,function(statusCode,responsePayload){
        
        if(statusCode!=200){
          var error = typeof(responsePayload.message) == 'string' ? responsePayload.message : 'An error has occured, please try again';

          document.querySelector("#"+formId+" .formError").innerHTML = error;

          document.querySelector("#"+formId+" .formError").style.display = 'block';

        } else {
          app.formResponseProcessor(formId,payload,responsePayload);
        }

      });
    });
  }
};


app.formResponseProcessor = function(formId,requestPayload,responsePayload){
  var functionToCall = false;

  if(formId == 'accountCreate'){
    var newPayload = {
      'phone' : requestPayload.phone,
      'password' : requestPayload.password
    };

    app.client.request(undefined,'api/tokens','POST',undefined,newPayload,function(newStatusCode,newResponsePayload){
      // Display an error on the form if needed
      if(newStatusCode !== 200){

        document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

        document.querySelector("#"+formId+" .formError").style.display = 'block';

      } else {
        app.setSessionToken(newResponsePayload);
        window.location = '/checks/all';
      }
    });
  }

  if(formId == 'sessionCreate'){
    app.setSessionToken(responsePayload);
    window.location = '/checks/all';
  }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function(){
  var tokenString = localStorage.getItem('token');
  if(typeof(tokenString) == 'string'){
    try{
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if(typeof(token) == 'object'){
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    }catch(e){
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token){
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem('token',tokenString);
  if(typeof(token) == 'object'){
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// Renew the token
app.renewToken = function(callback){
  var currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
  if(currentToken){
    // Update the token with a new expiration
    var payload = {
      'id' : currentToken.id,
      'extend' : true,
    };
    app.client.request(undefined,'api/tokens','PUT',undefined,payload,function(statusCode,responsePayload){
      // Display an error on the form if needed
      if(statusCode == 200){
        // Get the new token details
        var queryStringObject = {'id' : currentToken.id};
        app.client.request(undefined,'api/tokens','GET',queryStringObject,undefined,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode == 200){
            app.setSessionToken(responsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
      } else {
        app.setSessionToken(false);
        callback(true);
      }
    });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Loop to renew token often
app.tokenRenewalLoop = function(){
  setInterval(function(){
    app.renewToken(function(err){
      if(!err){
        console.log("Token renewed successfully @ "+Date.now());
      }
    });
  },1000 * 60);
};

app.logUserOut = function () {
  var tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

  if(tokenId) {
    var queryStringObject = {
      token: tokenId
    }

    app.client.request(undefined, 'api/tokens', 'DELETE', queryStringObject, undefined, function (err,payload){
      if(!err){
        app.setLoggedInClass(false);
        window.location = 'session/deleted'
      } else {
        alert("There was an error logging you out. Please try again later :(")
      }
    })
  } else {
    window.location = '/home'
  }
};

app.init = function(){

  app.bindForms();

  app.getSessionToken();

  app.tokenRenewalLoop();

};

// Call the init processes after the window loads
window.onload = function(){
  app.init();
};