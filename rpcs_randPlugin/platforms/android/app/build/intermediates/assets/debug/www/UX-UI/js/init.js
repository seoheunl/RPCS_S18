(function($){
  $(function(){

    $('.button-collapse').sideNav();

  }); // end of document ready
})(jQuery); // end of jQuery name space


// Code for Hamberger Menu slider
$('document').ready(function(){
	$('.nav_class').click(function(){
		$('.left-menu').animate({left: '0px'});
		$('.left-background').css("display", "block");
	});
	$(document).on('click','.left-background',function(){
		$('.left-background').hide();
		$('.left-menu').animate({left: '-239px'});
	});
})