var app = {};

// Config
app.config = {
  'sessionToken' : false
};

app.init = function(){

  app.bindForms();/*This function will addEventListeners for when forms are submitted*/

  app.getSessionToken();/*Then, we will look in the users localstorage for a session token (is logged in)*/

};

app.bindForms = function(){
  if(document.querySelector("form")){
    document.querySelector("form").addEventListener("submit", function(event){

      event.preventDefault();

      var formId = this.id;
      var path = this.action;
      var method = this.method.toUpperCase();

      var payload = {};
      var elements = this.elements;

      for(i = 0; i < elements.length; i++){
        if(elements[i].type !== 'submit'){
          var valueOfElement; 

          if (elements[i].type == 'checkbox'){
            valueOfElement = elements[i].checked
          }
          else if(elements[i].name == 'phone'){
            valueOfElement = elements[i].value.trim('trim').replace('(','').replace(')','').replace('-','')
          }
          else {
            valueOfElement = elements[i].value;
          }
          
          payload[elements[i].name] = valueOfElement;
        }
      }


      var promise = axios({
        method: method,
        url: path,
        data: payload
      })

      promise.then( (response) => {
        app.formResponseProcessor(formId, payload, response.data);
      });
      promise.catch( (error) => {
        errorMessage = JSON.parse(error.request.response);
        document.querySelector(".formWrapper .formError").innerHTML = errorMessage.message
      });

    });
  }
};

app.getSessionToken = function(){/*If localStorage has valid tokenObj, app.config.sessionToken is set to it*/
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
    }
    catch(e){
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

app.formResponseProcessor = function (formId, request, response) {
  var functionToCall = false;
  if(!response){
    return
  }
  if(formId == 'accountCreate'){
    var newPayload = {
      'phone' : request.phone,
      'password' : request.password
    };

    axios.post('api/tokens', newPayload)

    .then ( function ( response ) {
      app.setSessionToken(response);
      window.location = '/checks/all';
    })
    .catch ( function ( error ) {
      document.querySelector(".formWrapper .formError").innerHTML = 'Sorry, an error has occured. Please try again.';
    });

  }

  if(formId == 'sessionCreate'){
    app.setSessionToken(response);
    window.location = '/dashboard';
  }
};


app.setSessionToken = function( token ) {
  
  app.config.sessionToken = token;

  var tokenString = JSON.stringify(token);
  localStorage.setItem('token',tokenString);

  if(typeof(token) == 'object'){
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
  
};

app.logUserOut = function () {
  var tokenId = typeof(app.config.sessionToken.token) == 'object' ? app.config.sessionToken.token.key : false;

    axios({
      method: 'delete',
      url: 'api/tokens',
      data: {
        tokenId:tokenId
      }
    });

    localStorage.removeItem('token');
      app.setLoggedInClass(false);
        window.location = '/home'
  
};


window.onload = function(){
  app.init();
};
