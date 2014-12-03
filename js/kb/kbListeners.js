$(document).ready(function() {
    // on the very first click of the kbMenuToggler, fetch all submenus
    $('#kbMenuToggler').one('click', function () {
        kbMenu.fetchSubMenus($('.kb-navbar-mobile'));
        $('body').toggleClass('showMenu');
        // kbMenuToggler click slide mobile menu into view
        $('#kbMenuToggler').click(function () {
            $('body').toggleClass('showMenu');
        });
    });

    //setTimeout(function () { $('#kbMenuToggler').click(); }, 500); // FIXME: only for test!

    var MOBILESTR = 'mobile',
        TABLETSTR = 'tablet',
        DESKTOPSTR = 'desktop',
        $body = $('body'),
        $topnavigation = $('.topnavigation'),
        $kbNavbarContainer = $('.kb-navbar-container'),
        MOBILE = 752, // magic-number 752 = 768 - 2 * 8px (window-borders?)
        TABLET = 977, // magic-number 976 = 992 - 2 * 8px
        initialWidth = $(window).innerWidth(); // FIXME: switch to outerWidth instead?
    window.kbModus = initialWidth < MOBILE ? MOBILESTR : initialWidth < TABLET ? TABLETSTR : DESKTOPSTR; // in window.kbModus we keep track of mobile/tablet/desktop width

    var setModus = function (modus) {
        $('body').removeClass(window.kbModus);
        window.kbModus = modus;
        $('body').addClass(window.kbModus);
    };

    /**
     * Ajust header height according to scrollTop and screen width
     * We have 3 different sizes of headers: normal (big), mini and micro
     * normal is with huge logo, logotype and horizontal menu
     * mini is with little logo, logotype and a menu button, and
     * micro is with little logo and horizontal menu
     * if the screen is desktop width, the header should be normal until 100px down scrolled, where it should change to micro
     * if the screen is tablet or mobile width, the header should be mini (it won't get micro when scrolling down, since it is no longer fixed at top
     */
    var ajustHeaderHeight = function () {
        var scrollTop = $(window).scrollTop(),
            $body = $('body');
        if (kbModus === DESKTOPSTR) {
            if (scrollTop <= 100) {
                if ($kbNavbarContainer.hasClass('micro')) {
                    $kbNavbarContainer.removeClass('micro');
                }
            } else {
                if (!$kbNavbarContainer.hasClass('micro')) {
                    $kbNavbarContainer.addClass('micro');
                }
            }
        } else {
            if (!$kbNavbarContainer.hasClass('mini')) {
                $kbNavbarContainer.addClass('mini');
            }
        }
        // ajust top margin to fit alert + header
        var alertHeight = $('section.alert', $topnavigation).outerHeight(),
            allNavHeaderHeight =  alertHeight + $('section.kb-navbar-container', $topnavigation).outerHeight();
        if ($body.hasClass('desktop')) { // body.desktop
            if (allNavHeaderHeight !== $('body').data('margin-top')) {
                $body.css('margin-top', allNavHeaderHeight);
                $body.data('margin-top', allNavHeaderHeight);
            }
        } else { // body.tablet or body.mobile
            if ($('body').data('margin-top') !== 0) {
                $body.css('margin-top', 0);
                $body.data('margin-top', 0);
            }
        }
    }

    $body.addClass(kbModus); // Set the initial class on body

    $(window).resize(function (){
        var innerWidth = $(window).innerWidth();
        if (innerWidth < MOBILE) {
            if (kbModus !== MOBILESTR) {
                setModus(MOBILESTR);
                ajustHeaderHeight();
            }
        } else if (innerWidth < TABLET) {
            if (kbModus !== TABLETSTR) {
                $kbNavbarContainer.removeClass('micro').addClass('mini');
                setModus(TABLETSTR);
                ajustHeaderHeight();
            }
        } else {
            if (kbModus !== DESKTOPSTR) {
                if (kbModus === TABLETSTR) { // if we come from the tablet view, close menu (if it is present).
                    $body.removeClass('showMenu');
                }
                $kbNavbarContainer.removeClass('mini');
                setModus(DESKTOPSTR);
                ajustHeaderHeight();
            }
        }
    });

    // initialize the header size
    $('body').data('margin-top', 120); // initial margin-top : 120; // we keep the margin-top in data, to avoid having to set a new margin-top unless it is necessary
    ajustHeaderHeight();

    //scrollspy
    $(window).scroll(ajustHeaderHeight);
});

