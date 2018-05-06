function menuAnimation() {
  $("#nav-icon").toggleClass('active');
  $(".menu").toggleClass('active');
  $(".menu_nav").toggleClass('active');

  var interval = 0;

  var list = $(".menu_nav").children();

  if($(list).children().hasClass('active')){
      $($(list).children().get().reverse()).each(function(){
          var element = $(this);
  
          setTimeout(function(){
              element.toggleClass('active');
          },interval);
  
          interval+=35;
  
      })
  } else {
      $(list).children().each(function(){
          var element = $(this);
  
          setTimeout(function(){
              element.toggleClass('active');
          },interval);
  
          interval+=35;
  
      })
  }
}


