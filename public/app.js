var app = {};

// Config
app.config = {
  'sessionToken' : false
};

app.init = function () {

  app.bindForms ();/*This function will addEventListeners for when forms are submitted*/

  app.getSessionToken ();/*Then, we will look in the users localstorage for a session token (is logged in)*/

  app.loadPageData ();

  $("#nav-icon").on('click', function () {
    menuAnimation()
  });
  
};

app.bindForms = function () {

  $("form").each(function(){
    $(this).submit(function(event){
      
      event.preventDefault()

      var formId = this.id;
      var path = this.action;
      var method = this.method.toUpperCase();

      
      var payload = {};
      var elements = this.elements;

      for(i = 0; i < elements.length; i++){
        if(elements[i].type !== 'submit'){
          var valueOfElement = ''; 

          if (elements[i].type == 'checkbox'){
            valueOfElement = elements[i].checked
          }
          else if(elements[i].name == 'phone'){
            valueOfElement = elements[i].value.trim().replace('(','').replace(')','').replace(/-/g, '')
          }
          else if (elements[i].name == '_method'){
            method = elements[i].value
          }
          else {
            valueOfElement = elements[i].value;
          }
          
          payload[elements[i].name] = valueOfElement;
        }
      };

      axios({
        method: method,
        url: path,
        data: payload
      }).then( (response) => {
        app.formResponseProcessor(formId, payload, response.data);
      })
      .catch( (error) => {
        var errorResponse = JSON.parse(error.request.response);
        $(".formWrapper .formError").html(errorResponse.message)
      });

    })
  });
  
};

app.getSessionToken = function () {
  var tokenString = localStorage.getItem('token');
  if(typeof(tokenString) == 'string'){
    try{
      var token = JSON.parse(tokenString);

      app.config.sessionToken = token;
      if(typeof(token) == 'object'){
        if(token.expiration < Date.now()){
          app.setLoggedInClass(false);
        } else {
          app.setLoggedInClass(true);
        }
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

app.setLoggedInClass = function (add) {
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
      app.setSessionToken(response.data);
      window.location = '/popular';
    })
    .catch ( function ( error ) {
      $(".formError").text('Sorry, an error has occured. Please try again.');
    });

  }

  if(formId == 'sessionCreate'){
    app.setSessionToken(response);
    window.location = '/dashboard';
  }

  console.log(formId)
  if(formId == 'accountEdit') {
    $(".formError").text("Saved Changes!")
  }

};


app.setSessionToken = function ( token ) {

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
  var token = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;

    axios({
      method: 'delete',
      url: 'api/tokens',
      data: token
    })
    .then (function(){
      localStorage.removeItem('token');
      app.setLoggedInClass(false);
        window.location = '/home'
    })
    .catch(function(error){
      console.log(error)
    })
    
  
};

app.loadPageData = function () {
  if( $("body").hasClass("accountEdit") ) {
    app.loadAccountEdit()
  } else if ( $("body").hasClass("dashboard") ) {

  }
};

app.loadAccountEdit = function(){
  axios.get('api/users?phone='+app.config.sessionToken.phone)
  .then ( function (response) {
    $(".accountEdit .firstNameInput").val(response.data.firstName);
    $(".accountEdit .lastNameInput").val(response.data.lastName);
    $(".accountEdit .phoneInput").val(response.data.phone);
  })
  .catch ( function (error) {
    console.log(error)
    window.location = '/err'
  })

};

app.showPassword = function (event){
  var passwordInput = $(event).prev();
  var type = passwordInput[0].type;

  if (type == 'password') {
    passwordInput[0].type = 'text'
  } else {
    passwordInput[0].type = 'password'
  }
};

window.onload = function(){
  
  app.init();
};
