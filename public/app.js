var app = {};

app.config = {
  'sessionToken' : false
};

app.client = {};

app.client.request = function ( headers, path, method, queryStringObj, payload, callback ) {
  var requestUrl = path + '?';
  var counter = 0;
  
  for ( queryKey in queryStringObj) {
    if(queryStringObj.hasOwnProperty(queryKey)){
      counter++;
      if(counter > 1){
        requestUrl+='&'
      }

      requestUrl += queryKey + '=' + queryStringObj[queryKey];
    }
  };

  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-Type" , "application/json");

  for ( headerKey in headers ) {
    if (header.hasOwnProperty(headerKey)){
      xhr.setRequestHeader(headerKey , headers[headerKey])
    }
  };

  if ( app.config.sessionToken ) {
    xhr.setRequestHeader("token" , app.config.sessionToken.id );
  }



  xhr.onreadystatechange = function () {
    if( xhr.readyState === XMLHttpRequest.DONE ) {
      var statusCode = xhr.status;
      var response = xhr.responseText;

      callback ? callback( statusCode , JSON.parse(response) ) : console.log('http request is done')
    }
  }


  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString)
};



app.bindForm = function () {
  document.querySelector("form").addEventListener("submit", function(event) {
    event.preventDefault();
    
    var formId = this.id;
    var path = this.action;
    var method = this.method.toUpperCase();

    document.querySelector("#"+formId+" .formError").style.display = 'hidden';

    var payload = {};

    var elements = this.elements

    for(i=0;i<elements.length;i++){
      if(elements[i].type!=='submit'){
        var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
        payload[elements[i].name] = valueOfElement;
      }
    }
  })
};
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
  var functionToCall = false;
  if(formId == 'accountCreate'){
    // @TODO Do something here now that the account has been created successfully
  }
};