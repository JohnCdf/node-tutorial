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

