$(document).ready(function() {
    $('#kbMenuToggler').click(function () {
        $('body').toggleClass('mobile');
    });

    //setTimeout(function () { $('#kbMenuToggler').click(); }, 500); // FIXME: only for test!
    
    $(window).resize(function (){
        if ($('body').hasClass('mobile') && $(window).innerWidth() > 752) { // magic-number 752 = 768 - 2 * 8px (window borders)
            // collapse all open submenus in mobile menu, and close off canvas menu
            $('body').removeClass('mobile');
        }
    });
    
    //scrollspy
    $(window).scroll(function (e) {
        var topNavigation = $('.topnavigation'),
            scrollTop = $(window).scrollTop();
console.log('scrollTop: ', scrollTop);
        if (topNavigation.hasClass('minified')) {
            if (scrollTop <= 100) {
                topNavigation.removeClass('minified');
            }
        } else {
            if (scrollTop > 100) {
                topNavigation.addClass('minified');
            }
        }
    });
});

